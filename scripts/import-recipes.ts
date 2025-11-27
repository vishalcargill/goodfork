import "dotenv/config";
import path from "node:path";
import { readFile } from "node:fs/promises";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, InventoryStatus, Prisma } from "../src/generated/prisma/client";

const DATABASE_URL = process.env.DATABASE_URL ?? "";

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined. Cannot import recipes.");
}

const INVENTORY_LOW_STOCK_PERCENT = Number(process.env.INVENTORY_LOW_STOCK_PERCENT ?? "0.35") || 0.35;
const INVENTORY_RESTOCK_LEAD_DAYS = Number(process.env.INVENTORY_RESTOCK_LEAD_DAYS ?? "5") || 5;
const INVENTORY_BASELINE_SERVINGS = Number(process.env.INVENTORY_BASELINE_SERVINGS ?? "12") || 12;

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const existingSlugs = new Set<string>();

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

async function bootstrapSlugSet() {
  const records = await prisma.recipe.findMany({ select: { slug: true } });
  records.forEach((entry: { slug: string }) => existingSlugs.add(entry.slug));
}

function ensureUniqueSlug(base: string): string {
  const safeBase = base || "recipe";
  let candidate = safeBase;
  let suffix = 1;

  while (existingSlugs.has(candidate)) {
    candidate = `${safeBase}-${suffix}`;
    suffix += 1;
  }

  existingSlugs.add(candidate);
  return candidate;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }

  if (typeof value === "string") {
    const numeric = parseFloat(value.replace(/[^0-9.]/g, ""));
    return Number.isFinite(numeric) ? numeric : null;
  }

  return null;
}

function parseMinutes(value: unknown): number | null {
  const parsed = parseNumber(value);
  return parsed ? Math.round(parsed) : null;
}

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function estimatePriceCents(ingredientCount: number, difficulty?: string | null): number {
  const base = 900 + ingredientCount * 120;
  const normalizedDifficulty = difficulty?.toLowerCase() ?? "";
  const difficultyLift = normalizedDifficulty.includes("easy") ? 0 : normalizedDifficulty.includes("hard") ? 400 : 200;
  return Math.min(3200, base + difficultyLift);
}

function deriveHighlights(calories: number | null, protein: number | null): string[] {
  const highlights: string[] = [];

  if (calories && calories <= 450) {
    highlights.push("LIGHTER_CHOICE");
  }

  if (protein && protein >= 25) {
    highlights.push("HIGH_PROTEIN");
  }

  return highlights;
}

function normalizeTags(...values: (string | null | undefined)[]): string[] {
  const tags = new Set<string>();

  values
    .map((entry) =>
      cleanText(entry ?? undefined)
        ?.toUpperCase()
        .replace(/\s+/g, "_")
    )
    .filter((entry): entry is string => Boolean(entry))
    .forEach((tag) => tags.add(tag));

  return Array.from(tags);
}

type KaggleRecipe = {
  id?: string;
  url?: string;
  image?: string;
  name?: string;
  description?: string;
  author?: string;
  rattings?: number | string;
  ratings?: number | string;
  ingredients?: unknown[];
  steps?: unknown[];
  nutrients?: Record<string, unknown> | null;
  times?: Record<string, unknown> | null;
  serves?: number | string;
  difficult?: string;
  difficulty?: string;
  vote_count?: number | string;
  subcategory?: string;
  dish_type?: string;
  maincategory?: string;
};

type InventoryComputationInput = {
  ratingCount: number | null;
  serves: number | null;
  difficulty: string | null;
};

function computeInventoryDefaults({ ratingCount, serves, difficulty }: InventoryComputationInput) {
  const normalizedServings = serves && serves > 0 ? serves : INVENTORY_BASELINE_SERVINGS;
  const popularityMultiplier = ratingCount ? Math.min(3.5, Math.max(1, ratingCount / 40)) : 1;
  const difficultyFactor = (() => {
    if (!difficulty) return 1;
    const normalized = difficulty.toLowerCase();
    if (normalized.includes("easy")) return 0.85;
    if (normalized.includes("hard")) return 1.2;
    return 1;
  })();
  const estimatedQuantity = Math.round(normalizedServings * 2 * popularityMultiplier * difficultyFactor);
  const safeQuantity = Math.max(0, estimatedQuantity);
  const lowStockThreshold = Math.max(5, Math.round(safeQuantity * INVENTORY_LOW_STOCK_PERCENT));

  let status: InventoryStatus = InventoryStatus.IN_STOCK;
  if (safeQuantity === 0) {
    status = InventoryStatus.OUT_OF_STOCK;
  } else if (safeQuantity <= lowStockThreshold) {
    status = InventoryStatus.LOW_STOCK;
  }

  const restockDate =
    status === InventoryStatus.OUT_OF_STOCK
      ? new Date(Date.now() + INVENTORY_RESTOCK_LEAD_DAYS * 24 * 60 * 60 * 1000)
      : null;

  return { quantity: safeQuantity, status, restockDate };
}

async function main() {
  const sourceFile = process.argv[2] ?? "data/recipes.json";
  const absolutePath = path.resolve(process.cwd(), sourceFile);

  await bootstrapSlugSet();

  const fileBuffer = await readFile(absolutePath, "utf-8");
  const payload = JSON.parse(fileBuffer) as KaggleRecipe[];

  if (!Array.isArray(payload)) {
    throw new Error("recipes JSON must be an array");
  }

  let created = 0;
  let updated = 0;

  for (const entry of payload) {
    const sourceId = entry.id ?? null;

    if (!sourceId) {
      console.warn("Skipping recipe without a source id", entry.name);
      continue;
    }

    const existing = await prisma.recipe.findUnique({ where: { sourceId } });

    const title = cleanText(entry.name) ?? "Untitled Recipe";
    const slug = existing?.slug ?? ensureUniqueSlug(slugify(title));
    const ingredients = (entry.ingredients ?? [])
      .map((ingredient) => cleanText(ingredient))
      .filter((value): value is string => Boolean(value));
    const instructions = (entry.steps ?? [])
      .map((step) => cleanText(step))
      .filter((value): value is string => Boolean(value));

    const calories = parseNumber(entry.nutrients?.kcal ?? entry.nutrients?.calories);
    const protein = parseNumber(entry.nutrients?.protein);
    const carbs = parseNumber(entry.nutrients?.carbs);
    const fat = parseNumber(entry.nutrients?.fat);

    const difficulty = entry.difficult ?? entry.difficulty ?? null;
    const priceCents = estimatePriceCents(ingredients.length, difficulty);
    const highlights = deriveHighlights(calories, protein);
    const ratingValue = parseNumber(entry.rattings ?? entry.ratings);
    const ratingCount = parseNumber(entry.vote_count);
    const serves = parseNumber(entry.serves);

    const recipeData = {
      slug,
      sourceId,
      sourceUrl: entry.url ?? null,
      author: entry.author ?? null,
      title,
      description: cleanText(entry.description),
      cuisine: cleanText(entry.maincategory ?? entry.subcategory ?? entry.dish_type),
      calories: calories ? Math.round(calories) : null,
      proteinGrams: protein ? Math.round(protein) : null,
      carbsGrams: carbs ? Math.round(carbs) : null,
      fatGrams: fat ? Math.round(fat) : null,
      priceCents,
      tags: normalizeTags(entry.dish_type, entry.maincategory, entry.subcategory),
      allergens: [],
      healthyHighlights: highlights,
      imageUrl: entry.image ?? null,
      ingredients,
      instructions,
      serves: serves ? Math.round(serves) : null,
      difficulty,
      prepTimeMinutes: parseMinutes(entry.times?.Preparation),
      cookTimeMinutes: parseMinutes(entry.times?.Cooking),
      averageRating: ratingValue,
      ratingCount: ratingCount ? Math.round(ratingCount) : null,
      dishType: entry.dish_type ?? null,
      mainCategory: entry.maincategory ?? null,
      subCategory: entry.subcategory ?? null,
      nutrients: (entry.nutrients as Prisma.JsonValue | null) ?? Prisma.DbNull,
      timers: (entry.times as Prisma.JsonValue | null) ?? Prisma.DbNull,
    };

    const record = await prisma.recipe.upsert({
      where: { sourceId },
      update: recipeData,
      create: recipeData,
    });

    const { quantity, status, restockDate } = computeInventoryDefaults({
      ratingCount: ratingCount ? Math.round(ratingCount) : null,
      serves: serves ? Math.round(serves) : null,
      difficulty,
    });

    await prisma.inventoryItem.upsert({
      where: { recipeId: record.id },
      update: { quantity, status, restockDate },
      create: {
        recipeId: record.id,
        quantity,
        unitLabel: "servings",
        status,
        restockDate,
      },
    });

    if (existing) {
      updated += 1;
    } else {
      created += 1;
    }
  }

  console.log(`Recipes imported. Created: ${created}, Updated: ${updated}`);
}

main()
  .catch((error) => {
    console.error("Recipe import failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import "dotenv/config";

import path from "node:path";
import { readFile } from "node:fs/promises";

import { PrismaPg } from "@prisma/adapter-pg";
import {
  InventoryStatus,
  Prisma,
  PrismaClient,
} from "../src/generated/prisma/client";

import {
  OPENAI_API_KEY,
  OPENAI_BASE_URL,
  RECOMMENDER_MODEL,
} from "../src/constants/app.constants";
import {
  ALLERGEN_OPTIONS,
  DIET_OPTIONS,
} from "../src/constants/personalization-options";
import { adminRecipeSchema } from "../src/schema/admin-recipe.schema";

type RawRecipe = {
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
  cuisine?: string;
  maincategory?: string;
};

type EnrichmentInput = {
  id: string;
  title: string;
  description: string | null;
  ingredients: string[];
  steps: string[];
  nutrients: Record<string, unknown> | null;
};

type EnrichmentOutput = {
  id: string;
  tags?: string[];
  allergens?: string[];
  healthyHighlights?: string[];
  dishType?: string | null;
  mainCategory?: string | null;
  subCategory?: string | null;
};

type NormalizedRecipe = {
  slug: string;
  sourceId: string;
  sourceUrl: string | null;
  author: string | null;
  title: string;
  description: string | null;
  cuisine: string | null;
  calories: number | null;
  proteinGrams: number | null;
  carbsGrams: number | null;
  fatGrams: number | null;
  priceCents: number;
  tags: string[];
  allergens: string[];
  healthyHighlights: string[];
  imageUrl: string | null;
  ingredients: string[];
  instructions: string[];
  serves: number | null;
  difficulty: string | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  averageRating: number | null;
  ratingCount: number | null;
  dishType: string | null;
  mainCategory: string | null;
  subCategory: string | null;
  nutrients: Prisma.InputJsonValue;
  timers: Prisma.InputJsonValue;
};

type InventoryDefaults = {
  quantity: number;
  status: InventoryStatus;
  restockDate: Date | null;
};

const DATABASE_URL = process.env.DATABASE_URL ?? "";

const ALLOWED_ALLERGENS = new Set(ALLERGEN_OPTIONS.map((entry) => entry.value));
const ALLOWED_DIETS = new Set(DIET_OPTIONS.map((entry) => entry.value));
const ALLOWED_HIGHLIGHTS = new Set([
  "HIGH_PROTEIN",
  "LIGHTER_CHOICE",
  "LOW_CARB",
  "PLANT_BASED",
  "OMEGA_3",
  "HEART_HEALTHY",
  "GUT_HEALTH",
  "WHOLE_GRAIN",
]);

const DEFAULT_INVENTORY_QUANTITY =
  Number(process.env.ENRICH_DEFAULT_QUANTITY ?? "10") || 10;
const DEFAULT_INVENTORY_UNIT = process.env.ENRICH_DEFAULT_UNIT ?? "plate";
const DEFAULT_RESTOCK_DAYS =
  Number(process.env.ENRICH_RESTOCK_DAYS ?? "5") || 5;

const BATCH_SIZE = Number(process.env.ENRICH_BATCH_SIZE ?? "10") || 10;

type CliOptions = {
  file: string;
  limit?: number;
  dryRun: boolean;
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    file: "data/recipes1.json",
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--file" && argv[i + 1]) {
      options.file = argv[i + 1];
      i += 1;
    } else if (arg === "--limit" && argv[i + 1]) {
      const parsed = Number(argv[i + 1]);
      if (Number.isFinite(parsed) && parsed > 0) {
        options.limit = parsed;
      }
      i += 1;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (!options.file && !arg.startsWith("--")) {
      options.file = arg;
    }
  }

  return options;
}

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined. Cannot enrich recipes.");
}

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

function computePriceCents(ingredientCount: number, difficulty?: string | null) {
  const base = 900 + ingredientCount * 120;
  const normalizedDifficulty = difficulty?.toLowerCase() ?? "";
  const difficultyLift = normalizedDifficulty.includes("easy")
    ? 0
    : normalizedDifficulty.includes("hard")
    ? 400
    : 200;
  return Math.min(3200, base + difficultyLift);
}

function deriveHighlights(calories: number | null, protein: number | null) {
  const highlights: string[] = [];

  if (calories && calories <= 450) {
    highlights.push("LIGHTER_CHOICE");
  }

  if (protein && protein >= 25) {
    highlights.push("HIGH_PROTEIN");
  }

  return highlights;
}

function normalizeEnumList(values: unknown, allowed: Set<string>) {
  if (!Array.isArray(values)) {
    return [];
  }

  const normalized = new Set<string>();

  values
    .map((entry) =>
      typeof entry === "string"
        ? entry
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "_")
        : null
    )
    .filter((entry): entry is string => Boolean(entry))
    .forEach((entry) => {
      if (allowed.has(entry)) {
        normalized.add(entry);
      }
    });

  return Array.from(normalized);
}

function deriveDeterministicTags(entry: RawRecipe): string[] {
  const tags = new Set<string>();

  [entry.dish_type, entry.maincategory, entry.subcategory]
    .map((value) => cleanText(value))
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toUpperCase().replace(/\s+/g, "_"))
    .forEach((value) => tags.add(value));

  return Array.from(tags);
}

function deriveDeterministicAllergens(entry: RawRecipe) {
  // Minimal heuristic: if ingredient line includes common allergens, tag them.
  const allergens = new Set<string>();
  const haystack = (entry.ingredients ?? [])
    .map((item) => (typeof item === "string" ? item.toLowerCase() : ""))
    .join(" ");

  const allergenKeywordMap: Record<string, string[]> = {
    DAIRY: ["milk", "cheese", "yogurt", "butter", "cream"],
    EGGS: ["egg"],
    FISH: ["salmon", "tuna", "cod", "trout", "fish"],
    SHELLFISH: ["shrimp", "prawn", "lobster", "crab", "shellfish"],
    SOY: ["soy", "tofu", "edamame", "soya", "soybean"],
    TREE_NUTS: ["almond", "walnut", "cashew", "pecan", "pistachio", "hazelnut"],
    PEANUTS: ["peanut"],
    GLUTEN: ["wheat", "flour", "barley", "rye", "breadcrumbs", "pasta"],
    SESAME: ["sesame", "tahini"],
  };

  Object.entries(allergenKeywordMap).forEach(([allergen, keywords]) => {
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      allergens.add(allergen);
    }
  });

  return Array.from(allergens);
}

function normalizeHighlights(values: unknown, fallback: string[]) {
  const normalized = normalizeEnumList(values, ALLOWED_HIGHLIGHTS);
  if (normalized.length) {
    return normalized;
  }
  return fallback;
}

function ensureArrayOfStrings(values: unknown[]): string[] {
  return values
    .map((entry) => cleanText(entry))
    .filter((value): value is string => Boolean(value));
}

function parseNutrients(nutrients: RawRecipe["nutrients"]) {
  const calories =
    parseNumber((nutrients as Record<string, unknown>)?.kcal) ??
    parseNumber((nutrients as Record<string, unknown>)?.calories) ??
    parseNumber((nutrients as Record<string, unknown>)?.cal);

  const protein = parseNumber((nutrients as Record<string, unknown>)?.protein);
  const carbs = parseNumber((nutrients as Record<string, unknown>)?.carbs);
  const fat = parseNumber((nutrients as Record<string, unknown>)?.fat);

  return {
    calories: calories ? Math.round(calories) : null,
    protein: protein ? Math.round(protein) : null,
    carbs: carbs ? Math.round(carbs) : null,
    fat: fat ? Math.round(fat) : null,
  };
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function callLLMEnrichment(
  inputs: EnrichmentInput[]
): Promise<EnrichmentOutput[]> {
  if (!OPENAI_API_KEY || !RECOMMENDER_MODEL) {
    return [];
  }

  const normalizedBase = OPENAI_BASE_URL.replace(/\/$/, "");

  const systemPrompt =
    "You enrich recipes for GoodFork. Reply ONLY with JSON: {\"recipes\":[{id,tags,allergens,healthyHighlights,dishType,mainCategory,subCategory}]}. " +
    "Allowed allergens: " +
    `${Array.from(ALLOWED_ALLERGENS).join(", ")}. ` +
    "Allowed diet tags: " +
    `${Array.from(ALLOWED_DIETS).join(", ")}. ` +
    "Allowed highlights: " +
    `${Array.from(ALLOWED_HIGHLIGHTS).join(", ")}. ` +
    "Prefer concise lists (<=6 items each). Diet tags should use uppercase snake case. Ignore unknown fields.";

  const userPrompt = JSON.stringify({
    recipes: inputs.map((entry) => ({
      id: entry.id,
      title: entry.title,
      description: entry.description,
      ingredients: entry.ingredients.slice(0, 15),
      steps: entry.steps.slice(0, 8),
      nutrients: entry.nutrients,
    })),
  });

  const response = await fetch(`${normalizedBase}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: RECOMMENDER_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.warn("LLM enrichment failed", response.status, text);
    return [];
  }

  const completion = await response.json();
  const message = completion?.choices?.[0]?.message?.content;
  if (!message) {
    return [];
  }

  try {
    const parsed = JSON.parse(message) as { recipes?: EnrichmentOutput[] };
    return parsed.recipes ?? [];
  } catch (error) {
    console.warn("Failed to parse LLM response", error);
    return [];
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const absolutePath = path.resolve(process.cwd(), args.file);

  await bootstrapSlugSet();

  const fileBuffer = await readFile(absolutePath, "utf-8");
  const payload = JSON.parse(fileBuffer) as RawRecipe[];

  if (!Array.isArray(payload)) {
    throw new Error("recipes JSON must be an array");
  }

  const baseRecipes: NormalizedRecipe[] = payload
    .map((entry) => {
      const sourceId = entry.id ?? null;
      if (!sourceId) {
        return null;
      }

      const title = cleanText(entry.name) ?? "Untitled Recipe";
      const slug = ensureUniqueSlug(slugify(title));
      const ingredients = ensureArrayOfStrings(entry.ingredients ?? []);
      const instructions = ensureArrayOfStrings(entry.steps ?? []);

      const { calories, protein, carbs, fat } = parseNutrients(entry.nutrients);
      const fallbackHighlights = deriveHighlights(calories, protein);

      return {
        slug,
        sourceId,
        sourceUrl: entry.url ?? null,
        author: cleanText(entry.author),
        title,
        description: cleanText(entry.description),
        cuisine: cleanText(entry.cuisine ?? entry.maincategory ?? entry.subcategory),
        calories,
        proteinGrams: protein,
        carbsGrams: carbs,
        fatGrams: fat,
        priceCents: computePriceCents(ingredients.length, entry.difficult ?? entry.difficulty),
        tags: deriveDeterministicTags(entry),
        allergens: deriveDeterministicAllergens(entry),
        healthyHighlights: fallbackHighlights,
        imageUrl: entry.image ?? null,
        ingredients,
        instructions,
        serves: parseNumber(entry.serves) ? Math.round(parseNumber(entry.serves)!) : null,
        difficulty: entry.difficult ?? entry.difficulty ?? null,
        prepTimeMinutes: parseMinutes(
          (entry.times as Record<string, unknown> | null)?.Preparation ??
            (entry.times as Record<string, unknown> | null)?.preparation
        ),
        cookTimeMinutes: parseMinutes(
          (entry.times as Record<string, unknown> | null)?.Cooking ??
            (entry.times as Record<string, unknown> | null)?.cooking
        ),
        averageRating: parseNumber(entry.rattings ?? entry.ratings),
        ratingCount: parseNumber(entry.vote_count)
          ? Math.round(parseNumber(entry.vote_count)!)
          : null,
        dishType: entry.dish_type ?? null,
        mainCategory: entry.maincategory ?? null,
        subCategory: entry.subcategory ?? null,
        nutrients: (entry.nutrients as Prisma.InputJsonValue) ?? Prisma.DbNull,
        timers: (entry.times as Prisma.InputJsonValue) ?? Prisma.DbNull,
      } as NormalizedRecipe;
    })
    .filter((value): value is NormalizedRecipe => Boolean(value));

  const scopedRecipes =
    args.limit && args.limit > 0 ? baseRecipes.slice(0, args.limit) : baseRecipes;

  const chunks = chunkArray(scopedRecipes, BATCH_SIZE);
  const enrichedById = new Map<string, EnrichmentOutput>();

  for (const chunk of chunks) {
    const inputs: EnrichmentInput[] = chunk.map((entry) => ({
      id: entry.sourceId,
      title: entry.title,
      description: entry.description,
      ingredients: entry.ingredients,
      steps: entry.instructions,
      nutrients: entry.nutrients as Record<string, unknown> | null,
    }));

    const response = await callLLMEnrichment(inputs);
    response.forEach((item) => {
      if (item?.id) {
        enrichedById.set(item.id, item);
      }
    });
  }

  let created = 0;
  let updated = 0;

  for (const entry of scopedRecipes) {
    const enriched = enrichedById.get(entry.sourceId);

    const tags = Array.from(
      new Set([
        ...entry.tags,
        ...(enriched?.tags ?? []),
      ])
    )
      .map((tag) => tag.toUpperCase().replace(/\s+/g, "_"))
      .filter(Boolean);

    const allergens = normalizeEnumList(
      enriched?.allergens ?? entry.allergens,
      ALLOWED_ALLERGENS
    );

    const healthyHighlights = normalizeHighlights(
      enriched?.healthyHighlights ?? entry.healthyHighlights,
      entry.healthyHighlights
    );

    const recipeData: NormalizedRecipe = {
      ...entry,
      tags,
      allergens,
      healthyHighlights,
      dishType: enriched?.dishType ?? entry.dishType,
      mainCategory: enriched?.mainCategory ?? entry.mainCategory,
      subCategory: enriched?.subCategory ?? entry.subCategory,
    };

    // Validate shape via admin schema (inventory handled separately).
    adminRecipeSchema.parse({
      ...recipeData,
      inventory: {
        quantity: DEFAULT_INVENTORY_QUANTITY,
        unitLabel: DEFAULT_INVENTORY_UNIT,
        status: InventoryStatus.IN_STOCK,
        restockDate: null,
      },
    });

    if (args.dryRun) {
      // Skip DB writes; still report would-be actions.
      continue;
    }

    const existing = await prisma.recipe.findFirst({
      where: {
        OR: [{ sourceId: recipeData.sourceId }, { slug: recipeData.slug }],
      },
    });

    const record = await prisma.recipe.upsert({
      where: { sourceId: recipeData.sourceId },
      update: recipeData,
      create: recipeData,
    });

    const inventoryDefaults = buildInventoryDefaults();

    await prisma.inventoryItem.upsert({
      where: { recipeId: record.id },
      update: inventoryDefaults,
      create: {
        recipeId: record.id,
        unitLabel: DEFAULT_INVENTORY_UNIT,
        ...inventoryDefaults,
      },
    });

    if (existing) {
      updated += 1;
    } else {
      created += 1;
    }
  }

  if (args.dryRun) {
    console.log(
      `Dry run complete. Processed ${scopedRecipes.length} recipes (no DB writes).`
    );
  } else {
    console.log(`Enrichment complete. Created: ${created}, Updated: ${updated}`);
  }
}

function buildInventoryDefaults(): InventoryDefaults {
  const restockDate =
    DEFAULT_RESTOCK_DAYS > 0
      ? new Date(Date.now() + DEFAULT_RESTOCK_DAYS * 24 * 60 * 60 * 1000)
      : null;

  return {
    quantity: DEFAULT_INVENTORY_QUANTITY,
    status: InventoryStatus.IN_STOCK,
    restockDate,
  };
}

main()
  .catch((error) => {
    console.error("Recipe enrichment failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


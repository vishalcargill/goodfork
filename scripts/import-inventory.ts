import "dotenv/config";

import path from "node:path";
import { readFile } from "node:fs/promises";

import { PrismaPg } from "@prisma/adapter-pg";
import { InventoryStatus, PrismaClient } from "../src/generated/prisma/client";

const DATABASE_URL = process.env.DATABASE_URL ?? "";

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined. Cannot import inventory.");
}

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type InventoryFeedRecord = {
  recipeSlug: string;
  quantity: number;
  unitLabel?: string;
  status?: InventoryStatus;
  restockDate?: string | null;
};

function deriveStatus(quantity: number, explicit?: InventoryStatus): InventoryStatus {
  if (explicit) {
    return explicit;
  }

  if (quantity <= 0) {
    return InventoryStatus.OUT_OF_STOCK;
  }

  if (quantity <= 10) {
    return InventoryStatus.LOW_STOCK;
  }

  return InventoryStatus.IN_STOCK;
}

function parseCsv(raw: string): InventoryFeedRecord[] {
  const [headerLine, ...rows] = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!headerLine) {
    return [];
  }

  const headers = headerLine.split(",").map((entry) => entry.trim());

  return rows.map((row) => {
    const cells = row.split(",").map((entry) => entry.trim());
    const record: Record<string, string> = {};

    headers.forEach((header, index) => {
      record[header] = cells[index] ?? "";
    });

    return {
      recipeSlug: record.recipeSlug ?? record.slug ?? "",
      quantity: Number(record.quantity ?? "0"),
      unitLabel: record.unitLabel || undefined,
      status: (record.status as InventoryStatus) ?? undefined,
      restockDate: record.restockDate || null,
    };
  });
}

function parseJson(raw: string): InventoryFeedRecord[] {
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("Inventory JSON must be an array.");
  }
  return parsed as InventoryFeedRecord[];
}

async function main() {
  const sourceFile = process.argv[2] ?? "data/inventory-sync.json";
  const filePath = path.resolve(process.cwd(), sourceFile);
  const extension = path.extname(filePath).toLowerCase();
  const fileBuffer = await readFile(filePath, "utf-8");

  const feed =
    extension === ".csv"
      ? parseCsv(fileBuffer)
      : parseJson(fileBuffer);

  if (!feed.length) {
    console.log("Inventory feed empty — nothing to import.");
    return;
  }

  const slugs = feed.map((entry) => entry.recipeSlug).filter(Boolean);
  const recipes = await prisma.recipe.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true, title: true },
  });

  const slugMap = new Map(recipes.map((recipe) => [recipe.slug, recipe]));

  let updated = 0;
  const missing: string[] = [];

  for (const row of feed) {
    const recipe = slugMap.get(row.recipeSlug);
    if (!recipe) {
      missing.push(row.recipeSlug);
      continue;
    }

    const quantity = Number(row.quantity ?? 0);
    if (!Number.isFinite(quantity) || quantity < 0) {
      console.warn(`Skipping ${row.recipeSlug}: invalid quantity.`);
      continue;
    }

    const status = deriveStatus(quantity, row.status);
    const restockDate = row.restockDate ? new Date(row.restockDate) : null;

    await prisma.inventoryItem.upsert({
      where: { recipeId: recipe.id },
      update: {
        quantity,
        unitLabel: row.unitLabel ?? "unit",
        status,
        restockDate,
      },
      create: {
        recipeId: recipe.id,
        quantity,
        unitLabel: row.unitLabel ?? "unit",
        status,
        restockDate,
      },
    });

    updated += 1;
  }

  console.log(
    `Inventory import finished. Updated ${updated}, missing ${missing.length}${
      missing.length ? ` (${missing.join(", ")})` : ""
    }.`
  );
}

main()
  .catch((error) => {
    console.error("Inventory import failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

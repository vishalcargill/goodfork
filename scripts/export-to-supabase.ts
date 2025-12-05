import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type {
  SupabaseBulkImportPayload,
  SupabaseFeedbackRow,
  SupabaseInventoryRow,
  SupabaseRecommendationRow,
  SupabaseRecipeRow,
  SupabaseUserProfileRow,
  SupabaseUserRow,
} from "../src/services/shared/supabase-mcp.types";

const DATABASE_URL = process.env.DATABASE_URL ?? "";
console.log("🚀 ~ DATABASE_URL:", DATABASE_URL);
const SUPABASE_URL = (process.env.SUPABASE_URL ?? process.env.SUPABASE_PROJECT_URL ?? "").replace(/\/$/, "");
console.log("🚀 ~ SUPABASE_URL:", SUPABASE_URL);
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? "";
console.log("🚀 ~ SUPABASE_SERVICE_ROLE_KEY:", SUPABASE_SERVICE_ROLE_KEY);
const SUPABASE_SCHEMA = process.env.SUPABASE_SCHEMA ?? "public";
console.log("🚀 ~ SUPABASE_SCHEMA:", SUPABASE_SCHEMA);
const CHUNK_SIZE = Number(process.env.SUPABASE_EXPORT_CHUNK_SIZE ?? 250);
console.log("🚀 ~ CHUNK_SIZE:", CHUNK_SIZE);
const SHOULD_TRUNCATE = process.argv.includes("--truncate");
console.log("🚀 ~ SHOULD_TRUNCATE:", SHOULD_TRUNCATE);

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined. Cannot read from Prisma.");
}

console.log("🚀 ~ DATABASE_URL", DATABASE_URL);
console.log("🚀 ~ SUPABASE_URL", SUPABASE_URL);
console.log("🚀 ~ SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY ? "[set]" : "[missing]");
console.log("🚀 ~ SUPABASE_SCHEMA", SUPABASE_SCHEMA);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to export data.");
}

const REST_URL = `${SUPABASE_URL}/rest/v1`;
const TABLES = {
  users: "User",
  profiles: "UserProfile",
  recipes: "Recipe",
  inventory: "InventoryItem",
  recommendations: "Recommendation",
  feedback: "Feedback",
} as const;

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function chunkArray<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function supabaseHeaders(extra?: Record<string, string>): HeadersInit {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates",
    ...(SUPABASE_SCHEMA ? { "Accept-Profile": SUPABASE_SCHEMA, "Content-Profile": SUPABASE_SCHEMA } : {}),
    ...(extra ?? {}),
  };
}

async function truncateTable(table: string) {
  const url = `${REST_URL}/${table}?select=id`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: supabaseHeaders({ Prefer: "count=exact" }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to truncate ${table}: ${response.status} ${message}`);
  }
}

async function upsertRows(table: string, rows: Record<string, unknown>[]) {
  if (!rows.length) {
    return;
  }

  for (const batch of chunkArray(rows, CHUNK_SIZE)) {
    const url = `${REST_URL}/${table}?on_conflict=id`;
    const response = await fetch(url, {
      method: "POST",
      headers: supabaseHeaders(),
      body: JSON.stringify(batch),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Failed to upsert into ${table}: ${response.status} ${message}`);
    }
  }
}

function buildPayload(): Promise<SupabaseBulkImportPayload> {
  return prisma.$transaction(async (tx) => {
    const [users, profiles, recipes, inventory, recommendations, feedback] = await Promise.all([
      tx.user.findMany({}),
      tx.userProfile.findMany({}),
      tx.recipe.findMany({}),
      tx.inventoryItem.findMany({}),
      tx.recommendation.findMany({}),
      tx.feedback.findMany({}),
    ]);

    const userRows: SupabaseUserRow[] = users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));

    const profileRows: SupabaseUserProfileRow[] = profiles.map((profile) => ({
      ...profile,
      lifestyleNotes: profile.lifestyleNotes ?? null,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    }));

    const recipeRows: SupabaseRecipeRow[] = recipes.map((recipe) => ({
      ...recipe,
      sourceId: recipe.sourceId ?? null,
      sourceUrl: recipe.sourceUrl ?? null,
      author: recipe.author ?? null,
      description: recipe.description ?? null,
      cuisine: recipe.cuisine ?? null,
      calories: recipe.calories ?? null,
      proteinGrams: recipe.proteinGrams ?? null,
      carbsGrams: recipe.carbsGrams ?? null,
      fatGrams: recipe.fatGrams ?? null,
      imageUrl: recipe.imageUrl ?? null,
      serves: recipe.serves ?? null,
      difficulty: recipe.difficulty ?? null,
      prepTimeMinutes: recipe.prepTimeMinutes ?? null,
      cookTimeMinutes: recipe.cookTimeMinutes ?? null,
      averageRating: recipe.averageRating ?? null,
      ratingCount: recipe.ratingCount ?? null,
      dishType: recipe.dishType ?? null,
      mainCategory: recipe.mainCategory ?? null,
      subCategory: recipe.subCategory ?? null,
      nutrients: recipe.nutrients ?? null,
      timers: recipe.timers ?? null,
      createdAt: recipe.createdAt.toISOString(),
      updatedAt: recipe.updatedAt.toISOString(),
    }));

    const inventoryRows: SupabaseInventoryRow[] = inventory.map((item) => ({
      ...item,
      restockDate: item.restockDate ? item.restockDate.toISOString() : null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));

    const recommendationRows: SupabaseRecommendationRow[] = recommendations.map((rec) => ({
      ...rec,
      healthySwapRecipeId: rec.healthySwapRecipeId ?? null,
      healthySwapRationale: rec.healthySwapRationale ?? null,
      sessionId: rec.sessionId ?? null,
      metadata: rec.metadata ?? null,
      createdAt: rec.createdAt.toISOString(),
      updatedAt: rec.updatedAt.toISOString(),
    }));

    const feedbackRows: SupabaseFeedbackRow[] = feedback.map((item) => ({
      ...item,
      notes: item.notes ?? null,
      createdAt: item.createdAt.toISOString(),
    }));

    return {
      users: userRows,
      profiles: profileRows,
      recipes: recipeRows,
      inventory: inventoryRows,
      recommendations: recommendationRows,
      feedback: feedbackRows,
    };
  });
}

async function main() {
  console.log("[supabase-export] Building payload from Prisma…");
  const payload = await buildPayload();

  if (SHOULD_TRUNCATE) {
    console.log("[supabase-export] Truncating Supabase tables in dependency order…");
    const truncateOrder = [
      TABLES.feedback,
      TABLES.recommendations,
      TABLES.inventory,
      TABLES.profiles,
      TABLES.users,
      TABLES.recipes,
    ];

    for (const table of truncateOrder) {
      console.log(`[supabase-export] Truncating ${table}`);
      await truncateTable(table);
    }
  }

  console.log("[supabase-export] Upserting users…");
  await upsertRows(TABLES.users, payload.users);

  console.log("[supabase-export] Upserting profiles…");
  await upsertRows(TABLES.profiles, payload.profiles);

  console.log("[supabase-export] Upserting recipes…");
  await upsertRows(TABLES.recipes, payload.recipes);

  console.log("[supabase-export] Upserting inventory…");
  await upsertRows(TABLES.inventory, payload.inventory);

  console.log("[supabase-export] Upserting recommendations…");
  await upsertRows(TABLES.recommendations, payload.recommendations);

  console.log("[supabase-export] Upserting feedback…");
  await upsertRows(TABLES.feedback, payload.feedback);

  console.log("[supabase-export] Export complete.");
}

main()
  .catch((error) => {
    console.error("[supabase-export] Failed to export to Supabase", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

"use server";

import type { Prisma } from "@/generated/prisma/client";
import { EmbeddingStatus } from "@/generated/prisma/client";

import {
  OPENAI_API_KEY,
  OPENAI_BASE_URL,
  RECIPE_EMBEDDING_MODEL,
  RECIPE_EMBEDDING_PROVIDER,
  RECIPE_EMBEDDING_VERSION,
} from "@/constants/app.constants";
import { prisma } from "@/lib/prisma";

const MAX_PROMPT_LENGTH = 6000;

export type GenerateRecipeEmbeddingsOptions = {
  limit?: number;
  recipeIds?: string[];
  force?: boolean;
  dryRun?: boolean;
};

type EmbeddableRecipe = {
  id: string;
  title: string;
  description: string | null;
  ingredients: string[];
  instructions: string[];
  healthyHighlights: string[];
  tags: string[];
  cuisine: string | null;
  nutrients: Prisma.JsonValue | null;
};

export async function generateRecipeEmbeddings(
  options: GenerateRecipeEmbeddingsOptions = {}
) {
  if (!RECIPE_EMBEDDING_MODEL) {
    throw new Error("RECIPE_EMBEDDING_MODEL is not configured.");
  }

  if (RECIPE_EMBEDDING_PROVIDER === "openai" && !OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required to generate embeddings.");
  }

  const where: Prisma.RecipeWhereInput = {};

  if (options.recipeIds?.length) {
    where.id = { in: options.recipeIds };
  }

  if (!options.force) {
    where.embeddings = {
      none: {
        provider: RECIPE_EMBEDDING_PROVIDER,
        model: RECIPE_EMBEDDING_MODEL,
        version: RECIPE_EMBEDDING_VERSION,
      },
    };
  }

  const recipes = await prisma.recipe.findMany({
    where,
    orderBy: { updatedAt: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      ingredients: true,
      instructions: true,
      healthyHighlights: true,
      tags: true,
      cuisine: true,
      nutrients: true,
    },
    take: options.limit ?? 25,
  });

  if (!recipes.length) {
    return { attempted: 0, upserted: 0 };
  }

  let upserted = 0;

  for (const recipe of recipes) {
    const prompt = composeEmbeddingPrompt(recipe);

    if (options.dryRun) {
      console.log(`[dry-run] Would embed recipe ${recipe.id} (${recipe.title})`);
      continue;
    }

    try {
      const embedding = await requestEmbedding(prompt);

      await prisma.recipeEmbedding.upsert({
        where: {
          recipeId_provider_model_version: {
            recipeId: recipe.id,
            provider: RECIPE_EMBEDDING_PROVIDER,
            model: RECIPE_EMBEDDING_MODEL,
            version: RECIPE_EMBEDDING_VERSION,
          },
        },
        update: {
          embedding,
          dimension: embedding.length,
          status: EmbeddingStatus.ACTIVE,
          metadata: {
            promptExcerpt: prompt.slice(0, 200),
          },
        },
        create: {
          recipeId: recipe.id,
          provider: RECIPE_EMBEDDING_PROVIDER,
          model: RECIPE_EMBEDDING_MODEL,
          version: RECIPE_EMBEDDING_VERSION,
          embedding,
          dimension: embedding.length,
          status: EmbeddingStatus.ACTIVE,
          metadata: {
            promptExcerpt: prompt.slice(0, 200),
          },
        },
      });

      upserted += 1;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : `Embedding failed: ${String(error)}`;
      console.error(`[embeddings] Failed for ${recipe.id}`, message);

      await prisma.recipeEmbedding.upsert({
        where: {
          recipeId_provider_model_version: {
            recipeId: recipe.id,
            provider: RECIPE_EMBEDDING_PROVIDER,
            model: RECIPE_EMBEDDING_MODEL,
            version: RECIPE_EMBEDDING_VERSION,
          },
        },
        update: {
          status: EmbeddingStatus.FAILED,
          metadata: { error: message },
        },
        create: {
          recipeId: recipe.id,
          provider: RECIPE_EMBEDDING_PROVIDER,
          model: RECIPE_EMBEDDING_MODEL,
          version: RECIPE_EMBEDDING_VERSION,
          embedding: [],
          dimension: 0,
          status: EmbeddingStatus.FAILED,
          metadata: { error: message },
        },
      });
    }
  }

  return { attempted: recipes.length, upserted };
}

function composeEmbeddingPrompt(recipe: EmbeddableRecipe): string {
  const nutrientSummary = formatNutrients(recipe.nutrients);
  const sections = [
    `Title: ${recipe.title}`,
    recipe.cuisine ? `Cuisine: ${recipe.cuisine}` : null,
    recipe.description ? `Description: ${recipe.description}` : null,
    recipe.healthyHighlights?.length
      ? `Highlights: ${recipe.healthyHighlights.join(", ")}`
      : null,
    recipe.tags?.length ? `Tags: ${recipe.tags.join(", ")}` : null,
    nutrientSummary ? `Nutrients: ${nutrientSummary}` : null,
    recipe.ingredients?.length
      ? `Ingredients: ${recipe.ingredients.slice(0, 25).join(" | ")}`
      : null,
    recipe.instructions?.length
      ? `Instructions: ${recipe.instructions.slice(0, 12).join(" -> ")}`
      : null,
  ].filter((value): value is string => Boolean(value));

  const joined = sections.join("\n");

  return joined.length > MAX_PROMPT_LENGTH ? joined.slice(0, MAX_PROMPT_LENGTH) : joined;
}

function formatNutrients(payload: Prisma.JsonValue | null): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  return Object.entries(payload)
    .map(([key, value]) => `${key}:${sanitizeNutrientValue(value)}`)
    .join(", ");
}

function sanitizeNutrientValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return JSON.stringify(value ?? "");
}

export async function requestEmbedding(input: string): Promise<number[]> {
  switch (RECIPE_EMBEDDING_PROVIDER) {
    case "openai":
      return requestOpenAIEmbedding(input);
    default:
      throw new Error(`Unsupported embedding provider: ${RECIPE_EMBEDDING_PROVIDER}`);
  }
}

export async function findSimilarRecipes(
  query: string,
  limit: number = 20
): Promise<{ recipeId: string; score: number }[]> {
  if (!RECIPE_EMBEDDING_MODEL) {
    return [];
  }

  try {
    // Generate embedding for the query
    const queryVector = await requestEmbedding(query);

    // Fetch all active recipe embeddings
    // Note: For a larger dataset, we would use pgvector or similar in the DB.
    // For ~160 recipes, in-memory comparison is sufficiently fast and avoids schema changes.
    const embeddings = await prisma.recipeEmbedding.findMany({
      where: {
        status: EmbeddingStatus.ACTIVE,
        provider: RECIPE_EMBEDDING_PROVIDER,
        model: RECIPE_EMBEDDING_MODEL,
        version: RECIPE_EMBEDDING_VERSION,
      },
      select: {
        recipeId: true,
        embedding: true,
      },
    });

    if (!embeddings.length) {
      return [];
    }

    // Calculate cosine similarity
    const scored = embeddings.map((record) => {
      const score = cosineSimilarity(queryVector, record.embedding);
      return { recipeId: record.recipeId, score };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit);
  } catch (error) {
    console.error("Vector search failed", error);
    return [];
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB)) || 0;
}

async function requestOpenAIEmbedding(input: string): Promise<number[]> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY missing for OpenAI embeddings.");
  }

  const response = await fetch(`${OPENAI_BASE_URL.replace(/\/$/, "")}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      input,
      model: RECIPE_EMBEDDING_MODEL,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI embeddings failed: ${response.status} ${errorBody}`);
  }

  const result = (await response.json()) as {
    data?: { embedding: number[] }[];
  };

  const vector = result.data?.[0]?.embedding;

  if (!Array.isArray(vector)) {
    throw new Error("Embedding response missing vector data.");
  }

  return vector;
}

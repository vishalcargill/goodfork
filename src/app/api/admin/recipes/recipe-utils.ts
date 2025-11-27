import { prisma } from "@/lib/prisma";
import type { AdminRecipeInput } from "@/schema/admin-recipe.schema";

export const recipeInclude = { inventory: true } as const;

export function normalizeRecipeData(input: AdminRecipeInput) {
  const { inventory, ...recipe } = input;

  const recipeData = {
    slug: recipe.slug,
    sourceId: recipe.sourceId ?? null,
    sourceUrl: recipe.sourceUrl ?? null,
    author: recipe.author ?? null,
    title: recipe.title,
    description: recipe.description ?? null,
    cuisine: recipe.cuisine ?? null,
    calories: recipe.calories,
    proteinGrams: recipe.proteinGrams,
    carbsGrams: recipe.carbsGrams,
    fatGrams: recipe.fatGrams,
    priceCents: recipe.priceCents,
    tags: recipe.tags,
    allergens: recipe.allergens,
    healthyHighlights: recipe.healthyHighlights,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    imageUrl: recipe.imageUrl ?? null,
    serves: recipe.serves,
    difficulty: recipe.difficulty ?? null,
    prepTimeMinutes: recipe.prepTimeMinutes,
    cookTimeMinutes: recipe.cookTimeMinutes,
    averageRating: recipe.averageRating,
    ratingCount: recipe.ratingCount,
    dishType: recipe.dishType ?? null,
    mainCategory: recipe.mainCategory ?? null,
    subCategory: recipe.subCategory ?? null,
    nutrients: recipe.nutrients ?? undefined,
    timers: recipe.timers ?? undefined,
  };

  const inventoryData = {
    quantity: inventory.quantity,
    unitLabel: inventory.unitLabel,
    status: inventory.status,
    restockDate: inventory.restockDate ? new Date(inventory.restockDate) : null,
  };

  return { recipeData, inventoryData };
}

export async function ensureRecipeExists(id: string) {
  const recipe = await prisma.recipe.findUnique({ where: { id }, include: recipeInclude });
  if (!recipe) {
    throw Object.assign(new Error("Not found"), { statusCode: 404 });
  }
  return recipe;
}

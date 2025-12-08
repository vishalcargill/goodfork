import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { UserProfile, Recipe } from "@/generated/prisma/client";
import { filterRecipesByDietPreferences } from "@/services/server/recommendations.server";

const makeProfile = (overrides: Partial<UserProfile>): UserProfile =>
  ({
    id: "profile",
    userId: "user",
    dietaryGoals: [],
    allergens: [],
    dietaryPreferences: [],
    tastePreferences: [],
    lifestyleNotes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } satisfies UserProfile);

const recipe = (overrides: Partial<Recipe>): Recipe =>
  ({
    id: `recipe-${Math.random()}`,
    slug: "slug",
    title: "Recipe",
    description: "",
    priceCents: 0,
    tags: [],
    allergens: [],
    ingredients: [],
    instructions: [],
    healthyHighlights: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    recipeIngredients: [],
    recommendations: [],
    healthySwapFor: [],
    embeddings: [],
    ...overrides,
  } as Recipe);

describe("filterRecipesByDietPreferences", () => {
  const vegRecipe = recipe({ tags: ["VEGETARIAN"] });
  const plantRecipe = recipe({ tags: ["PLANT_BASED"] });
  const fishRecipe = recipe({ tags: ["SEAFOOD"], allergens: ["FISH"] });
  const meatRecipe = recipe({ tags: ["PROTEIN_FORWARD"] });
  const dairyRecipe = recipe({ tags: ["PLANT_BASED"], allergens: ["DAIRY"] });
  const eggRecipe = recipe({ tags: ["PLANT_BASED"], allergens: ["EGGS"] });

  it("keeps only vegetarian/plant-based when vegetarian is selected", () => {
    const profile = makeProfile({ dietaryPreferences: ["VEGETARIAN"] });
    const filtered = filterRecipesByDietPreferences(profile, [vegRecipe, plantRecipe, fishRecipe, meatRecipe]);
    assert.deepEqual(filtered, [vegRecipe, plantRecipe]);
  });

  it("excludes dairy/egg even if plant-based when vegan is selected", () => {
    const profile = makeProfile({ dietaryPreferences: ["VEGAN"] });
    const filtered = filterRecipesByDietPreferences(profile, [vegRecipe, plantRecipe, dairyRecipe, eggRecipe]);
    assert.deepEqual(filtered, [vegRecipe, plantRecipe]);
  });

  it("allows seafood and vegetarian for pescatarian", () => {
    const profile = makeProfile({ dietaryPreferences: ["PESCATARIAN"] });
    const filtered = filterRecipesByDietPreferences(profile, [vegRecipe, plantRecipe, fishRecipe, meatRecipe]);
    assert.deepEqual(filtered, [vegRecipe, plantRecipe, fishRecipe]);
  });

  it("returns all recipes when no dietary preference is set", () => {
    const profile = makeProfile({ dietaryPreferences: [] });
    const filtered = filterRecipesByDietPreferences(profile, [vegRecipe, plantRecipe, fishRecipe, meatRecipe]);
    assert.deepEqual(filtered, [vegRecipe, plantRecipe, fishRecipe, meatRecipe]);
  });
});


import {
  InventoryStatus,
  type Ingredient,
  type InventoryItem,
  type PantryItem,
  type RecipeIngredient,
  type User,
  type UserProfile,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSystemPantryUserId } from "@/lib/system-user";
import {
  DATABASE_URL,
  ENABLE_AI_RANKING,
  OPENAI_API_KEY,
  OPENAI_BASE_URL,
  RECOMMENDER_MODEL,
  REQUIRE_AI_RANKING,
} from "@/constants/app.constants";
import { normalizeImageUrl } from "@/lib/images";
import type {
  RecommendationCard,
  RecommendationResponse,
  ScoreAdjustment,
} from "@/services/shared/recommendations.types";

export type GenerateRecommendationsInput = {
  userId?: string;
  email?: string;
  limit?: number;
  sessionId?: string;
  deterministicOnly?: boolean;
};

type RecipeIngredientWithMeta = RecipeIngredient & { ingredient: Ingredient };

type SlimInventory = Pick<
  InventoryItem,
  "id" | "recipeId" | "quantity" | "unitLabel" | "status" | "restockDate" | "createdAt" | "updatedAt"
>;

type SlimRecipe = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  calories: number | null;
  proteinGrams: number | null;
  carbsGrams: number | null;
  fatGrams: number | null;
  tags: string[];
  allergens: string[];
  healthyHighlights: string[];
  imageUrl: string | null;
  inventory: SlimInventory | null;
  recipeIngredients: RecipeIngredientWithMeta[];
};

type PantryGap = {
  ingredientId: string;
  ingredientName: string;
  unitLabel: string;
  requiredQuantity: number;
  availableQuantity: number;
  status: InventoryStatus;
};

type PantryCoverage = {
  status: InventoryStatus;
  cookableServings: number;
  missingIngredients: PantryGap[];
  lowStockIngredients: PantryGap[];
  operatorStatus: InventoryStatus;
  operatorMissingIngredients: PantryGap[];
  operatorLowStockIngredients: PantryGap[];
};

type CandidateRecipe = SlimRecipe & {
  pantryCoverage: PantryCoverage;
  vectorScore?: number;
};

type ScoredCandidate = CandidateRecipe & {
  score: number;
  adjustments: ScoreAdjustment[];
  macrosLabel: string;
  deterministicRationale: string;
  deterministicSwap: string | null;
};

type FinalCandidate = ScoredCandidate & {
  rankingSource: "llm" | "deterministic";
  rationale: string;
  healthySwapCopy: string | null;
  swapRecipeId: string | null;
};

const MIN_LIMIT = 3;
const MAX_LIMIT = 5;
const BASE_SCORE = 62;

const tasteKeywordMap: Record<string, string[]> = {
  SPICY: ["spicy", "harissa", "ginger", "chili", "szechuan"],
  COMFORT: ["comfort", "roasted", "braised", "butter", "creamy"],
  BRIGHT: ["citrus", "lime", "lemon", "herb", "fresh"],
  UMAMI: ["umami", "miso", "soy", "tamari", "mushroom"],
  EXPLORER: ["fusion", "global", "street", "adventure", "bold"],
};

const preferenceTagMap: Record<string, string[]> = {
  VEGETARIAN: ["VEGETARIAN", "PLANT_BASED"],
  VEGAN: ["VEGAN", "PLANT_BASED"],
  PESCATARIAN: ["PESCATARIAN", "SEAFOOD", "FISH"],
  MEDITERRANEAN: ["MEDITERRANEAN", "GUT_HEALTH", "HEART_HEALTHY", "WHOLE_GRAIN"],
  LOW_CARB: ["LOW_CARB", "LIGHTER_CHOICE", "KETO", "HIGH_PROTEIN"],
};

type RecommendationErrorOptions = {
  statusCode?: number;
  clientMessage?: string;
  errorCode?: string;
};

function createRecommendationError(message: string, options: RecommendationErrorOptions = {}) {
  return Object.assign(new Error(message), {
    statusCode: options.statusCode ?? 400,
    clientMessage: options.clientMessage ?? message,
    errorCode: options.errorCode,
  });
}

export async function generateRecommendations(input: GenerateRecommendationsInput): Promise<RecommendationResponse> {
  if (!DATABASE_URL) {
    throw new Error("Database is not configured.");
  }

  if (!input.userId && !input.email) {
    throw new Error("Provide a userId or email to generate recommendations.");
  }

  const limit = Math.min(Math.max(input.limit ?? 4, MIN_LIMIT), MAX_LIMIT);
  const user = await resolveUser(input);
  const profile = user.profile;

  if (!profile) {
    throw createRecommendationError("User profile is required before requesting recommendations.", {
      statusCode: 400,
      clientMessage: "Complete onboarding before fetching menus so we can personalize your menus.",
      errorCode: "profile_missing",
    });
  }

  const { candidates, stats } = await loadCandidateRecipes({
    profile,
    userId: user.id,
  });

  if (candidates.length === 0) {
    throw createRecommendationError("No pantry-aligned inventory matches the stated allergens right now.", {
      statusCode: 404,
      clientMessage: "Your pantry is missing a few essentials. Restock or adjust allergens to unlock menus.",
      errorCode: "pantry_empty",
    });
  }

  const scored = scoreCandidates(candidates, profile);

  // Sort by score immediately so we prioritize the best candidates
  scored.sort((a, b) => b.score - a.score);

  const candidateMap = new Map(scored.map((entry) => [entry.id, entry]));

  // Cap the candidates passed to the LLM to avoid context limits and latency.
  // Keep a bit more than the requested limit to allow the LLM some choice.
  const topCandidates = scored.slice(0, 10);

  let finalSelection: FinalCandidate[] | null = null;

  if (!input.deterministicOnly && ENABLE_AI_RANKING && OPENAI_API_KEY && RECOMMENDER_MODEL) {
    const aiRanked = await rankWithLLM(profile, topCandidates, limit);
    if (aiRanked?.length) {
      const enrichedAiSelection = aiRanked.reduce<FinalCandidate[]>((acc, aiEntry) => {
        const base = candidateMap.get(aiEntry.recipeId);
        if (!base) {
          return acc;
        }

        const swapRecipeId =
          aiEntry.swapRecipeId && candidateMap.has(aiEntry.swapRecipeId) ? aiEntry.swapRecipeId : null;

        acc.push({
          ...base,
          rankingSource: "llm",
          rationale: truncate(aiEntry.rationale ?? base.deterministicRationale) || "",
          healthySwapCopy: truncate(aiEntry.healthySwapIdea ?? base.deterministicSwap ?? "") || base.deterministicSwap,
          swapRecipeId,
        });
        return acc;
      }, []);

      if (enrichedAiSelection.length) {
        finalSelection = enrichedAiSelection.slice(0, limit);
      }
    }
  }

  if (!finalSelection?.length) {
    if (!input.deterministicOnly && REQUIRE_AI_RANKING) {
      throw createRecommendationError("AI ranking is required to deliver menus right now.", {
        statusCode: 503,
        clientMessage: "LLM rankings are warming up. Try again in a moment for fresh menus.",
        errorCode: "llm_required",
      });
    }

    // Fallback to top scored deterministic candidates
    // We already sorted `scored` by score above.
    finalSelection = scored.slice(0, limit).map((entry) => ({
      ...entry,
      rankingSource: "deterministic" as const,
      rationale: entry.deterministicRationale,
      healthySwapCopy: entry.deterministicSwap,
      swapRecipeId: null,
    }));
  }

  // Fallback: if no swap was assigned, pick the next-best candidate as a swap target
  const scoredById = new Map(scored.map((c) => [c.id, c]));
  const pickFallbackSwap = (currentId: string) => {
    const fallback = scored.find((candidate) => candidate.id !== currentId);
    return fallback ? fallback.id : null;
  };

  finalSelection = finalSelection.map((entry) => {
    const swapId = entry.swapRecipeId ?? pickFallbackSwap(entry.id);
    // Avoid self-swaps
    const safeSwapId = swapId && swapId !== entry.id ? swapId : null;
    return {
      ...entry,
      swapRecipeId: safeSwapId,
    };
  });

  const persisted = await Promise.all(
    finalSelection.map((entry) =>
      prisma.recommendation.create({
        data: {
          userId: user.id,
          recipeId: entry.id,
          healthySwapRecipeId: entry.swapRecipeId,
          rationale: entry.rationale,
          healthySwapRationale: entry.healthySwapCopy,
          sessionId: input.sessionId ?? null,
          metadata: {
            rankingSource: entry.rankingSource,
            score: entry.score,
            adjustments: entry.adjustments,
          },
        },
        include: {
          recipe: { include: { inventory: true } },
          healthySwapRecipe: true,
        },
      })
    )
  );

  const recommendations: RecommendationCard[] = persisted.map((record) => {
    const entry = finalSelection!.find((item) => item.id === record.recipeId);
    if (!entry) {
      throw new Error("Recommendation metadata mismatch.");
    }

    const safeSwapId = entry.swapRecipeId && entry.swapRecipeId !== entry.id ? entry.swapRecipeId : null;
    const swapEntry = safeSwapId ? candidateMap.get(safeSwapId) : null;
    const swapRecipeRecord = safeSwapId && record.healthySwapRecipe?.id === safeSwapId ? record.healthySwapRecipe : null;
    const swapMacrosLabel =
      swapEntry?.macrosLabel ??
      (swapRecipeRecord ? buildMacrosLabelFromNumbers(swapRecipeRecord.proteinGrams, swapRecipeRecord.carbsGrams, swapRecipeRecord.fatGrams) : null);
    const swapImage = normalizeImageUrl(swapEntry?.imageUrl ?? swapRecipeRecord?.imageUrl ?? null);
    const swapPayload =
      (swapEntry || swapRecipeRecord) && safeSwapId
        ? {
            id: swapEntry?.id ?? swapRecipeRecord!.id,
            title: swapEntry?.title ?? swapRecipeRecord!.title,
            slug: swapEntry?.slug ?? swapRecipeRecord?.slug ?? null,
            imageUrl: swapImage,
            macrosLabel: swapMacrosLabel,
            calories: swapEntry?.calories ?? swapRecipeRecord?.calories ?? null,
            proteinGrams: swapEntry?.proteinGrams ?? swapRecipeRecord?.proteinGrams ?? null,
            carbsGrams: swapEntry?.carbsGrams ?? swapRecipeRecord?.carbsGrams ?? null,
            fatGrams: swapEntry?.fatGrams ?? swapRecipeRecord?.fatGrams ?? null,
          }
        : null;

    return {
      recommendationId: record.id,
      recipeId: record.recipeId,
      slug: record.recipe.slug,
      title: record.recipe.title,
      description: record.recipe.description,
      imageUrl: normalizeImageUrl(record.recipe.imageUrl),
      calories: record.recipe.calories ?? null,
      proteinGrams: record.recipe.proteinGrams ?? null,
      carbsGrams: record.recipe.carbsGrams ?? null,
      fatGrams: record.recipe.fatGrams ?? null,
      macrosLabel: entry.macrosLabel,
      tags: record.recipe.tags,
      healthyHighlights: record.recipe.healthyHighlights,
      allergens: record.recipe.allergens,
      pantry: {
        status: entry.pantryCoverage.status,
        cookableServings: entry.pantryCoverage.cookableServings,
        missingIngredients: entry.pantryCoverage.missingIngredients.map((gap) => ({
          ingredient: gap.ingredientName,
          unitLabel: gap.unitLabel,
          requiredQuantity: gap.requiredQuantity,
          availableQuantity: gap.availableQuantity,
        })),
        lowStockIngredients: entry.pantryCoverage.lowStockIngredients.map((gap) => ({
          ingredient: gap.ingredientName,
          unitLabel: gap.unitLabel,
          requiredQuantity: gap.requiredQuantity,
          availableQuantity: gap.availableQuantity,
        })),
        operatorStatus: entry.pantryCoverage.operatorStatus,
        operatorMissingIngredients: entry.pantryCoverage.operatorMissingIngredients.map((gap) => ({
          ingredient: gap.ingredientName,
          unitLabel: gap.unitLabel,
          requiredQuantity: gap.requiredQuantity,
          availableQuantity: gap.availableQuantity,
        })),
        operatorLowStockIngredients: entry.pantryCoverage.operatorLowStockIngredients.map((gap) => ({
          ingredient: gap.ingredientName,
          unitLabel: gap.unitLabel,
          requiredQuantity: gap.requiredQuantity,
          availableQuantity: gap.availableQuantity,
        })),
      },
      rationale: record.rationale,
      healthySwapCopy: record.healthySwapRationale ?? entry.healthySwapCopy ?? null,
      swapRecipe: swapPayload,
      metadata: {
        rankingSource: entry.rankingSource,
        baseScore: entry.score,
        adjustments: entry.adjustments,
      },
    };
  });

  const response: RecommendationResponse = {
    userId: user.id,
    requested: limit,
    delivered: recommendations.length,
    source: recommendations.some((rec) => rec.metadata.rankingSource === "llm") ? "llm" : "deterministic",
    recommendations,
    telemetry: {
      candidateCount: candidates.length,
      filteredCount: stats.filteredCount,
      vectorMatchCount: stats.vectorMatchCount,
    },
  };

  return response;
}

async function resolveUser(input: GenerateRecommendationsInput) {
  const where = input.userId ? { id: input.userId } : { email: (input.email ?? "").toLowerCase() };

  const user = await prisma.user.findFirst({
    where,
    include: { profile: true },
  });

  if (!user) {
    throw createRecommendationError("User not found for the provided identifier.", {
      statusCode: 404,
      clientMessage:
        "We couldn't find an onboarding profile for that email yet. Start onboarding to unlock personalized menus.",
      errorCode: "user_not_found",
    });
  }

  return user as User & { profile: UserProfile | null };
}

async function loadCandidateRecipes({ profile, userId }: { profile: UserProfile; userId: string }) {
  const systemPantryUserId = await getSystemPantryUserId().catch(() => null);

  const [recipes, pantryItems, operatorPantryItems, vectorMatches] = await Promise.all([
    prisma.recipe
      .findMany({
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          calories: true,
          proteinGrams: true,
          carbsGrams: true,
          fatGrams: true,
          tags: true,
          allergens: true,
          healthyHighlights: true,
          imageUrl: true,
          inventory: {
            select: {
              id: true,
              recipeId: true,
              quantity: true,
              unitLabel: true,
              status: true,
              restockDate: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          recipeIngredients: {
            select: {
              ingredientId: true,
              quantityPerServing: true,
              unitLabel: true,
              ingredient: { select: { id: true, name: true, defaultUnit: true } },
            },
          },
        },
      })
      .then((rows) => rows as unknown as SlimRecipe[]),
    prisma.pantryItem.findMany({
      where: { userId },
    }),
    systemPantryUserId
      ? prisma.pantryItem.findMany({
          where: { userId: systemPantryUserId },
        })
      : Promise.resolve([] as PantryItem[]),
    Promise.resolve([] as { recipeId: string; score: number }[]),
  ]);

  const vectorScores = new Map<string, number>();
  vectorMatches.forEach((match) => vectorScores.set(match.recipeId, match.score));

  const dietFiltered = filterRecipesByDietPreferences(profile, recipes);
  if (dietFiltered.length === 0) {
    throw createRecommendationError("No recipes match the selected dietary styles with current inventory.", {
      statusCode: 404,
      clientMessage:
        "We couldn’t find menus matching your diet style with today’s inventory. Adjust diet settings or check back after restock.",
      errorCode: "dietary_preferences_unmatched",
    });
  }

  const pantryMap = new Map<string, PantryItem>();
  pantryItems.forEach((item) => pantryMap.set(item.ingredientId, item));
  const operatorPantryMap = new Map<string, PantryItem>();
  operatorPantryItems.forEach((item) => operatorPantryMap.set(item.ingredientId, item));
  const hasOperatorPantry = Boolean(systemPantryUserId && operatorPantryItems.length > 0);

  const allergens = profile.allergens ?? [];

  const allergenSafe = dietFiltered.filter((recipe) => isAllergenSafe(recipe, allergens));
  const enriched: CandidateRecipe[] = allergenSafe.map((recipe) => ({
    ...recipe,
    recipeIngredients: recipe.recipeIngredients as RecipeIngredientWithMeta[],
    pantryCoverage: calculatePantryCoverage(
      recipe.recipeIngredients as RecipeIngredientWithMeta[],
      pantryMap,
      operatorPantryMap,
      hasOperatorPantry
    ),
    vectorScore: vectorScores.get(recipe.id) ?? 0,
  }));

  const operatorReady = hasOperatorPantry
    ? enriched.filter((entry) => entry.pantryCoverage.operatorStatus !== InventoryStatus.OUT_OF_STOCK)
    : enriched;

  const ready = operatorReady.filter((entry) => entry.pantryCoverage.cookableServings >= 1);
  const nearReady = operatorReady.filter(
    (entry) => entry.pantryCoverage.cookableServings === 0 && entry.pantryCoverage.missingIngredients.length <= 2
  );
  const fallback = operatorReady.filter((entry) => !ready.includes(entry) && !nearReady.includes(entry));

  const ordered: CandidateRecipe[] = [];
  const seen = new Set<string>();
  const enqueue = (list: CandidateRecipe[]) => {
    list.forEach((item) => {
      if (seen.has(item.id)) {
        return;
      }
      seen.add(item.id);
      ordered.push(item);
    });
  };

  enqueue(ready as CandidateRecipe[]);
  enqueue(nearReady as CandidateRecipe[]);
  enqueue(fallback as CandidateRecipe[]);

  return {
    candidates: ordered,
    stats: {
      filteredCount: dietFiltered.length,
      vectorMatchCount: vectorScores.size,
    },
  };
}

function isAllergenSafe(recipe: SlimRecipe, allergens: string[]) {
  if (!allergens?.length) {
    return true;
  }

  return !recipe.allergens.some((allergen) => allergens.includes(allergen));
}

export function filterRecipesByDietPreferences(profile: UserProfile, recipes: SlimRecipe[]) {
  const preferences = profile.dietaryPreferences ?? [];
  if (!preferences.length) {
    return recipes;
  }

  const prefersVegetarian = preferences.includes("VEGETARIAN");
  const prefersVegan = preferences.includes("VEGAN");
  const prefersPescatarian = preferences.includes("PESCATARIAN");

  // Build allowed tag sets
  const allowedTags = new Set<string>();
  preferences.forEach((preference) => {
    (preferenceTagMap[preference] ?? [preference]).forEach((tag) => allowedTags.add(tag));
  });

  return recipes.filter((recipe) => {
    const tags = recipe.tags ?? [];
    const allergens = recipe.allergens ?? [];

    // Vegan: must be tagged vegan/plant based and exclude dairy/eggs
    if (prefersVegan) {
      const tagMatch = tags.some((tag) => preferenceTagMap.VEGAN.includes(tag));
      const excludesAnimalProducts = !allergens.some((allergen) => allergen === "DAIRY" || allergen === "EGGS");
      if (!(tagMatch && excludesAnimalProducts)) {
        return false;
      }
    }

    // Vegetarian: must be tagged vegetarian/plant based
    if (prefersVegetarian) {
      const tagMatch = tags.some((tag) => preferenceTagMap.VEGETARIAN.includes(tag));
      if (!tagMatch) {
        return false;
      }
    }

    // Pescatarian: allow seafood + vegetarian/plant based; reject other meats unless explicitly tagged
    if (prefersPescatarian) {
      const pescatarianTags = preferenceTagMap.PESCATARIAN;
      const vegTags = preferenceTagMap.VEGETARIAN;
      const isPescatarianFriendly =
        tags.some((tag) => pescatarianTags.includes(tag)) || tags.some((tag) => vegTags.includes(tag));
      if (!isPescatarianFriendly) {
        return false;
      }
    }

    // If none of the strict checks failed, allow
    // Also allow other soft preferences to remain in scoring.
    if (prefersVegan || prefersVegetarian || prefersPescatarian) {
      // Ensure at least one tag from allowed set exists to avoid empty-tag recipes sneaking in
      return tags.some((tag) => allowedTags.has(tag));
    }

    return true;
  });
}

function calculatePantryCoverage(
  ingredients: RecipeIngredientWithMeta[],
  pantryMap: Map<string, PantryItem>,
  operatorPantryMap: Map<string, PantryItem>,
  hasOperatorPantry: boolean
): PantryCoverage {
  const missingIngredients: PantryGap[] = [];
  const lowStockIngredients: PantryGap[] = [];
  let cookableServings: number | null = null;
  const operatorMissingIngredients: PantryGap[] = [];
  const operatorLowStockIngredients: PantryGap[] = [];
  let operatorCookableServings: number | null = hasOperatorPantry ? null : Infinity;

  for (const component of ingredients) {
    const requiredQuantity = Number(component.quantityPerServing ?? 0) || 0;
    const unitLabel = component.unitLabel ?? component.ingredient.defaultUnit ?? "unit";
    const pantryItem = pantryMap.get(component.ingredientId);
    const availableQuantity = pantryItem ? Number(pantryItem.quantity) : 0;

    if (!pantryItem || availableQuantity <= 0 || requiredQuantity <= 0) {
      cookableServings = 0;
      missingIngredients.push({
        ingredientId: component.ingredientId,
        ingredientName: component.ingredient.name,
        unitLabel,
        requiredQuantity,
        availableQuantity,
        status: InventoryStatus.OUT_OF_STOCK,
      });
      continue;
    }

    const servings = Math.floor(availableQuantity / requiredQuantity);

    cookableServings = cookableServings === null ? servings : Math.min(cookableServings, servings);

    if (pantryItem.status !== InventoryStatus.IN_STOCK || servings < 2) {
      lowStockIngredients.push({
        ingredientId: component.ingredientId,
        ingredientName: component.ingredient.name,
        unitLabel,
        requiredQuantity,
        availableQuantity,
        status: pantryItem.status,
      });
    }

    if (hasOperatorPantry) {
      const operatorItem = operatorPantryMap.get(component.ingredientId);
      const operatorQuantity = operatorItem ? Number(operatorItem.quantity) : 0;

      if (!operatorItem || operatorQuantity <= 0 || requiredQuantity <= 0) {
        operatorCookableServings = 0;
        operatorMissingIngredients.push({
          ingredientId: component.ingredientId,
          ingredientName: component.ingredient.name,
          unitLabel,
          requiredQuantity,
          availableQuantity: operatorQuantity,
          status: InventoryStatus.OUT_OF_STOCK,
        });
      } else {
        const operatorServings = Math.floor(operatorQuantity / requiredQuantity);
        operatorCookableServings =
          operatorCookableServings === null ? operatorServings : Math.min(operatorCookableServings, operatorServings);

        if (operatorItem.status !== InventoryStatus.IN_STOCK || operatorServings < 2) {
          operatorLowStockIngredients.push({
            ingredientId: component.ingredientId,
            ingredientName: component.ingredient.name,
            unitLabel,
            requiredQuantity,
            availableQuantity: operatorQuantity,
            status: operatorItem.status,
          });
        }
      }
    }
  }

  if (cookableServings === null || cookableServings === Infinity) {
    cookableServings = 0;
  }

  let status: InventoryStatus = InventoryStatus.OUT_OF_STOCK;
  if (cookableServings >= 2) {
    status = InventoryStatus.IN_STOCK;
  } else if (cookableServings >= 1) {
    status = InventoryStatus.LOW_STOCK;
  }

  let operatorStatus: InventoryStatus = InventoryStatus.IN_STOCK;
  if (!hasOperatorPantry) {
    operatorStatus = InventoryStatus.IN_STOCK;
  } else if (operatorCookableServings === 0 || operatorMissingIngredients.length) {
    operatorStatus = InventoryStatus.OUT_OF_STOCK;
  } else if ((operatorCookableServings ?? 0) < 2) {
    operatorStatus = InventoryStatus.LOW_STOCK;
  }

  return {
    status,
    cookableServings,
    missingIngredients,
    lowStockIngredients,
    operatorStatus,
    operatorMissingIngredients,
    operatorLowStockIngredients,
  };
}

function scoreCandidates(candidates: CandidateRecipe[], profile: UserProfile): ScoredCandidate[] {
  return candidates.map((candidate) => {
    let score = BASE_SCORE;
    const adjustments: ScoreAdjustment[] = [];

    const coverage = candidate.pantryCoverage;

    const addAdjustment = (reason: string, delta: number) => {
      score += delta;
      adjustments.push({ reason, delta });
    };

    applyPantryAvailability(coverage, addAdjustment);

    applyGoalHeuristics(candidate, profile, addAdjustment);
    applyDietaryPreferenceMatch(candidate, profile, addAdjustment);
    applyTasteMatch(candidate, profile, addAdjustment);
    applyMacroBalance(candidate, addAdjustment);
    if (candidate.vectorScore && candidate.vectorScore > 0.7) {
      addAdjustment("Aligned with your vibe", Math.round(candidate.vectorScore * 15));
    }

    const macrosLabel = buildMacrosLabel(candidate);
    const deterministicRationale = buildDeterministicRationale(candidate, profile, coverage, macrosLabel);
    const deterministicSwap = buildHealthySwapSuggestion(candidate, profile);

    return {
      ...candidate,
      score,
      adjustments,
      macrosLabel,
      deterministicRationale,
      deterministicSwap,
    };
  });
}

function applyGoalHeuristics(
  candidate: CandidateRecipe,
  profile: UserProfile,
  push: (reason: string, delta: number) => void
) {
  const goals = profile.dietaryGoals ?? [];
  const protein = candidate.proteinGrams ?? 0;
  const carbs = candidate.carbsGrams ?? 0;
  const fat = candidate.fatGrams ?? 0;
  const calories = candidate.calories ?? 0;

  if (goals.includes("LEAN_MUSCLE")) {
    if (protein >= 35) {
      push("Lean muscle — high protein density", 25);
    } else if (protein >= 25) {
      push("Lean muscle — solid protein support", 15);
    } else {
      push("Lean muscle — limited protein", -10);
    }
  }

  if (goals.includes("ENERGY")) {
    if (carbs >= 35 && carbs <= 65) {
      push("Energy — steady carb window", 15);
    } else if (carbs > 80) {
      push("Energy — heavy carbs", -10);
    }
  }

  if (goals.includes("RESET")) {
    if (carbs <= 40) {
      push("Reset — lower glycemic load", 18);
    } else {
      push("Reset — carb-heavy", -12);
    }
  }

  if (goals.includes("BRAINCARE")) {
    if (fat >= 18) {
      push("Brain care — healthy fats in range", 12);
    }
    if (candidate.healthyHighlights.includes("OMEGA_3")) {
      push("Brain care — omega-3 highlight", 10);
    }
  }

  if (calories >= 650) {
    push("Calorie dense", -8);
  } else if (calories && calories <= 520) {
    push("Approachable calorie load", 6);
  }
}

function applyDietaryPreferenceMatch(
  candidate: CandidateRecipe,
  profile: UserProfile,
  push: (reason: string, delta: number) => void
) {
  const preferences = profile.dietaryPreferences ?? [];
  if (!preferences.length) {
    return;
  }

  preferences.forEach((preference) => {
    const tags = preferenceTagMap[preference] ?? [preference];
    const matches = tags.some((tag) => candidate.tags.includes(tag));

    if (matches) {
      push(`Matches ${preference.toLowerCase()} preference`, 15);
    } else {
      push(`${preference.toLowerCase()} preference unmet`, -8);
    }
  });
}

function applyTasteMatch(
  candidate: CandidateRecipe,
  profile: UserProfile,
  push: (reason: string, delta: number) => void
) {
  const tastes = profile.tastePreferences ?? [];
  if (!tastes.length) {
    return;
  }

  const haystack = `${candidate.title} ${candidate.description ?? ""}`.toLowerCase();

  tastes.forEach((taste) => {
    const keywords = tasteKeywordMap[taste] ?? [];
    if (!keywords.length) {
      return;
    }

    if (keywords.some((keyword) => haystack.includes(keyword))) {
      push(`Hits your ${taste.toLowerCase()} vibe`, 10);
    }
  });
}

function applyMacroBalance(candidate: CandidateRecipe, push: (reason: string, delta: number) => void) {
  const protein = candidate.proteinGrams ?? 0;
  const carbs = candidate.carbsGrams ?? 0;
  const fat = candidate.fatGrams ?? 0;

  if (protein >= 30 && fat <= 22 && carbs <= 65) {
    push("Balanced macros", 5);
  }

  if (fat >= 25) {
    push("Higher fat load", -4);
  }
}

function applyPantryAvailability(coverage: PantryCoverage, push: (reason: string, delta: number) => void) {
  if (coverage.operatorStatus === InventoryStatus.OUT_OF_STOCK) {
    push("Kitchen pantry is out of core ingredients", -35);
    if (coverage.operatorMissingIngredients.length) {
      push(
        `Global shortfall: ${coverage.operatorMissingIngredients
          .slice(0, 2)
          .map((gap) => gap.ingredientName.toLowerCase())
          .join(", ")}`,
        -8
      );
    }
    return;
  }

  if (coverage.operatorStatus === InventoryStatus.LOW_STOCK) {
    push("Operator pantry running low", -6);
  }

  if (coverage.status === InventoryStatus.OUT_OF_STOCK || coverage.cookableServings <= 0) {
    push("Pantry missing core ingredients", -30);
    if (coverage.missingIngredients.length) {
      push(
        `Missing ${coverage.missingIngredients
          .slice(0, 2)
          .map((gap) => gap.ingredientName.toLowerCase())
          .join(", ")}`,
        -6
      );
    }
    return;
  }

  if (coverage.status === InventoryStatus.LOW_STOCK) {
    push("Only enough pantry stock for one serving", -6);
  } else {
    push("Pantry ready for multiple servings", 8);
  }

  if (coverage.cookableServings >= 3) {
    push("Cookable for 3+ servings", 6);
  }

  if (coverage.lowStockIngredients.length) {
    push(
      `Low pantry levels: ${coverage.lowStockIngredients
        .slice(0, 2)
        .map((gap) => gap.ingredientName.toLowerCase())
        .join(", ")}`,
      -4
    );
  }
}

type AiRankingResponse = {
  recipeId: string;
  rationale?: string;
  healthySwapIdea?: string;
  swapRecipeId?: string;
}[];

async function rankWithLLM(
  profile: UserProfile,
  candidates: ScoredCandidate[],
  limit: number
): Promise<AiRankingResponse | null> {
  if (!OPENAI_API_KEY || !ENABLE_AI_RANKING) {
    return null;
  }

  try {
    const payload = {
      profile: {
        goals: profile.dietaryGoals,
        allergens: profile.allergens,
        diet: profile.dietaryPreferences,
        tastes: profile.tastePreferences,
      },
      limit,
      candidates: candidates.map((candidate) => ({
        recipeId: candidate.id,
        title: candidate.title,
        macrosLabel: candidate.macrosLabel,
        tags: candidate.tags,
        highlights: (candidate.healthyHighlights ?? []).slice(0, 3),
        score: candidate.score,
        pantryStatus: candidate.pantryCoverage.status,
        cookableServings: candidate.pantryCoverage.cookableServings,
        missingIngredients: candidate.pantryCoverage.missingIngredients.map((gap) => gap.ingredientName),
        operatorStatus: candidate.pantryCoverage.operatorStatus,
        operatorMissing: candidate.pantryCoverage.operatorMissingIngredients.map((gap) => gap.ingredientName),
      })),
    };

    const normalizedBase = OPENAI_BASE_URL.replace(/\/$/, "");
    const response = await fetch(`${normalizedBase}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: RECOMMENDER_MODEL,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are GoodFork's nutrition assistant. Re-rank menu items for the user. Always obey diet/allergen constraints and pantry availability; never return recipes that conflict. Prefer items that best match primary goal and taste preferences. Return compact rationales (<200 chars) and optional healthy swap ideas.",
          },
          {
            role: "user",
            content: `Given this JSON payload, return JSON shaped as {"recommendations":[{"recipeId":"","rationale":"","healthySwapIdea":"","swapRecipeId":""}]}. Limit to ${limit} unique recipeIds.\nPayload:\n${JSON.stringify(
              payload
            )}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const completion = await response.json();
    const message = completion?.choices?.[0]?.message?.content;
    if (!message) {
      return null;
    }

    const parsed = safeJsonParse<{
      recommendations?: {
        recipeId: string;
        rationale?: string;
        healthySwapIdea?: string;
        swapRecipeId?: string;
      }[];
    }>(message);

    if (!parsed?.recommendations?.length) {
      return null;
    }

    // Keep only candidates the backend knows about and dedupe
    const seen = new Set<string>();
    const filtered = parsed.recommendations
      .filter((entry) => entry.recipeId && !seen.has(entry.recipeId))
      .map((entry) => {
        seen.add(entry.recipeId);
        return entry;
      })
      .slice(0, limit);

    return filtered;
  } catch (error) {
    console.error("AI ranking failed", error);
    return null;
  }
}

function buildDeterministicRationale(
  recipe: CandidateRecipe,
  profile: UserProfile,
  coverage: PantryCoverage,
  macrosLabel: string
) {
  const primaryGoal = profile.dietaryGoals?.[0];
  const highlights = recipe.healthyHighlights?.slice(0, 2).join(", ");
  const readyText = buildPantryReadinessText(coverage);

  if (primaryGoal === "LEAN_MUSCLE" && recipe.proteinGrams) {
    return `Delivers ${recipe.proteinGrams}g protein with ${macrosLabel}, dialed for your lean muscle focus. ${readyText}`;
  }

  if (primaryGoal === "ENERGY" && recipe.carbsGrams) {
    return `Steady energy pick: ${macrosLabel} plus ${highlights || "fresh greens"} to avoid crashes. ${readyText}`;
  }

  if (primaryGoal === "RESET" && recipe.carbsGrams) {
    return `Lower glycemic load with ${recipe.carbsGrams}g carbs and ${highlights || "crunchy veggies"}. ${readyText}`;
  }

  if (primaryGoal === "BRAINCARE") {
    return `Braincare boost featuring ${highlights || "healthy fats"} and ${macrosLabel}. ${readyText}`;
  }

  return `${macrosLabel || "Balanced macros"} with ${highlights || "inventory-fresh produce"}. ${readyText}`;
}

function buildHealthySwapSuggestion(recipe: CandidateRecipe, profile: UserProfile) {
  const calories = recipe.calories ?? 0;
  const carbs = recipe.carbsGrams ?? 0;
  const fat = recipe.fatGrams ?? 0;

  if (calories >= 600) {
    return "Swap half the grain base for shaved greens to shave ~80 kcal.";
  }

  if (profile.dietaryGoals?.includes("RESET") && carbs >= 45) {
    return "Ask for cauliflower rice instead of grains to drop net carbs.";
  }

  if (fat >= 24) {
    return "Choose citrus vinaigrette over creamy sauce to reduce fats.";
  }

  if (profile.dietaryPreferences?.includes("VEGAN") && recipe.allergens.includes("DAIRY")) {
    return "Request toasted seeds instead of dairy toppings for vegan alignment.";
  }

  return "Add crunchy greens in place of starch for a lighter swap.";
}

function buildPantryReadinessText(coverage: PantryCoverage) {
  if (coverage.operatorStatus === InventoryStatus.OUT_OF_STOCK) {
    if (coverage.operatorMissingIngredients.length) {
      return `Kitchen shortfall: ${coverage.operatorMissingIngredients
        .map((gap) => gap.ingredientName.toLowerCase())
        .join(", ")} until the operator pantry restocks.`;
    }
    return "Kitchen shortfall — operator pantry needs a restock before this dish is available.";
  }

  if (coverage.operatorStatus === InventoryStatus.LOW_STOCK) {
    return "Operator pantry running low — snag it before the kitchen runs out.";
  }

  if (coverage.status === InventoryStatus.OUT_OF_STOCK || coverage.cookableServings <= 0) {
    if (!coverage.missingIngredients.length) {
      return "Missing pantry components—restock to cook this dish.";
    }

    return `Missing ${coverage.missingIngredients
      .map((gap) => gap.ingredientName.toLowerCase())
      .join(", ")} right now.`;
  }

  if (coverage.status === InventoryStatus.LOW_STOCK) {
    return `Enough pantry stock for ${coverage.cookableServings} serving${
      coverage.cookableServings === 1 ? "" : "s"
    } before restocking.`;
  }

  return `Pantry ready for ${coverage.cookableServings} serving${
    coverage.cookableServings === 1 ? "" : "s"
  } without extra trips.`;
}

function buildMacrosLabel(recipe: SlimRecipe) {
  const macros: string[] = [];
  if (recipe.proteinGrams != null) {
    macros.push(`${recipe.proteinGrams}g protein`);
  }
  if (recipe.carbsGrams != null) {
    macros.push(`${recipe.carbsGrams}g carbs`);
  }
  if (recipe.fatGrams != null) {
    macros.push(`${recipe.fatGrams}g fat`);
  }

  return macros.join(" · ");
}

function buildMacrosLabelFromNumbers(
  proteinGrams: number | null | undefined,
  carbsGrams: number | null | undefined,
  fatGrams: number | null | undefined
) {
  const macros: string[] = [];
  if (proteinGrams != null) {
    macros.push(`${proteinGrams}g protein`);
  }
  if (carbsGrams != null) {
    macros.push(`${carbsGrams}g carbs`);
  }
  if (fatGrams != null) {
    macros.push(`${fatGrams}g fat`);
  }

  return macros.join(" · ");
}

function truncate(text?: string | null, max = 220) {
  if (!text) {
    return text ?? null;
  }

  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function safeJsonParse<T>(value: string): T | null {
  try {
    const jsonStart = value.indexOf("{");
    const jsonEnd = value.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      return null;
    }
    return JSON.parse(value.slice(jsonStart, jsonEnd + 1)) as T;
  } catch {
    return null;
  }
}

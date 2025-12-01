import {
  InventoryStatus,
  type InventoryItem,
  type Recipe,
  type User,
  type UserProfile,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  DATABASE_URL,
  ENABLE_AI_RANKING,
  OPENAI_API_KEY,
  OPENAI_BASE_URL,
  RECOMMENDER_MODEL,
  REQUIRE_AI_RANKING,
} from "@/constants/app.constants";
import type {
  RecommendationCard,
  RecommendationResponse,
  ScoreAdjustment,
} from "@/services/shared/recommendations.types";

type GenerateRecommendationsInput = {
  userId?: string;
  email?: string;
  limit?: number;
  sessionId?: string;
  deterministicOnly?: boolean;
};

type CandidateRecipe = Recipe & { inventory: InventoryItem | null };

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
const BUDGET_CUSHION_CENTS = 200;
const INVENTORY_PLENTY_THRESHOLD = 35;
const INVENTORY_LOW_WARNING = 12;

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
  MEDITERRANEAN: ["MEDITERRANEAN", "GUT_HEALTH"],
  LOW_CARB: ["LOW_CARB", "LIGHTER_CHOICE"],
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

  const candidates = await loadCandidateRecipes(profile, limit);

  if (candidates.length === 0) {
    throw createRecommendationError("No inventory matches the stated allergens right now.", {
      statusCode: 404,
      clientMessage: "We're out of inventory that matches your allergens right now. Check back soon!",
      errorCode: "inventory_empty",
    });
  }

  const scored = scoreCandidates(candidates, profile);
  const candidateMap = new Map(scored.map((entry) => [entry.id, entry]));

  let finalSelection: FinalCandidate[] | null = null;

  if (!input.deterministicOnly && ENABLE_AI_RANKING && OPENAI_API_KEY && RECOMMENDER_MODEL) {
    const aiRanked = await rankWithLLM(profile, scored, limit);
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

    finalSelection = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry) => ({
        ...entry,
        rankingSource: "deterministic" as const,
        rationale: entry.deterministicRationale,
        healthySwapCopy: entry.deterministicSwap,
        swapRecipeId: null,
      }));
  }

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

    const inventory = record.recipe.inventory;

    return {
      recommendationId: record.id,
      recipeId: record.recipeId,
      slug: record.recipe.slug,
      title: record.recipe.title,
      description: record.recipe.description,
      imageUrl: record.recipe.imageUrl ?? null,
      priceCents: record.recipe.priceCents,
      priceDisplay: formatCurrency(record.recipe.priceCents),
      calories: record.recipe.calories ?? null,
      proteinGrams: record.recipe.proteinGrams ?? null,
      carbsGrams: record.recipe.carbsGrams ?? null,
      fatGrams: record.recipe.fatGrams ?? null,
      macrosLabel: entry.macrosLabel,
      tags: record.recipe.tags,
      healthyHighlights: record.recipe.healthyHighlights,
      allergens: record.recipe.allergens,
      inventory: {
        status: inventory?.status ?? InventoryStatus.OUT_OF_STOCK,
        quantity: inventory?.quantity ?? 0,
        unitLabel: inventory?.unitLabel ?? "unit",
      },
      rationale: record.rationale,
      healthySwapCopy: record.healthySwapRationale ?? entry.healthySwapCopy ?? null,
      swapRecipe: record.healthySwapRecipe
        ? { id: record.healthySwapRecipe.id, title: record.healthySwapRecipe.title }
        : null,
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

async function loadCandidateRecipes(profile: UserProfile, desired: number) {
  const recipes = await prisma.recipe.findMany({
    include: { inventory: true },
  });

  const allergens = profile.allergens ?? [];

  const available = recipes.filter((recipe) => {
    if (!recipe.inventory || !isInventoryAvailable(recipe.inventory)) {
      return false;
    }

    if (!isAllergenSafe(recipe, allergens)) {
      return false;
    }

    return true;
  });

  const inStock = available.filter((recipe) => recipe.inventory?.status === InventoryStatus.IN_STOCK);
  const lowStock = available.filter((recipe) => recipe.inventory?.status === InventoryStatus.LOW_STOCK);

  if (inStock.length >= desired) {
    return inStock;
  }

  return [...inStock, ...lowStock];
}

function isInventoryAvailable(inventory: InventoryItem | null) {
  if (!inventory) {
    return false;
  }

  if (inventory.status === InventoryStatus.OUT_OF_STOCK) {
    return false;
  }

  return inventory.quantity > 0;
}

function isAllergenSafe(recipe: Recipe, allergens: string[]) {
  if (!allergens?.length) {
    return true;
  }

  return !recipe.allergens.some((allergen) => allergens.includes(allergen));
}

function scoreCandidates(candidates: CandidateRecipe[], profile: UserProfile): ScoredCandidate[] {
  return candidates.map((candidate) => {
    let score = BASE_SCORE;
    const adjustments: ScoreAdjustment[] = [];

    const inventory = candidate.inventory!;

    const addAdjustment = (reason: string, delta: number) => {
      score += delta;
      adjustments.push({ reason, delta });
    };

    applyInventoryAvailability(inventory, addAdjustment);

    applyGoalHeuristics(candidate, profile, addAdjustment);
    applyDietaryPreferenceMatch(candidate, profile, addAdjustment);
    applyTasteMatch(candidate, profile, addAdjustment);
    applyBudgetHeuristic(candidate, profile, addAdjustment);
    applyMacroBalance(candidate, addAdjustment);

    const macrosLabel = buildMacrosLabel(candidate);
    const deterministicRationale = buildDeterministicRationale(candidate, profile, inventory, macrosLabel);
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
      push("Lean muscle — high protein density", 18);
    } else if (protein >= 25) {
      push("Lean muscle — solid protein support", 10);
    } else {
      push("Lean muscle — limited protein", -6);
    }
  }

  if (goals.includes("ENERGY")) {
    if (carbs >= 35 && carbs <= 65) {
      push("Energy — steady carb window", 8);
    } else if (carbs > 80) {
      push("Energy — heavy carbs", -5);
    }
  }

  if (goals.includes("RESET")) {
    if (carbs <= 40) {
      push("Reset — lower glycemic load", 9);
    } else {
      push("Reset — carb-heavy", -7);
    }
  }

  if (goals.includes("BRAINCARE")) {
    if (fat >= 18) {
      push("Brain care — healthy fats in range", 7);
    }
    if (candidate.healthyHighlights.includes("OMEGA_3")) {
      push("Brain care — omega-3 highlight", 6);
    }
  }

  if (calories >= 650) {
    push("Calorie dense", -6);
  } else if (calories && calories <= 520) {
    push("Approachable calorie load", 4);
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
      push(`Matches ${preference.toLowerCase()} preference`, 8);
    } else {
      push(`${preference.toLowerCase()} preference unmet`, -5);
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
      push(`Hits your ${taste.toLowerCase()} vibe`, 6);
    }
  });
}

function applyBudgetHeuristic(
  candidate: CandidateRecipe,
  profile: UserProfile,
  push: (reason: string, delta: number) => void
) {
  if (!profile.budgetTargetCents) {
    return;
  }

  const budget = profile.budgetTargetCents + BUDGET_CUSHION_CENTS;
  const diff = budget - candidate.priceCents;

  if (diff >= 0) {
    push(`Within budget (saves ${formatCurrency(Math.max(diff - BUDGET_CUSHION_CENTS, 0))})`, 6);
  } else {
    push(`Over budget by ${formatCurrency(Math.abs(diff))}`, -Math.min(14, Math.round(Math.abs(diff) / 100) + 4));
  }
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

function applyInventoryAvailability(inventory: InventoryItem, push: (reason: string, delta: number) => void) {
  if (inventory.status === InventoryStatus.OUT_OF_STOCK || inventory.quantity <= 0) {
    push("Out of stock", -100);
    return;
  }

  if (inventory.status === InventoryStatus.LOW_STOCK) {
    if (inventory.quantity <= 4) {
      push("Critical inventory — nearly gone", -14);
    } else if (inventory.quantity <= INVENTORY_LOW_WARNING) {
      push(`Low stock — ${inventory.quantity} left`, -8);
    } else {
      push("Limited availability", -5);
    }
    return;
  }

  if (inventory.quantity >= INVENTORY_PLENTY_THRESHOLD) {
    push(`Plentiful inventory (${inventory.quantity} units)`, 10);
  } else if (inventory.quantity >= 20) {
    push("Healthy inventory buffer", 6);
  } else {
    push("Ready now", 4);
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
        budgetTargetCents: profile.budgetTargetCents,
      },
      limit,
      candidates: candidates.map((candidate) => ({
        recipeId: candidate.id,
        title: candidate.title,
        priceCents: candidate.priceCents,
        macrosLabel: candidate.macrosLabel,
        tags: candidate.tags,
        highlights: candidate.healthyHighlights,
        score: candidate.score,
        description: candidate.description,
        inventoryStatus: candidate.inventory?.status,
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
              "You are GoodFork's nutrition assistant. Re-rank menu items for the user. Return compact rationales (<200 chars) and optional healthy swap ideas.",
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

    return parsed.recommendations.slice(0, limit);
  } catch (error) {
    console.error("AI ranking failed", error);
    return null;
  }
}

function buildDeterministicRationale(
  recipe: CandidateRecipe,
  profile: UserProfile,
  inventory: InventoryItem,
  macrosLabel: string
) {
  const primaryGoal = profile.dietaryGoals?.[0];
  const highlights = recipe.healthyHighlights?.slice(0, 2).join(", ");
  const readyText =
    inventory.status === InventoryStatus.LOW_STOCK
      ? `Low stock—only ${inventory.quantity} ${inventory.unitLabel} left.`
      : `Ready now with ${inventory.quantity} ${inventory.unitLabel} prepped.`;

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

function buildMacrosLabel(recipe: Recipe) {
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

function formatCurrency(cents: number) {
  const dollars = cents / 100;
  return dollars.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

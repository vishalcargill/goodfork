import type { InventoryStatus } from "@/generated/prisma/client";

export type ScoreAdjustment = {
  reason: string;
  delta: number;
};

export type PantryGap = {
  ingredient: string;
  unitLabel: string;
  requiredQuantity: number;
  availableQuantity: number;
  status?: InventoryStatus;
};

export type RecommendationCard = {
  recommendationId: string;
  recipeId: string;
  slug: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  calories: number | null;
  proteinGrams: number | null;
  carbsGrams: number | null;
  fatGrams: number | null;
  macrosLabel: string;
  tags: string[];
  healthyHighlights: string[];
  allergens: string[];
  pantry: {
    status: InventoryStatus;
    cookableServings: number;
    missingIngredients: PantryGap[];
    lowStockIngredients: PantryGap[];
    operatorStatus: InventoryStatus;
    operatorMissingIngredients: PantryGap[];
    operatorLowStockIngredients: PantryGap[];
  };
  rationale: string;
  healthySwapCopy: string | null;
  swapRecipe: {
    id: string;
    title: string;
  } | null;
  metadata: {
    rankingSource: "llm" | "deterministic";
    baseScore: number;
    adjustments: ScoreAdjustment[];
  };
};

export type RecommendationResponse = {
  userId: string;
  requested: number;
  delivered: number;
  source: "llm" | "deterministic";
  recommendations: RecommendationCard[];
};

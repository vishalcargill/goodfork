import type { InventoryStatus } from "@/generated/prisma/client";

export type ScoreAdjustment = {
  reason: string;
  delta: number;
};

export type RecommendationCard = {
  recommendationId: string;
  recipeId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number;
  priceDisplay: string;
  calories: number | null;
  proteinGrams: number | null;
  carbsGrams: number | null;
  fatGrams: number | null;
  macrosLabel: string;
  tags: string[];
  healthyHighlights: string[];
  allergens: string[];
  inventory: {
    status: InventoryStatus;
    quantity: number;
    unitLabel: string;
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

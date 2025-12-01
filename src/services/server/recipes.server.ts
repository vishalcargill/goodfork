import { Prisma, type InventoryItem, type Recipe } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";

export type MacroStat = {
  key: string;
  label: string;
  value: string;
};

export type TimeStat = {
  label: string;
  value: string;
};

export type NutritionEntry = {
  key: string;
  label: string;
  value: string;
};

export type RecipeInsight = {
  title: string;
  description: string;
};

type RecipeWithMeta = Recipe & {
  inventory: InventoryItem | null;
  recommendations: { createdAt: Date }[];
};

export type RecipeDetailPayload = {
  recipe: RecipeWithMeta;
  macroStats: MacroStat[];
  macrosLabel: string;
  timeStats: TimeStat[];
  priceDisplay: string;
  aiInsights: RecipeInsight[];
  nutritionEntries: NutritionEntry[];
  recommendationStats: {
    totalServed: number;
    lastServedAt: Date | null;
  };
};

export async function getRecipeDetailBySlug(slug: string): Promise<RecipeDetailPayload | null> {
  const recipe = await prisma.recipe.findUnique({
    where: { slug },
    include: {
      inventory: true,
      recommendations: {
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!recipe) {
    return null;
  }

  const totalServed = await prisma.recommendation.count({ where: { recipeId: recipe.id } });
  const macroStats = buildMacroStats(recipe);
  const macrosLabel = macroStats.map((entry) => entry.value).join(" · ");
  const timeStats = buildTimeStats(recipe);
  const { entries: nutritionEntries, lookup } = normalizeNutrients(recipe.nutrients);
  const aiInsights = buildDeterministicInsights(recipe, lookup, macrosLabel || null);

  return {
    recipe,
    macroStats,
    macrosLabel,
    timeStats,
    priceDisplay: formatCurrency(recipe.priceCents ?? 0),
    aiInsights,
    nutritionEntries,
    recommendationStats: {
      totalServed,
      lastServedAt: recipe.recommendations[0]?.createdAt ?? null,
    },
  };
}

function buildMacroStats(recipe: Recipe): MacroStat[] {
  const stats: MacroStat[] = [];

  if (recipe.calories != null) {
    stats.push({ key: "calories", label: "Calories", value: `${recipe.calories} kcal` });
  }

  if (recipe.proteinGrams != null) {
    stats.push({ key: "protein", label: "Protein", value: `${recipe.proteinGrams}g protein` });
  }

  if (recipe.carbsGrams != null) {
    stats.push({ key: "carbs", label: "Carbs", value: `${recipe.carbsGrams}g carbs` });
  }

  if (recipe.fatGrams != null) {
    stats.push({ key: "fat", label: "Fats", value: `${recipe.fatGrams}g fat` });
  }

  return stats;
}

function buildTimeStats(recipe: Recipe): TimeStat[] {
  const stats: TimeStat[] = [];

  if (recipe.prepTimeMinutes != null) {
    stats.push({ label: "Prep", value: `${recipe.prepTimeMinutes} min` });
  }

  if (recipe.cookTimeMinutes != null) {
    stats.push({ label: "Cook", value: `${recipe.cookTimeMinutes} min` });
  }

  const total = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);
  if (total > 0) {
    stats.push({ label: "Total", value: `${total} min` });
  }

  return stats;
}

type NutrientNormalizationResult = {
  entries: NutritionEntry[];
  lookup: Record<string, number>;
};

function normalizeNutrients(nutrients: Prisma.JsonValue | null | undefined): NutrientNormalizationResult {
  if (!nutrients || typeof nutrients !== "object" || Array.isArray(nutrients)) {
    return { entries: [], lookup: {} };
  }

  const entries: NutritionEntry[] = [];
  const lookup: Record<string, number> = {};

  for (const [key, value] of Object.entries(nutrients)) {
    const label = formatNutrientLabel(key);
    const formatted = formatNutrientValue(key, value);
    if (formatted) {
      entries.push({ key, label, value: formatted });
    }

    const numeric = parseNumeric(value);
    if (numeric != null) {
      lookup[key.toLowerCase()] = numeric;
    }
  }

  entries.sort((a, b) => a.label.localeCompare(b.label));
  return { entries, lookup };
}

function formatNutrientLabel(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function formatNutrientValue(key: string, value: unknown): string | null {
  if (value == null) {
    return null;
  }

  const numeric = parseNumeric(value);
  if (numeric != null) {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes("cal")) {
      return `${Math.round(numeric)} kcal`;
    }

    if (lowerKey.includes("sodium") || lowerKey.includes("cholesterol") || lowerKey.includes("potassium")) {
      return `${Math.round(numeric)} mg`;
    }

    return `${Math.round(numeric)} g`;
  }

  if (typeof value === "string") {
    return value;
  }

  return null;
}

function parseNumeric(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.]/g, "");
    if (!cleaned) {
      return null;
    }

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function buildDeterministicInsights(
  recipe: Recipe,
  nutrientLookup: Record<string, number>,
  macrosLabel: string | null
): RecipeInsight[] {
  const insights: RecipeInsight[] = [];

  const pushUnique = (insight: RecipeInsight) => {
    if (!insights.some((entry) => entry.title === insight.title)) {
      insights.push(insight);
    }
  };

  if (recipe.proteinGrams && recipe.proteinGrams >= 30) {
    pushUnique({
      title: "Protein-forward fuel",
      description: `Delivers ${recipe.proteinGrams}g protein to keep satiety and recovery dialed in.`,
    });
  } else if (recipe.proteinGrams && recipe.proteinGrams >= 20) {
    pushUnique({
      title: "Steady protein",
      description: `You still net ${recipe.proteinGrams}g protein—enough for balanced training days.`,
    });
  }

  if (recipe.calories && recipe.calories <= 450) {
    pushUnique({
      title: "Lighter caloric lift",
      description: `Keeps the plate near ${recipe.calories} kcal so it fits mid-day goals without feeling skimpy.`,
    });
  }

  const fiber = nutrientLookup["fiber"] ?? nutrientLookup["dietary_fiber"];
  if (fiber && fiber >= 8) {
    pushUnique({
      title: "Gut-friendly fiber",
      description: `Around ${Math.round(fiber)}g of fiber powers digestion and a calmer glycemic curve.`,
    });
  }

  const sodium = nutrientLookup["sodium"];
  if (sodium && sodium <= 650) {
    pushUnique({
      title: "Sodium stays in check",
      description: `Seasoning keeps sodium near ${Math.round(sodium)}mg, under GoodFork's lunch guardrail.`,
    });
  }

  if (recipe.proteinGrams && recipe.carbsGrams) {
    const ratio = recipe.carbsGrams / recipe.proteinGrams;
    if (ratio <= 2.2 && recipe.proteinGrams >= 20) {
      pushUnique({
        title: "Macro harmony",
        description: `Carb-to-protein ratio sits around ${ratio.toFixed(1)}:1 for even energy + satiety.`,
      });
    }
  }

  const highlightMap: Record<string, RecipeInsight> = {
    OMEGA_3: {
      title: "Omega-3 boost",
      description: "Fatty acids support heart and brain health without heavy saturated fat trade-offs.",
    },
    HEART_HEALTHY: {
      title: "Cardio-friendly choice",
      description: "Lean proteins, greens, and smart fats align with heart-health guardrails.",
    },
    GUT_HEALTH: {
      title: "Gut health highlight",
      description: "Ferments + fiber feed the microbiome for steadier digestion.",
    },
    BALANCED_MACROS: {
      title: "Balanced macros",
      description: macrosLabel
        ? `Macros stay evenly distributed (${macrosLabel}) so you avoid spikes.`
        : "Macros stay evenly distributed so you avoid spikes.",
    },
    LIGHTER_CHOICE: {
      title: "Lightweight portion",
      description: "Portion stays breezy so you can stack movement or snacks afterward.",
    },
    ENERGY_FOCUS: {
      title: "Energy focus",
      description: "Complex carbs pair with protein to smooth out the afternoon slump.",
    },
    HIGH_PROTEIN: {
      title: "High-protein highlight",
      description: "Meets the >25g protein bar for muscle maintenance and appetite control.",
    },
  };

  for (const highlight of recipe.healthyHighlights ?? []) {
    const normalized = highlight.toUpperCase();
    const mapped = highlightMap[normalized];
    if (mapped) {
      pushUnique(mapped);
    }
  }

  if (!insights.length && macrosLabel) {
    pushUnique({
      title: "Macro visibility",
      description: `You can scan macros at a glance (${macrosLabel}) for easy tracking.`,
    });
  }

  if (!insights.length) {
    pushUnique({
      title: "Chef-validated balance",
      description: "Operators tuned this recipe to GoodFork standards for inventory, nutrition, and taste.",
    });
  }

  const fallbacks: RecipeInsight[] = [
    {
      title: "Whole-food build",
      description: "Fresh produce + pantry staples keep additives low for a cleaner label.",
    },
    {
      title: "Swap-ready",
      description: "If inventory dips, operators already flagged a lighter swap to stay on track.",
    },
  ];

  for (const fallback of fallbacks) {
    if (insights.length >= 3) {
      break;
    }
    pushUnique(fallback);
  }

  return insights.slice(0, 4);
}

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

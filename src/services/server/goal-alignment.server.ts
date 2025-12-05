import {
  RecommendationStatus,
  type Recipe,
  type Recommendation,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { GOAL_OPTIONS } from "@/constants/personalization-options";

export type GoalAlignmentBand = "aligned" | "needs_nudge" | "off_track";

export type GoalAlignmentSample = {
  id: string;
  recipeTitle: string;
  recipeSlug: string;
  createdAt: Date;
  status: RecommendationStatus;
  macrosLabel: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  score: number;
  band: GoalAlignmentBand;
  note: string;
};

export type GoalAlignmentResult = {
  goal:
    | {
        value: string;
        label: string;
        helper?: string;
      }
    | null;
  averageScore: number;
  sampleCount: number;
  alignedCount: number;
  needsNudgeCount: number;
  offTrackCount: number;
  usedFallbackData: boolean;
  macroAverages: {
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
  };
  samples: GoalAlignmentSample[];
};

export async function getGoalAlignmentForUser(userId: string): Promise<GoalAlignmentResult> {
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  const primaryGoal = profile?.dietaryGoals?.[0] ?? null;

  const goalMeta = GOAL_OPTIONS.find((option) => option.value === primaryGoal) ?? null;

  const engagedRecommendations = await prisma.recommendation.findMany({
    where: {
      userId,
      status: {
        in: [RecommendationStatus.ACCEPTED, RecommendationStatus.SAVED, RecommendationStatus.SWAPPED],
      },
    },
    include: { recipe: true },
    orderBy: { updatedAt: "desc" },
    take: 16,
  });

  const usedFallbackData = engagedRecommendations.length === 0;
  const recommendations: (Recommendation & { recipe: Recipe })[] = usedFallbackData
    ? await prisma.recommendation.findMany({
        where: { userId },
        include: { recipe: true },
        orderBy: { createdAt: "desc" },
        take: 12,
      })
    : engagedRecommendations;

  const samples = recommendations.map((recommendation) => {
    const evaluation = evaluateAlignment(recommendation.recipe, primaryGoal);

    return {
      id: recommendation.id,
      recipeTitle: recommendation.recipe.title,
      recipeSlug: recommendation.recipe.slug,
      createdAt: recommendation.updatedAt ?? recommendation.createdAt,
      status: recommendation.status,
      macrosLabel: buildMacrosLabel(recommendation.recipe),
      calories: recommendation.recipe.calories,
      protein: recommendation.recipe.proteinGrams,
      carbs: recommendation.recipe.carbsGrams,
      fat: recommendation.recipe.fatGrams,
      score: evaluation.score,
      band: evaluation.band,
      note: evaluation.note,
    };
  });

  const sampleCount = samples.length;
  const averageScore = sampleCount
    ? Math.round(samples.reduce((total, sample) => total + sample.score, 0) / sampleCount)
    : 0;

  const macroSums = samples.reduce(
    (acc, sample) => {
      acc.calories.push(sample.calories ?? null);
      acc.protein.push(sample.protein ?? null);
      acc.carbs.push(sample.carbs ?? null);
      acc.fat.push(sample.fat ?? null);
      return acc;
    },
    { calories: [] as Array<number | null>, protein: [] as Array<number | null>, carbs: [] as Array<number | null>, fat: [] as Array<number | null> }
  );

  const macroAverages = {
    calories: computeAverage(macroSums.calories),
    protein: computeAverage(macroSums.protein),
    carbs: computeAverage(macroSums.carbs),
    fat: computeAverage(macroSums.fat),
  };

  const bandCounts = samples.reduce(
    (acc, sample) => {
      acc[sample.band] += 1;
      return acc;
    },
    { aligned: 0, needs_nudge: 0, off_track: 0 }
  );

  return {
    goal: goalMeta ? { value: goalMeta.value, label: goalMeta.label, helper: goalMeta.helper } : null,
    averageScore,
    sampleCount,
    alignedCount: bandCounts.aligned,
    needsNudgeCount: bandCounts.needs_nudge,
    offTrackCount: bandCounts.off_track,
    usedFallbackData,
    macroAverages,
    samples,
  };
}

function evaluateAlignment(recipe: Recipe, primaryGoal: string | null) {
  const protein = recipe.proteinGrams ?? 0;
  const carbs = recipe.carbsGrams ?? 0;
  const fat = recipe.fatGrams ?? 0;
  const calories = recipe.calories ?? 0;
  const highlights = recipe.healthyHighlights ?? [];

  let score = 50;
  const notes: string[] = [];

  const add = (delta: number, note: string) => {
    score += delta;
    if (note) {
      notes.push(note);
    }
  };

  switch (primaryGoal) {
    case "LEAN_MUSCLE": {
      if (protein >= 35) {
        add(35, "35g+ protein hits your lean muscle target.");
      } else if (protein >= 25) {
        add(22, "Solid protein support for lean muscle days.");
      } else if (protein >= 18) {
        add(10, "Moderate protein—consider bumping to 25g+.");
      } else {
        add(-6, "Protein sits below lean muscle targets.");
      }

      if (fat > 24) {
        add(-8, "Fat load is heavier than ideal for lean focus.");
      }

      if (calories > 700) {
        add(-6, "Higher calories may slow lean muscle progress.");
      }
      break;
    }
    case "ENERGY": {
      if (carbs >= 35 && carbs <= 65) {
        add(25, "Carbs fall in the steady energy window (35–65g).");
      } else if (carbs >= 25 && carbs <= 80) {
        add(12, "Carbs are serviceable for energy, but could be tighter.");
      } else if (carbs > 0) {
        add(-8, "Carbs sit outside the energy-friendly range.");
      }

      if (protein >= 20) {
        add(8, "Protein keeps energy steadier through the meal.");
      }

      if (fat >= 26) {
        add(-8, "Fat load could slow energy delivery.");
      }
      break;
    }
    case "RESET": {
      if (carbs > 0 && carbs <= 35) {
        add(24, "Carbs stay low for reset days.");
      } else if (carbs <= 50) {
        add(12, "Carbs are moderate—close to reset targets.");
      } else {
        add(-10, "Carbs exceed the reset guardrail.");
      }

      if (calories && calories <= 550) {
        add(8, "Calories stay in a lighter range.");
      }

      if (fat > 0 && fat <= 22) {
        add(6, "Fats stay in check for reset.");
      }
      break;
    }
    case "BRAINCARE": {
      if (highlights.includes("OMEGA_3")) {
        add(18, "Omega-3 highlight aligns with brain care.");
      }

      if (fat >= 18) {
        add(18, "Healthy fats support cognitive focus.");
      } else if (fat >= 12) {
        add(10, "Solid fats for focus—could add a drizzle of oil.");
      } else {
        add(-6, "Consider more healthy fats for brain care.");
      }

      if (protein >= 20) {
        add(6, "Protein balance helps avoid crashes.");
      }
      break;
    }
    default: {
      add(5, "General balance applied.");
      break;
    }
  }

  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const band: GoalAlignmentBand =
    clamped >= 80 ? "aligned" : clamped >= 60 ? "needs_nudge" : "off_track";

  return {
    score: clamped,
    band,
    note: notes[0] ?? "Balanced macros for your profile.",
  };
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

function computeAverage(values: Array<number | null>): number | null {
  const valid = values.filter((value): value is number => typeof value === "number");
  if (!valid.length) {
    return null;
  }

  const avg = valid.reduce((total, value) => total + value, 0) / valid.length;
  return Math.round(avg);
}

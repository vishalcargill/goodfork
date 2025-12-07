"use client";

import { Sparkle, TrendUp, Heart } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { RecommendationCard } from "@/services/shared/recommendations.types";

type NutritionSnapshotProps = {
  recommendations: RecommendationCard[];
  className?: string;
};

export function NutritionSnapshot({ recommendations, className }: NutritionSnapshotProps) {
  if (!recommendations.length) return null;

  // Simple derived stats
  const highProteinCount = recommendations.filter((r) => 
    r.tags?.some(t => t.toLowerCase().includes("protein"))
  ).length;
  
  const quickPrepCount = recommendations.filter((r) => {
    // Heuristic: if "prep time" is mentioned in rationale or if it has a "quick" tag
    // Since we don't have structured prep time, we look for tags
    return r.tags?.some(t => ["quick", "easy", "under 30"].some(k => t.toLowerCase().includes(k)));
  }).length;

  return (
    <div className={cn("rounded-xl border border-border bg-surface p-4 sm:p-6", className)}>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkle className="h-5 w-5" weight="duotone" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">Today&apos;s Nutrition Snapshot</h3>
            <p className="text-xs text-muted-foreground max-w-md">
              Based on your {recommendations.length} personalized menus, we&apos;ve prioritized protein-rich options and heart-healthy fats.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {highProteinCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-surface-subtle px-3 py-2 text-xs font-medium">
              <TrendUp className="h-4 w-4 text-success" />
              <span>{highProteinCount} High Protein</span>
            </div>
          )}
          <div className="flex items-center gap-2 rounded-lg bg-surface-subtle px-3 py-2 text-xs font-medium">
            <Heart className="h-4 w-4 text-rose-500" />
            <span>Heart Healthy Focus</span>
          </div>
           <div className="flex items-center gap-2 rounded-lg bg-surface-subtle px-3 py-2 text-xs font-medium">
            <span className="text-primary">3</span>
            <span>Cookable Now</span>
          </div>
        </div>
      </div>
    </div>
  );
}


"use client";

import Link from "next/link";
import { Target, ShieldCheck, Package } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export type ProfileSummaryProps = {
  goalLabels: string[];
  allergenLabels: string[];
  pantryStats: {
    readyCount: number;
    lowCount: number;
    isEmpty: boolean;
  };
};

export function ProfileSummaryBar({
  goalLabels,
  allergenLabels,
  pantryStats,
}: ProfileSummaryProps) {
  return (
    <div className="sticky top-0 z-20 w-full border-b border-border bg-surface/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-surface/80 md:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          {/* Goals */}
          <div className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-primary" weight="duotone" />
            <div className="flex flex-wrap gap-1.5">
              {goalLabels.length > 0 ? (
                goalLabels.map((label) => (
                  <span
                    key={`goal-${label}`}
                    className="inline-flex items-center rounded-md border border-border bg-surface-subtle px-2 py-0.5 text-xs font-medium text-foreground"
                  >
                    {label}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">No active goals</span>
              )}
            </div>
          </div>

          <div className="h-4 w-px bg-border hidden sm:block" />

          {/* Allergens */}
          <div className="flex items-center gap-2 text-sm">
            <ShieldCheck className="h-4 w-4 text-red-500" weight="duotone" />
            <div className="flex flex-wrap gap-1.5">
              {allergenLabels.length > 0 ? (
                allergenLabels.map((label) => (
                  <span
                    key={`allergen-${label}`}
                    className="inline-flex items-center rounded-md border border-red-500/20 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"
                  >
                    {label}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">No restrictions</span>
              )}
            </div>
          </div>

          <div className="h-4 w-px bg-border hidden sm:block" />

          {/* Pantry */}
          <div className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-secondary" weight="duotone" />
            <span className="text-xs text-muted-foreground">
              {pantryStats.isEmpty ? (
                "Pantry empty"
              ) : (
                <>
                  <span className="font-medium text-foreground">{pantryStats.readyCount}</span> ready ·{" "}
                  {pantryStats.lowCount > 0 ? (
                    <span className="text-warning">{pantryStats.lowCount} low</span>
                  ) : (
                    "Stocked"
                  )}
                </>
              )}
            </span>
            <Link
              href="/pantry"
              className="text-xs font-semibold text-primary hover:underline ml-1"
            >
              Update
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


"use client";

import { X, Sparkle, CheckCircle, WarningCircle, Info } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { RecommendationCard } from "@/services/shared/recommendations.types";
import { FeedbackActions } from "@/components/feedback/feedback-actions";

export type InsightsPanelProps = {
  card: RecommendationCard;
  userId: string;
  onClose: () => void;
  className?: string;
};

export function InsightsPanel({ card, userId, onClose, className }: InsightsPanelProps) {
  const pantry = card.pantry ?? {
    status: "IN_STOCK" as const,
    cookableServings: 2,
    missingIngredients: [],
    lowStockIngredients: [],
    operatorStatus: "IN_STOCK" as const,
    operatorMissingIngredients: [],
    operatorLowStockIngredients: [],
  };

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-l border-border bg-surface shadow-xl",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Sparkle className="h-4 w-4 text-primary" weight="duotone" />
          <span>Recommendation Insights</span>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-surface-subtle hover:text-foreground"
          aria-label="Close insights"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Rationale */}
        <section className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Why this recipe?
          </h4>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-foreground">
            {card.rationale}
          </div>
        </section>

        {/* Goal Adjustments */}
        {card.metadata?.adjustments?.length > 0 && (
          <section className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Goal Alignment
            </h4>
            <div className="space-y-2">
              {card.metadata.adjustments.map((adj, idx) => (
                <div
                  key={`adj-${idx}`}
                  className="flex items-start gap-2 rounded-lg border border-border bg-surface-subtle p-3 text-sm"
                >
                  <CheckCircle className="mt-0.5 h-4 w-4 text-success" weight="duotone" />
                  <div>
                    <p className="font-medium text-foreground">{adj.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      Adjusted by {adj.delta > 0 ? "+" : ""}{adj.delta} to meet your target.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pantry Details */}
        {(pantry.missingIngredients.length > 0 || pantry.lowStockIngredients.length > 0) && (
          <section className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Pantry Notes
            </h4>
            <div className="rounded-lg border border-border bg-surface-subtle p-3 text-sm">
               {pantry.missingIngredients.length > 0 && (
                 <div className="mb-2">
                   <p className="flex items-center gap-1.5 font-medium text-destructive">
                     <WarningCircle className="h-4 w-4" />
                     Missing Ingredients
                   </p>
                   <ul className="mt-1 ml-5 list-disc text-xs text-muted-foreground">
                     {pantry.missingIngredients.map((item) => (
                       <li key={item.ingredient}>{item.ingredient}</li>
                     ))}
                   </ul>
                 </div>
               )}
               {pantry.lowStockIngredients.length > 0 && (
                 <div>
                   <p className="flex items-center gap-1.5 font-medium text-warning">
                     <Info className="h-4 w-4" />
                     Low Stock
                   </p>
                   <ul className="mt-1 ml-5 list-disc text-xs text-muted-foreground">
                     {pantry.lowStockIngredients.map((item) => (
                       <li key={item.ingredient}>{item.ingredient}</li>
                     ))}
                   </ul>
                 </div>
               )}
            </div>
          </section>
        )}

        {/* Feedback */}
        <section className="space-y-2 pt-4 border-t border-border">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Your Feedback
          </h4>
          <p className="text-xs text-muted-foreground mb-3">
             Help us tune your future menus by rating this recommendation.
          </p>
          <FeedbackActions recommendationId={card.recommendationId} userId={userId} layout="stacked" />
        </section>
      </div>
    </aside>
  );
}


"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Info } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { normalizeImageUrl } from "@/lib/images";
import { FeedbackActions } from "@/components/feedback/feedback-actions";
import type { RecommendationCard as RecommendationCardType } from "@/services/shared/recommendations.types";

export type RecommendationCardProps = {
  card: RecommendationCardType;
  userId: string;
  readOnly?: boolean;
  onOpenInsights?: () => void;
  isSwapped?: boolean;
  onSwap?: (hasSwap: boolean) => void;
};

const statusCopy = {
  IN_STOCK: {
    label: "Cookable now",
    badge: "bg-success/10 text-success border-success/20",
  },
  LOW_STOCK: {
    label: "Needs top-up",
    badge: "bg-warning/10 text-warning-foreground border-warning/20",
  },
  OUT_OF_STOCK: {
    label: "Missing items",
    badge: "bg-destructive/10 text-destructive border-destructive/20",
  },
} as const;

const FALLBACK_RECIPE_IMAGE = "/recipe-placeholder.svg";

export function RecommendationCard({
  card,
  userId,
  readOnly,
  onOpenInsights,
  isSwapped = false,
  onSwap,
}: RecommendationCardProps) {
  const pantry = card.pantry ?? {
    status: "IN_STOCK" as const,
    cookableServings: 2,
    missingIngredients: [],
    lowStockIngredients: [],
    operatorStatus: "IN_STOCK" as const,
    operatorMissingIngredients: [],
    operatorLowStockIngredients: [],
  };

  const personalStatus = pantry.status as keyof typeof statusCopy;
  const operatorStatus = (pantry.operatorStatus as keyof typeof statusCopy) ?? "IN_STOCK";
  
  // Prioritize operator (global) stock issues over personal pantry
  const badgeState = operatorStatus === "IN_STOCK" ? personalStatus : operatorStatus;
  const statusTheme = statusCopy[badgeState] ?? statusCopy.IN_STOCK;
  
  const badgeLabel =
    operatorStatus === "OUT_OF_STOCK"
      ? "Kitchen out"
      : operatorStatus === "LOW_STOCK"
      ? "Kitchen low"
      : statusCopy[personalStatus]?.label ?? statusCopy.IN_STOCK.label;

  const normalizedImageUrl = normalizeImageUrl(card.imageUrl);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const imageErrored = normalizedImageUrl ? failedImages.has(normalizedImageUrl) : false;
  const recipeImage = !normalizedImageUrl || imageErrored ? FALLBACK_RECIPE_IMAGE : normalizedImageUrl;

  const swap = card.swapRecipe;
  const hasSwap = Boolean(swap && swap.id && swap.id !== card.recipeId);
  const showingSwap = Boolean(isSwapped && hasSwap && swap);
  const activeTitle = showingSwap ? swap!.title : card.title;
  const activeSlug = showingSwap ? swap!.slug ?? card.slug : card.slug;
  const activeImage = showingSwap ? swap!.imageUrl ?? recipeImage : recipeImage;
  const activeMacrosLabel = showingSwap ? swap!.macrosLabel ?? card.macrosLabel : card.macrosLabel;
  const activeCalories = showingSwap ? swap!.calories ?? card.calories : card.calories;

  const detailHref =
    !readOnly && userId
      ? `/recipes/${activeSlug}?${new URLSearchParams({
          recommendationId: card.recommendationId,
          userId,
        }).toString()}`
      : `/recipes/${activeSlug}`;

  const handleImageError = () => {
    if (!normalizedImageUrl) return;
    setFailedImages((prev) => {
      if (prev.has(normalizedImageUrl)) return prev;
      const next = new Set(prev);
      next.add(normalizedImageUrl);
      return next;
    });
  };

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      {/* Image Section */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-subtle">
        <Link href={detailHref} aria-label={`View recipe for ${card.title}`}>
          <Image
            src={recipeImage}
            alt={card.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={handleImageError}
            unoptimized
          />
        </Link>
        <div className="absolute right-3 top-3">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-md",
              statusTheme.badge,
              "bg-opacity-90"
            )}
          >
            {badgeLabel}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
              {activeMacrosLabel || "Recommended"}
            </p>
            <span className="text-xs text-muted-foreground">
              {activeCalories != null ? `${activeCalories} kcal` : "—"}
            </span>
          </div>
          <Link href={detailHref} className="block">
            <h3 className="font-display text-lg font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
              {activeTitle}
            </h3>
          </Link>
          {showingSwap ? (
            <p className="text-xs font-semibold text-success flex items-center gap-1">
              <Info size={14} />
              Swapped to this healthier pick
            </p>
          ) : hasSwap ? (
            <p className="text-[11px] font-semibold text-emerald-800/80">Healthy swap available</p>
          ) : null}
        </div>

        {/* Badges / Tags */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {card.healthyHighlights.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-md bg-surface-subtle px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border-subtle"
            >
              {tag}
            </span>
          ))}
          {pantry.cookableServings > 0 && (
            <span className="inline-flex items-center rounded-md bg-surface-subtle px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border-subtle">
              {pantry.cookableServings} servings
            </span>
          )}
          {showingSwap && (
            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
              Swapped
            </span>
          )}
        </div>

        {/* AI Rationale */}
        <div className="mb-5 rounded-lg bg-surface-subtle p-3 text-sm">
          <p className="text-xs leading-relaxed text-muted-foreground">
            <span className="mr-1 font-semibold text-primary">Why:</span>
            {card.rationale}
          </p>
          {card.healthySwapCopy && (
            <p className="mt-2 text-xs leading-relaxed text-emerald-800">
              <span className="mr-1 font-semibold text-emerald-700">Healthy swap:</span>
              {card.healthySwapCopy}
            </p>
          )}
          {onOpenInsights && (
            <button
              onClick={onOpenInsights}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
            >
              <Info size={14} />
              See full insights
            </button>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="mt-auto pt-4 border-t border-border flex flex-col gap-3">
          {!readOnly ? (
            <div className="w-full space-y-2">
               <FeedbackActions 
                 recommendationId={card.recommendationId} 
                 userId={userId} 
                 onSwap={() => onSwap?.(hasSwap)}
                 swapDisabled={!hasSwap}
                 swapDisabledHint="No direct swap available for this recipe yet."
                 layout="inline" 
                 className="w-full sm:justify-between"
               />
            </div>
          ) : null}
          
          <Link
            href={detailHref}
            className="inline-flex h-8 items-center justify-center rounded-full bg-primary/10 px-4 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 w-full"
          >
            Cook
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}


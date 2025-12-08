"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, SlidersHorizontal, SortAscending, Funnel, Clock, Sparkle } from "@phosphor-icons/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  DEFAULT_RECOMMENDATION_DATA_SOURCE,
  RECOMMENDATION_DATA_SOURCES,
  type RecommendationDataSource,
  normalizeRecommendationSource,
} from "@/constants/data-sources";
import { useRecommendationsQuery } from "@/services/client/recommendations.client";
import type { RecommendationResponse } from "@/services/shared/recommendations.types";
import { RecommendationCard } from "@/components/recommendations/recommendation-card";
import { InsightsPanel } from "@/components/recommendations/insights-panel";
import { NutritionSnapshot } from "@/components/recommendations/nutrition-snapshot";

type RecommendationsGridProps = {
  activeEmail: string;
  initialSource?: RecommendationDataSource;
};

const SOURCE_LABELS: Record<RecommendationDataSource, string> = {
  backend: "Backend",
  supabase: "MCP",
};

function SourceToggle({
  value,
  onChange,
}: {
  value: RecommendationDataSource;
  onChange: (next: RecommendationDataSource) => void;
}) {
  return (
    <div className='inline-flex items-center gap-1 rounded-full border border-border bg-surface p-0.5 text-xs font-medium shadow-sm'>
      {RECOMMENDATION_DATA_SOURCES.map((option) => {
        const isActive = option === value;
        return (
          <button
            key={option}
            type='button'
            onClick={() => onChange(option)}
            className={cn(
              "rounded-full px-2.5 py-1 transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground"
            )}
          >
            {SOURCE_LABELS[option]}
          </button>
        );
      })}
    </div>
  );
}

export function RecommendationsGrid({
  activeEmail,
  initialSource = DEFAULT_RECOMMENDATION_DATA_SOURCE,
}: RecommendationsGridProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const source = useMemo(() => {
    const paramValue = searchParams?.get("source");
    return normalizeRecommendationSource(paramValue ?? initialSource);
  }, [initialSource, searchParams]);

  const recommendationsQuery = useRecommendationsQuery(
    activeEmail
      ? {
          email: activeEmail,
          source,
        }
      : null
  );
  const { data, isPending, isFetching } = recommendationsQuery;
  const successPayload = data && data.success ? data.data : null;
  const showSkeleton = isPending || (isFetching && !successPayload);

  useEffect(() => {
    if (data && !data.success && data.errorCode === "user_not_found") {
      toast.error("Profile not found", {
        description: "Please complete onboarding to see personalized menus.",
      });
    }
  }, [data]);

  const handleSourceChange = (nextSource: RecommendationDataSource) => {
    if (nextSource === source) return;

    toast.success(`Switched to ${SOURCE_LABELS[nextSource]} source`);

    const nextParams = new URLSearchParams(searchParams?.toString());
    nextParams.set("source", nextSource);
    if (activeEmail) {
      nextParams.set("prefillEmail", activeEmail);
    }

    router.replace(`/menus?${nextParams.toString()}`, { scroll: false });
  };

  return (
    <div className='space-y-6'>
      {/* Header Bar */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex flex-wrap items-center gap-4'>
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <Sparkle className='h-4 w-4 text-primary' weight='duotone' />
            <span className='font-medium text-foreground'>{successPayload?.delivered ?? 0} recommendations</span>
            <span className='hidden sm:inline text-border'>|</span>
            <span className='text-xs'>Updated just now</span>
          </div>
          <SourceToggle value={source} onChange={handleSourceChange} />
        </div>
      </div>

      {showSkeleton ? (
        <RecommendationsSkeleton />
      ) : successPayload ? (
        <RecommendationsList apiResponse={successPayload} />
      ) : (
        <EmptyRecommendations />
      )}
    </div>
  );
}

type RecommendationsListProps = {
  apiResponse: RecommendationResponse;
};

function RecommendationsList({ apiResponse }: RecommendationsListProps) {
  const cards = apiResponse.recommendations;
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [swappedIds, setSwappedIds] = useState<Set<string>>(new Set());

  const markSwapped = (recommendationId: string, hasSwap: boolean) => {
    if (!hasSwap) return;
    setSwappedIds((prev) => {
      const next = new Set(prev);
      next.add(recommendationId);
      return next;
    });
    setSelectedCardId(null);
  };

  const selectedCard = useMemo(() => cards.find((c) => c.recommendationId === selectedCardId), [cards, selectedCardId]);

  if (!cards.length) {
    return <EmptyRecommendations />;
  }

  const visibleCards = cards;

  return (
    <div className='relative space-y-8'>
      <div
        className={cn(
          "flex flex-col gap-6 transition-all duration-300",
          selectedCard ? "lg:flex-row lg:items-start" : ""
        )}
      >
        <div className='flex-1 min-w-0'>
          <div
            className={cn("grid gap-6 grid-cols-1 sm:grid-cols-2", selectedCard ? "lg:grid-cols-2" : "lg:grid-cols-4")}
          >
            {visibleCards.map((card) => (
              <div
                key={card.recommendationId}
                className={cn(
                  "transition-opacity duration-200",
                  selectedCardId && selectedCardId !== card.recommendationId ? "opacity-60 hover:opacity-100" : ""
                )}
              >
                <RecommendationCard
                  card={card}
                  userId={apiResponse.userId}
                  isSwapped={swappedIds.has(card.recommendationId)}
                  onSwap={(hasSwap) => markSwapped(card.recommendationId, hasSwap)}
                  onOpenInsights={() => setSelectedCardId(card.recommendationId)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Panel */}
        {selectedCard && (
          <div className='hidden lg:block w-80 xl:w-96 shrink-0 sticky top-24 h-[calc(100vh-8rem)]'>
            <InsightsPanel
              card={selectedCard}
              userId={apiResponse.userId}
              isSwapped={swappedIds.has(selectedCard.recommendationId)}
              onSwap={(hasSwap) => markSwapped(selectedCard.recommendationId, hasSwap)}
              onClose={() => setSelectedCardId(null)}
              className='h-full rounded-xl border border-border bg-surface/50 backdrop-blur-sm'
            />
          </div>
        )}
      </div>

      {/* Mobile Panel (Fixed Overlay) */}
      {selectedCard && (
        <div className='lg:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in'>
          <div
            className='bg-background w-full max-w-md max-h-[85vh] rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10'
            onClick={(e) => e.stopPropagation()}
          >
            <InsightsPanel
              card={selectedCard}
              userId={apiResponse.userId}
              isSwapped={swappedIds.has(selectedCard.recommendationId)}
              onSwap={(hasSwap) => markSwapped(selectedCard.recommendationId, hasSwap)}
              onClose={() => setSelectedCardId(null)}
              className='h-full border-none shadow-none'
            />
          </div>
          <div className='absolute inset-0 -z-10' onClick={() => setSelectedCardId(null)} />
        </div>
      )}

      {/* Nutrition Snapshot Footer */}
      <section className='pt-4'>
        <NutritionSnapshot recommendations={cards} />
      </section>
    </div>
  );
}

function RecommendationsSkeleton() {
  return (
    <div className='grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className='flex h-full animate-pulse flex-col rounded-xl border border-border bg-card p-0 shadow-sm'
        >
          <div className='h-48 w-full bg-surface-subtle' />
          <div className='flex-1 space-y-4 p-5'>
            <div className='flex justify-between'>
              <div className='h-3 w-1/4 rounded bg-surface-subtle' />
              <div className='h-3 w-1/4 rounded bg-surface-subtle' />
            </div>
            <div className='h-6 w-3/4 rounded bg-surface-subtle' />
            <div className='flex gap-2'>
              <div className='h-5 w-16 rounded bg-surface-subtle' />
              <div className='h-5 w-16 rounded bg-surface-subtle' />
            </div>
            <div className='h-20 rounded-lg bg-surface-subtle' />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyRecommendations() {
  return (
    <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface p-12 text-center text-muted-foreground'>
      <div className='mb-4 rounded-full bg-surface-subtle p-3'>
        <Funnel className='h-6 w-6 text-muted-foreground' />
      </div>
      <h3 className='text-lg font-semibold text-foreground'>No matches found</h3>
      <p className='mt-1 max-w-sm text-sm'>
        We couldn&apos;t find a perfect fit with your current filters. Try adjusting your goals or pantry.
      </p>
      <button
        onClick={() => window.location.reload()}
        className='mt-6 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90'
      >
        Refresh recommendations
      </button>
    </div>
  );
}

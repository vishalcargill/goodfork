"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { FeedbackActions } from "@/components/feedback/feedback-actions";
import {
  DEFAULT_RECOMMENDATION_DATA_SOURCE,
  RECOMMENDATION_DATA_SOURCES,
  type RecommendationDataSource,
  normalizeRecommendationSource,
} from "@/constants/data-sources";
import { cn } from "@/lib/utils";
import { normalizeImageUrl } from "@/lib/images";
import { useRecommendationsQuery } from "@/services/client/recommendations.client";
import type { RecommendationCard, RecommendationResponse } from "@/services/shared/recommendations.types";

type RecommendationsDemoProps = {
  activeEmail: string;
  initialSource?: RecommendationDataSource;
};

const statusCopy = {
  IN_STOCK: {
    label: "Cookable now",
    badge: "bg-success/10 text-success border-success/20",
  },
  LOW_STOCK: {
    label: "Needs quick top-up",
    badge: "bg-warning/10 text-warning-foreground border-warning/20",
  },
  OUT_OF_STOCK: {
    label: "Missing pantry items",
    badge: "bg-destructive/10 text-destructive border-destructive/20",
  },
} as const;

const SOURCE_LABELS: Record<RecommendationDataSource, string> = {
  backend: "Backend (Prisma)",
  supabase: "Supabase MCP",
};

const SOURCE_DESCRIPTIONS: Record<RecommendationDataSource, string> = {
  backend: "Direct from Prisma + inventory data.",
  supabase: "Supabase MCP connector (parity check).",
};

function SourceToggle({
  value,
  onChange,
}: {
  value: RecommendationDataSource;
  onChange: (next: RecommendationDataSource) => void;
}) {
  return (
    <div className='inline-flex items-center gap-2 rounded-full border border-border bg-surface p-1 text-xs font-semibold shadow-sm'>
      {RECOMMENDATION_DATA_SOURCES.map((option) => {
        const isActive = option === value;
        return (
          <button
            key={option}
            type='button'
            onClick={() => onChange(option)}
            className={cn(
              "rounded-full px-3 py-1 transition",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-surface-subtle"
            )}
          >
            {SOURCE_LABELS[option]}
          </button>
        );
      })}
    </div>
  );
}

export function RecommendationsDemo({
  activeEmail,
  initialSource = DEFAULT_RECOMMENDATION_DATA_SOURCE,
}: RecommendationsDemoProps) {
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
      toast.error("No onboarding profile found", {
        description: data.message,
      });
    }
  }, [data]);

  const handleSourceChange = (nextSource: RecommendationDataSource) => {
    if (nextSource === source) {
      return;
    }

    toast.success("Updated data source ", {
      description: SOURCE_LABELS[nextSource],
      position: "top-center",
    });

    const nextParams = new URLSearchParams(searchParams?.toString());
    nextParams.set("source", nextSource);
    if (activeEmail) {
      nextParams.set("prefillEmail", activeEmail);
    }

    router.replace(`/menus?${nextParams.toString()}`, { scroll: false });
  };

  const sourceDescription = useMemo(() => SOURCE_DESCRIPTIONS[source], [source]);

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='space-y-1 text-sm'>
          <p className='text-xs font-semibold uppercase tracking-wider text-primary'>Data source</p>
          <p className='text-muted-foreground'>
            {SOURCE_LABELS[source]} · {sourceDescription}
          </p>
        </div>
        <SourceToggle value={source} onChange={handleSourceChange} />
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
  const [cardsPerView, setCardsPerView] = useState(3);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    const determineCardsPerView = () => {
      if (typeof window === "undefined") {
        return;
      }

      const width = window.innerWidth;

      if (width < 640) {
        setCardsPerView(1);
      } else if (width < 1024) {
        setCardsPerView(2);
      } else {
        setCardsPerView(3);
      }
    };

    determineCardsPerView();
    window.addEventListener("resize", determineCardsPerView);

    return () => window.removeEventListener("resize", determineCardsPerView);
  }, []);

  if (!cards.length) {
    return <EmptyRecommendations />;
  }

  const totalPages = Math.max(1, Math.ceil(cards.length / cardsPerView));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const startIndex = safePageIndex * cardsPerView;
  const visibleCards = cards.slice(startIndex, startIndex + cardsPerView);
  const showingStart = startIndex + 1;
  const showingEnd = startIndex + visibleCards.length;
  const canGoPrev = safePageIndex > 0;
  const canGoNext = safePageIndex < totalPages - 1;

  const handlePrev = () => {
    if (canGoPrev) {
      setPageIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      setPageIndex((prev) => Math.min(prev + 1, totalPages - 1));
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1 text-xs'>
          <p className='font-semibold uppercase tracking-wider text-primary'>
            {apiResponse.delivered} menu cards · {apiResponse.source === "llm" ? "AI ranked" : "Deterministic fallback"}
          </p>
          <p className='text-[11px] text-muted-foreground'>
            Showing {showingStart}-{showingEnd} of {cards.length} · {cardsPerView} per view
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={handlePrev}
            disabled={!canGoPrev}
            className='inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-primary shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50'
          >
            <ArrowLeft className='h-4 w-4' />
            Previous
          </button>
          <button
            type='button'
            onClick={handleNext}
            disabled={!canGoNext}
            className='inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-primary shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50'
          >
            Next
            <ArrowRight className='h-4 w-4' />
          </button>
        </div>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {visibleCards.map((card) => (
          <RecommendationCard key={card.recommendationId} card={card} userId={apiResponse.userId} />
        ))}
      </div>
    </div>
  );
}

type RecommendationCardProps = {
  card: RecommendationCard;
  userId: string;
  readOnly?: boolean;
};

const FALLBACK_RECIPE_IMAGE = "/recipe-placeholder.svg";

export function RecommendationCard({ card, userId, readOnly }: RecommendationCardProps) {
  const pantry = card.pantry ?? {
    status: "IN_STOCK" as keyof typeof statusCopy,
    cookableServings: 2,
    missingIngredients: [],
    lowStockIngredients: [],
    operatorStatus: "IN_STOCK" as keyof typeof statusCopy,
    operatorMissingIngredients: [],
    operatorLowStockIngredients: [],
  };
  const personalStatus = pantry.status as keyof typeof statusCopy;
  const operatorStatus = (pantry.operatorStatus as keyof typeof statusCopy) ?? "IN_STOCK";
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
  const detailHref =
    !readOnly && userId
      ? `/recipes/${card.slug}?${new URLSearchParams({
          recommendationId: card.recommendationId,
          userId,
        }).toString()}`
      : `/recipes/${card.slug}`;
  const macroBadges = [
    card.calories !== null ? `${card.calories} kcal` : null,
    typeof card.proteinGrams === "number" ? `${card.proteinGrams}g protein` : null,
    typeof card.carbsGrams === "number" ? `${card.carbsGrams}g carbs` : null,
    typeof card.fatGrams === "number" ? `${card.fatGrams}g fat` : null,
  ].filter((badge): badge is string => Boolean(badge));
  const adjustmentChips = card.metadata.adjustments.slice(0, 3);
  const highlightChips = card.healthyHighlights.slice(0, 3);
  const tagChips = card.tags.slice(0, 4);

  const handleImageError = () => {
    if (!normalizedImageUrl) {
      return;
    }

    setFailedImages((prev) => {
      if (prev.has(normalizedImageUrl)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(normalizedImageUrl);
      return next;
    });
  };

  return (
    <article className='group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-md'>
      <div className='flex h-full flex-col gap-4 p-5 pb-6'>
        <div className='flex items-start justify-between gap-3'>
          <div className='space-y-1'>
            <p className='text-[10px] font-bold uppercase tracking-wider text-primary'>
              #{card.recipeId.slice(-4)}
            </p>
            <h4 className='text-lg font-semibold leading-snug text-foreground'>{card.title}</h4>
          </div>
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
              statusTheme.badge
            )}
          >
            {badgeLabel}
          </span>
        </div>

        <Link
          href={detailHref}
          prefetch={false}
          className='relative block overflow-hidden rounded-lg border border-border-subtle bg-surface-subtle'
          aria-label={`Open ${card.title} recipe detail`}
        >
          <Image
            src={recipeImage}
            alt={card.title}
            width={400}
            height={200}
            sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
            className='h-44 w-full object-cover transition duration-300 group-hover:scale-[1.03]'
            onError={handleImageError}
            unoptimized
          />
        </Link>

        {macroBadges.length ? (
          <div className='flex flex-wrap gap-2 text-[11px] font-semibold text-primary'>
            {macroBadges.map((badge) => (
              <span
                key={`${card.recommendationId}-${badge}`}
                className='inline-flex items-center gap-1 rounded-full border border-border-subtle bg-surface-subtle px-2.5 py-1'
              >
                {badge}
              </span>
            ))}
          </div>
        ) : null}

        <div className='space-y-3 text-sm text-muted-foreground'>
          {card.macrosLabel ? (
            <p className='text-[10px] font-bold uppercase tracking-wider text-primary'>{card.macrosLabel}</p>
          ) : null}
          <p className='text-[13px] leading-relaxed'>{card.rationale}</p>
        </div>

        {adjustmentChips.length ? (
          <div className='flex flex-wrap gap-2 text-[11px] text-muted-foreground'>
            {adjustmentChips.map((adjustment, index) => (
              <span
                key={`${card.recommendationId}-adjustment-${index}`}
                className='inline-flex items-center gap-1 rounded-full border border-border-subtle bg-surface-subtle px-2.5 py-1 font-medium'
              >
                {adjustment.reason}
                <span className='ml-1 font-semibold text-foreground'>
                  {adjustment.delta > 0 ? `+${adjustment.delta}` : adjustment.delta}
                </span>
              </span>
            ))}
          </div>
        ) : null}

        {highlightChips.length ? (
          <div className='flex flex-wrap gap-2 text-[11px] text-primary'>
            {highlightChips.map((highlight) => (
              <span
                key={`${card.recommendationId}-highlight-${highlight}`}
                className='inline-flex items-center rounded-full border border-border-subtle bg-surface-subtle px-2.5 py-1 font-semibold'
              >
                {highlight}
              </span>
            ))}
          </div>
        ) : null}

        {tagChips.length ? (
          <div className='flex flex-wrap gap-2 text-[11px] text-muted-foreground'>
            {tagChips.map((tag) => (
              <span
                key={`${card.recommendationId}-tag-${tag}`}
                className='inline-flex items-center rounded-full border border-border-subtle bg-surface-subtle px-2.5 py-1 font-semibold'
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        {card.allergens.length ? (
          <div className='flex flex-wrap items-center gap-2 text-[11px] text-destructive'>
            <span className='font-bold uppercase tracking-wider'>Allergens</span>
            {card.allergens.map((allergen) => (
              <span
                key={`${card.recommendationId}-allergen-${allergen}`}
                className='rounded-full border border-destructive/20 bg-destructive/10 px-2 py-0.5'
              >
                {allergen}
              </span>
            ))}
          </div>
        ) : null}

        <div className='rounded-xl border border-border bg-surface-subtle p-4 text-sm text-muted-foreground'>
          <p className='text-[10px] font-bold uppercase tracking-wider text-primary'>Pantry readiness</p>
          {operatorStatus === "OUT_OF_STOCK" ? (
            <p className='mt-2 text-destructive'>
              Kitchen shortfall:{" "}
              {pantry.operatorMissingIngredients.map((gap) => gap.ingredient).join(", ") || "core ingredients"}
            </p>
          ) : operatorStatus === "LOW_STOCK" ? (
            <p className='mt-2 text-warning'>
              Kitchen low on{" "}
              {pantry.operatorLowStockIngredients
                .map((gap) => gap.ingredient)
                .slice(0, 2)
                .join(", ")}
              .
            </p>
          ) : null}
          {pantry.status === "OUT_OF_STOCK" || pantry.cookableServings <= 0 ? (
            <p className='mt-2 text-destructive'>
              Missing:{" "}
              {pantry.missingIngredients.length
                ? pantry.missingIngredients.map((gap) => gap.ingredient).join(", ")
                : "core ingredients"}
            </p>
          ) : (
            <p className='mt-2 text-success'>
              Enough for {pantry.cookableServings} serving{pantry.cookableServings === 1 ? "" : "s"} with your pantry.
            </p>
          )}
          {pantry.lowStockIngredients.length ? (
            <p className='mt-1 text-xs text-warning'>
              Low stock:{" "}
              {pantry.lowStockIngredients
                .map((gap) => gap.ingredient)
                .slice(0, 2)
                .join(", ")}
            </p>
          ) : null}
        </div>

        {!readOnly ? (
          <div className='mt-auto space-y-3 border-t border-border pt-4'>
            <FeedbackActions recommendationId={card.recommendationId} userId={userId} layout='inline' />
          </div>
        ) : null}
      </div>
    </article>
  );
}

function RecommendationsSkeleton() {
  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className='flex h-full animate-pulse flex-col rounded-xl border border-border bg-card p-5 shadow-sm'
        >
          <div className='flex items-start justify-between gap-3'>
            <div className='space-y-2'>
              <div className='h-3 w-16 rounded-full bg-surface-subtle' />
              <div className='h-4 w-32 rounded-full bg-surface-subtle' />
            </div>
            <div className='h-6 w-20 rounded-full bg-surface-subtle' />
          </div>
          <div className='mt-3 h-40 rounded-lg bg-surface-subtle' />
          <div className='mt-3 flex flex-wrap gap-2'>
            <div className='h-6 w-20 rounded-full bg-surface-subtle' />
            <div className='h-6 w-24 rounded-full bg-surface-subtle' />
            <div className='h-6 w-24 rounded-full bg-surface-subtle' />
          </div>
          <div className='mt-3 space-y-2'>
            <div className='h-3 w-1/2 rounded-full bg-surface-subtle' />
            <div className='h-3 w-full rounded-full bg-surface-subtle' />
            <div className='h-3 w-5/6 rounded-full bg-surface-subtle' />
          </div>
          <div className='mt-auto flex flex-col gap-2 border-t border-border pt-4'>
            <div className='h-10 w-full rounded-full bg-surface-subtle' />
            <div className='h-10 w-full rounded-full bg-surface-subtle' />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyRecommendations() {
  return (
    <div className='rounded-xl border border-dashed border-border bg-surface p-6 text-sm text-muted-foreground'>
      <p className='font-semibold text-foreground'>Ready when you are.</p>
      <p className='mt-1'>
        Complete onboarding, then drop the same email above to preview your personalized menu cards.
      </p>
    </div>
  );
}

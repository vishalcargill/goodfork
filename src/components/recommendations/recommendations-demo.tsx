"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Bookmark,
  CheckCircle2,
  Loader2,
  Repeat2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useFeedbackMutation } from "@/services/client/feedback.client";
import { useRecommendationsMutation } from "@/services/client/recommendations.client";
import type { FeedbackEventPayload } from "@/schema/feedback.schema";
import type {
  RecommendationCard,
  RecommendationResponse,
} from "@/services/shared/recommendations.types";

type RecommendationsDemoProps = {
  prefillEmail?: string;
};

const statusCopy = {
  IN_STOCK: {
    label: "Ready now",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  LOW_STOCK: {
    label: "Low stock",
    badge: "bg-amber-100 text-amber-900 border-amber-200",
  },
  OUT_OF_STOCK: {
    label: "Out of stock",
    badge: "bg-rose-100 text-rose-800 border-rose-200",
  },
} as const;

export function RecommendationsDemo({ prefillEmail }: RecommendationsDemoProps) {
  const [email, setEmail] = useState(() => prefillEmail ?? "");
  const [localError, setLocalError] = useState<string | null>(null);
  const recommendationsMutation = useRecommendationsMutation();
  const prefetchedEmailRef = useRef<string | null>(null);

  const { isPending, data, reset, mutate } = recommendationsMutation;
  const successPayload = data && data.success ? data.data : null;

  useEffect(() => {
    if (prefillEmail && prefetchedEmailRef.current !== prefillEmail) {
      prefetchedEmailRef.current = prefillEmail;
      mutate({ email: prefillEmail });
    }
  }, [prefillEmail, mutate]);

  const handleFetch = () => {
    if (!email.trim()) {
      setLocalError("Enter the email used during onboarding.");
      return;
    }

    setLocalError(null);
    reset();
    mutate({ email: email.trim() });
  };

  const statusLabel = useMemo(() => {
    if (isPending) {
      return "Scoring menus…";
    }

    if (successPayload) {
      return successPayload.source === "llm" ? "LLM rerank applied" : "Deterministic fallback";
    }

    if (data && !data.success) {
      return "Unable to personalize yet";
    }

    return "Awaiting personalization";
  }, [data, isPending, successPayload]);

  return (
    <div className='space-y-6'>
      <div className='rounded-3xl border border-emerald-100 bg-emerald-50/40 p-6 shadow-inner'>
        <div className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
          <div className='space-y-1'>
            <p className='text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700'>
              Personalized preview
            </p>
            <h3 className='text-xl font-semibold text-slate-900'>Fetch menus for your profile</h3>
            <p className='text-sm text-slate-600'>
              After onboarding, drop the same email here to view 3–5 cards grounded in your saved
              goals, allergens, and inventory.
            </p>
          </div>
          <div className='flex flex-col gap-2 md:flex-row md:items-center'>
            <label className='flex-1 text-xs font-semibold text-slate-500'>
              Onboarding email
              <input
                type='email'
                value={email}
                placeholder='you@goodfork.com'
                onChange={(event) => setEmail(event.target.value)}
                className='mt-2 w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:shadow-[0_12px_30px_rgba(16,185,129,0.12)]'
              />
            </label>
            <button
              type='button'
              onClick={handleFetch}
              disabled={isPending}
              className='inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(16,185,129,0.25)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {isPending ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Fetching
                </>
              ) : (
                <>
                  <Sparkles className='h-4 w-4' />
                  Personalize
                </>
              )}
            </button>
          </div>
        </div>
        <div className='mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-emerald-700'>
          <span
            className='inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-4 py-1'
            role='status'
            aria-live='polite'
          >
            <ShieldCheck className='h-3.5 w-3.5 text-emerald-500' />
            {statusLabel}
          </span>
          {localError ? (
            <span
              className='inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-1 text-rose-700'
              role='alert'
              aria-live='assertive'
            >
              <AlertCircle className='h-3.5 w-3.5' />
              {localError}
            </span>
          ) : null}
          {data && !data.success ? (
            <span
              className='inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1 text-amber-800'
              role='alert'
              aria-live='assertive'
            >
              <AlertCircle className='h-3.5 w-3.5' />
              {data.message}
            </span>
          ) : null}
        </div>
      </div>

      {isPending ? (
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
  if (!apiResponse.recommendations.length) {
    return <EmptyRecommendations />;
  }

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap items-center justify-between gap-3 text-xs'>
        <p className='font-semibold uppercase tracking-[0.18em] text-emerald-700'>
          {apiResponse.delivered} menu cards ·{" "}
          {apiResponse.source === "llm" ? "AI ranked" : "Deterministic fallback"}
        </p>
        <span className='rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white'>
          Session ready
        </span>
      </div>
      <div className='grid gap-4 md:grid-cols-3'>
        {apiResponse.recommendations.map((card) => (
          <RecommendationCard key={card.recommendationId} card={card} userId={apiResponse.userId} />
        ))}
      </div>
    </div>
  );
}

type FeedbackAction = FeedbackEventPayload["action"];

type RecommendationCardProps = {
  card: RecommendationCard;
  userId: string;
  readOnly?: boolean;
};

export function RecommendationCard({ card, userId, readOnly = false }: RecommendationCardProps) {
  const statusTheme = statusCopy[card.inventory.status];
  const feedbackMutation = useFeedbackMutation();
  const [lastAction, setLastAction] = useState<FeedbackAction | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<FeedbackAction | null>(null);
  const actionOrder: FeedbackAction[] = ["ACCEPT", "SAVE", "SWAP"];
  const swapDescription = card.swapRecipe
    ? `Swap for ${card.swapRecipe.title}`
    : "Request a lighter pick";

  const actionConfigs: Record<
    FeedbackAction,
    { label: string; description: string; className: string; icon: JSX.Element }
  > = {
    ACCEPT: {
      label: "Accept",
      description: "Add to today's plate",
      className: "border-emerald-200 bg-emerald-50 text-emerald-900",
      icon: <CheckCircle2 className='h-4 w-4 text-emerald-600' />,
    },
    SAVE: {
      label: "Save",
      description: "Shortlist to revisit later",
      className: "border-slate-200 bg-white text-slate-900",
      icon: <Bookmark className='h-4 w-4 text-slate-500' />,
    },
    SWAP: {
      label: "Request swap",
      description: swapDescription,
      className: "border-amber-200 bg-amber-50 text-amber-900",
      icon: <Repeat2 className='h-4 w-4 text-amber-600' />,
    },
  };

  const successCopy: Record<FeedbackAction, string> = {
    ACCEPT: "Locked in — we'll prioritize this in your next visit.",
    SAVE: "Saved to your shortlist. We'll nudge you when inventory changes.",
    SWAP: "Swap request logged. Expect lighter picks next time.",
  };

  const isPending = feedbackMutation.isPending;
  const actionsDisabled = readOnly || isPending;

  function handleAction(action: FeedbackAction, note?: string | null) {
    if (actionsDisabled) {
      return;
    }

    setErrorMessage(null);
    setPendingAction(action);

    const trimmedNote = note && note.trim().length >= 2 ? note.trim() : undefined;

    feedbackMutation.mutate(
      {
        recommendationId: card.recommendationId,
        userId,
        action,
        ...(trimmedNote ? { notes: trimmedNote } : {}),
      },
      {
        onSuccess: () => {
          setLastAction(action);
        },
        onError: (error) => {
          setErrorMessage(error.message || "Unable to capture that signal. Try again.");
        },
        onSettled: () => {
          setPendingAction(null);
        },
      }
    );
  }

  return (
    <article className='group flex h-full flex-col justify-between rounded-3xl border border-emerald-100 bg-white p-5 shadow-[0_14px_36px_rgba(16,185,129,0.18)] transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[0_20px_56px_rgba(16,185,129,0.25)]'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.14em] text-slate-500'>#{card.recipeId.slice(-4)}</p>
          <h4 className='text-lg font-semibold text-slate-900'>{card.title}</h4>
          <p className='text-sm text-emerald-700'>{card.priceDisplay}</p>
        </div>
        <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", statusTheme.badge)}>
          {statusTheme.label}
        </span>
      </div>

      <div className='mt-4 space-y-2 text-sm text-slate-700'>
        {card.calories ? <p>{card.calories} kcal</p> : null}
        {card.macrosLabel ? <p className='text-xs text-slate-500'>{card.macrosLabel}</p> : null}
        <p>{card.rationale}</p>
      </div>

      <div className='mt-4 space-y-4'>
        <div className='rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-xs text-slate-600'>
          <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500'>
            Personalization signals
          </p>
          <ul className='mt-2 space-y-1'>
            {card.metadata.adjustments.slice(0, 3).map((adjustment, index) => (
              <li key={`${card.recommendationId}-adj-${index}`} className='flex items-start gap-2'>
                <span className='mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500' />
                <span>
                  {adjustment.reason}
                  <span className='ml-1 font-semibold text-slate-900'>
                    {adjustment.delta > 0 ? `+${adjustment.delta}` : adjustment.delta}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {card.healthySwapCopy ? (
          <div className='rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-800'>
            <p className='text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600'>Healthy swap</p>
            <p>{card.healthySwapCopy}</p>
            {card.swapRecipe ? (
              <p className='mt-1 text-xs text-emerald-700'>
                Alt: <span className='font-semibold'>{card.swapRecipe.title}</span>
              </p>
            ) : null}
          </div>
        ) : null}

        <div className='flex flex-col gap-2 pt-1 text-sm sm:flex-row sm:flex-wrap' role='group' aria-label='Feedback actions'>
          {actionOrder.map((action) => {
            const config = actionConfigs[action];
            const note =
              action === "SWAP"
                ? card.swapRecipe?.title ?? card.healthySwapCopy ?? undefined
                : undefined;
            const descriptionId = `${card.recommendationId}-${action}-desc`;

            return (
              <button
                key={`${card.recommendationId}-${action}`}
                type='button'
                onClick={() => handleAction(action, note)}
                disabled={readOnly || isPending}
                aria-describedby={descriptionId}
                className={cn(
                  "flex w-full min-w-0 items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[150px] sm:flex-1",
                  config.className
                )}
              >
                {pendingAction === action && isPending ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  config.icon
                )}
                <div className='flex-1 text-xs font-normal leading-tight'>
                  <p className='text-sm font-semibold'>{config.label}</p>
                  <p id={descriptionId} className='text-[11px] text-slate-600'>
                    {config.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {lastAction ? (
          <div
            className='flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-2 text-sm text-emerald-800'
            role='status'
            aria-live='polite'
          >
            <CheckCircle2 className='h-4 w-4 text-emerald-600' />
            <span>{successCopy[lastAction]}</span>
          </div>
        ) : null}

        {errorMessage ? (
          <div
            className='flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700'
            role='alert'
            aria-live='assertive'
          >
            <AlertCircle className='h-4 w-4' />
            <span>{errorMessage}</span>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function RecommendationsSkeleton() {
  return (
    <div className='grid gap-4 md:grid-cols-3'>
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className='h-64 animate-pulse rounded-3xl border border-emerald-100 bg-white/70 p-5'
        >
          <div className='h-5 w-28 rounded-full bg-emerald-100' />
          <div className='mt-4 space-y-3'>
            <div className='h-4 w-2/3 rounded-full bg-emerald-50' />
            <div className='h-4 w-1/2 rounded-full bg-emerald-50' />
            <div className='h-3 w-1/3 rounded-full bg-emerald-50' />
          </div>
          <div className='mt-6 h-20 rounded-2xl bg-emerald-50/70' />
        </div>
      ))}
    </div>
  );
}

function EmptyRecommendations() {
  return (
    <div className='rounded-3xl border border-dashed border-emerald-200 bg-white p-6 text-sm text-slate-600'>
      <p className='font-semibold text-slate-800'>Ready when you are.</p>
      <p className='mt-1'>
        Complete onboarding, then drop the same email above to preview your personalized menu cards.
      </p>
    </div>
  );
}

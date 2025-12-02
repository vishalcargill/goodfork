"use client";

import { useState } from "react";

import { ArrowsLeftRight, CheckCircle } from "@phosphor-icons/react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useFeedbackMutation } from "@/services/client/feedback.client";
import type { FeedbackEventPayload } from "@/schema/feedback.schema";

type FeedbackActionsProps = {
  recommendationId?: string;
  userId?: string;
  layout?: "stacked" | "inline";
  className?: string;
  disabledHint?: string;
};

export function FeedbackActions({
  recommendationId,
  userId,
  layout = "stacked",
  className,
  disabledHint,
}: FeedbackActionsProps) {
  const feedbackMutation = useFeedbackMutation();
  const [pendingAction, setPendingAction] = useState<FeedbackEventPayload["action"] | null>(null);

  const canSubmit = Boolean(recommendationId && userId);

  const handleAction = async (action: FeedbackEventPayload["action"]) => {
    if (!canSubmit) {
      toast.error("Missing context to log feedback", {
        description: disabledHint ?? "Open this recipe from your recommendation list to track actions.",
      });
      return;
    }

    try {
      setPendingAction(action);
      const response = await feedbackMutation.mutateAsync({
        recommendationId: recommendationId as string,
        userId: userId as string,
        action,
        sentiment: action === "ACCEPT" ? "POSITIVE" : "NEUTRAL",
      });

      if (!response.success) {
        throw new Error(response.message);
      }

      toast.success(action === "ACCEPT" ? "Accepted" : "Swap requested", {
        description: "We saved this choice to your profile and will tune future menus.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save feedback right now.";
      toast.error("Feedback not captured", { description: message });
    } finally {
      setPendingAction(null);
    }
  };

  const baseButton =
    "inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60";
  const isAccepting = pendingAction === "ACCEPT";
  const isSwapping = pendingAction === "SWAP";

  return (
    <div
      className={cn(
        "flex w-full gap-2",
        layout === "inline" ? "flex-col sm:flex-row sm:items-center sm:justify-end" : "flex-col",
        className
      )}
    >
      <button
        type='button'
        disabled={!canSubmit || pendingAction !== null}
        onClick={() => handleAction("ACCEPT")}
        className={cn(
          baseButton,
          "border-emerald-500 bg-emerald-600 text-white shadow-[0_10px_30px_rgba(16,185,129,0.25)] hover:-translate-y-0.5 hover:shadow-[0_16px_44px_rgba(16,185,129,0.35)]"
        )}
        aria-label='Accept this recipe'
      >
        <CheckCircle className='h-4 w-4' weight='fill' />
        {isAccepting ? "Logging..." : "Accept"}
      </button>

      <button
        type='button'
        disabled={!canSubmit || pendingAction !== null}
        onClick={() => handleAction("SWAP")}
        className={cn(
          baseButton,
          "border-emerald-200 bg-white text-emerald-800 shadow-[0_8px_24px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
        )}
        aria-label='Request a swap'
      >
        <ArrowsLeftRight className='h-4 w-4' weight='bold' />
        {isSwapping ? "Requesting..." : "Swap"}
      </button>
    </div>
  );
}

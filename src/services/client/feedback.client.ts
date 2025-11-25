"use client";

import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { apiClient } from "@/config/axios.config";
import type { FeedbackEventPayload } from "@/schema/feedback.schema";

export type FeedbackApiResponse =
  | {
      success: true;
      message: string;
      data: {
        id: string;
        action: FeedbackEventPayload["action"];
        sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
        createdAt: string;
      };
    }
  | {
      success: false;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

async function submitFeedback(payload: FeedbackEventPayload): Promise<FeedbackApiResponse> {
  try {
    const { data } = await apiClient.post<FeedbackApiResponse>("/feedback", payload);
    return data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    const fallback = "Unable to capture feedback right now. Try again.";
    const message = err.response?.data?.message ?? err.message ?? fallback;
    throw new Error(message);
  }
}

export function useFeedbackMutation(): UseMutationResult<
  FeedbackApiResponse,
  Error,
  FeedbackEventPayload
> {
  return useMutation({
    mutationFn: submitFeedback,
  });
}

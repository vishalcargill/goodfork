"use client";

import axios from "axios";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";

import { apiClient } from "@/config/axios.config";
import type { RecommendationRequestPayload } from "@/schema/recommendations.schema";
import type { RecommendationResponse } from "@/services/shared/recommendations.types";

export type RecommendationsApiResponse =
  | {
      success: true;
      message: string;
      data: RecommendationResponse;
    }
  | {
      success: false;
      message: string;
      errorCode?: string;
      fieldErrors?: Record<string, string[]>;
    };

async function requestRecommendations(
  payload: RecommendationRequestPayload
): Promise<RecommendationsApiResponse> {
  try {
    const { data } = await apiClient.post<RecommendationsApiResponse>("/recommendations", payload);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      return error.response.data as RecommendationsApiResponse;
    }

    throw new Error(
      error instanceof Error ? error.message : "Unable to load recommendations. Try again."
    );
  }
}

export function useRecommendationsMutation(): UseMutationResult<
  RecommendationsApiResponse,
  Error,
  RecommendationRequestPayload
> {
  return useMutation({
    mutationFn: requestRecommendations,
  });
}

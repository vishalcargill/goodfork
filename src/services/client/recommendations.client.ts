"use client";

import axios from "axios";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";

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

async function requestRecommendations(payload: RecommendationRequestPayload): Promise<RecommendationsApiResponse> {
  try {
    const { data } = await apiClient.post<RecommendationsApiResponse>("/recommendations", payload);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      return error.response.data as RecommendationsApiResponse;
    }

    throw new Error(error instanceof Error ? error.message : "Unable to load recommendations. Try again.");
  }
}

export function useRecommendationsQuery(
  payload: RecommendationRequestPayload | null
): UseQueryResult<RecommendationsApiResponse, Error> {
  const hasIdentifier = Boolean(payload && (payload.email || payload.userId));

  return useQuery({
    queryKey: [
      "recommendations",
      payload?.email,
      payload?.userId,
      payload?.source,
      payload?.limit,
      payload?.sessionId,
      payload?.deterministicOnly,
    ],
    queryFn: () => requestRecommendations(payload as RecommendationRequestPayload),
    enabled: hasIdentifier,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

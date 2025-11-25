"use client";

import { useMutation, type UseMutationResult } from "@tanstack/react-query";

import type { OnboardingPayload } from "@/schema/onboarding.schema";
import { apiClient } from "@/config/axios.config";

export type OnboardingResult = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
  userId?: string;
  profileId?: string;
};

async function submitOnboarding(payload: OnboardingPayload): Promise<OnboardingResult> {
  const { data } = await apiClient.post<OnboardingResult>("/onboarding", payload);
  return data;
}

export function useOnboardingSubmitMutation(): UseMutationResult<OnboardingResult, Error, OnboardingPayload> {
  return useMutation({
    mutationFn: submitOnboarding,
  });
}

"use client";

import { useMutation, useQuery, type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { apiClient } from "@/config/axios.config";
import type { ProfileSettingsPayload } from "@/schema/profile-settings.schema";
import type { UserProfile } from "@/generated/prisma/client";

export type ProfileApiSuccessResponse = {
  success: true;
  message?: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  profile: UserProfile | null;
};

export type ProfileApiErrorResponse = {
  success: false;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type ProfileApiResponse = ProfileApiSuccessResponse | ProfileApiErrorResponse;

async function fetchProfileSettings(): Promise<ProfileApiResponse> {
  try {
    const { data } = await apiClient.get<ProfileApiResponse>("/profile");
    return data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message ?? err.message ?? "Unable to load profile right now.");
  }
}

async function submitProfileSettings(payload: ProfileSettingsPayload): Promise<ProfileApiResponse> {
  try {
    const { data } = await apiClient.put<ProfileApiResponse>("/profile", payload);
    return data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string; fieldErrors?: Record<string, string[]> }>;
    const message = err.response?.data?.message ?? err.message ?? "Unable to update profile right now.";
    const fieldErrors = err.response?.data?.fieldErrors;
    const errorToThrow = new Error(message) as Error & { fieldErrors?: Record<string, string[]> };
    if (fieldErrors) {
      errorToThrow.fieldErrors = fieldErrors;
    }
    throw errorToThrow;
  }
}

export function useProfileQuery(): UseQueryResult<ProfileApiResponse, Error> {
  return useQuery({ queryKey: ["profile"], queryFn: fetchProfileSettings });
}

export function useProfileSettingsMutation(): UseMutationResult<ProfileApiResponse, Error, ProfileSettingsPayload> {
  return useMutation({ mutationFn: submitProfileSettings });
}

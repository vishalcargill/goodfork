"use client";

import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { apiClient } from "@/config/axios.config";
import type { LoginPayload } from "@/schema/login.schema";

export type LoginApiResponse =
  | {
      success: true;
      message: string;
      user: {
        id: string;
        name: string;
        email: string;
      };
    }
  | {
      success: false;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

async function submitLogin(payload: LoginPayload): Promise<LoginApiResponse> {
  try {
    const { data } = await apiClient.post<LoginApiResponse>("/login", payload);
    return data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message ?? err.message ?? "Unable to login right now.");
  }
}

export function useLoginMutation(): UseMutationResult<LoginApiResponse, Error, LoginPayload> {
  return useMutation({
    mutationFn: submitLogin,
  });
}

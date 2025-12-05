import { DEFAULT_RECOMMENDATION_DATA_SOURCE } from "@/constants/data-sources";
import { SUPABASE_MCP_API_KEY, SUPABASE_MCP_URL } from "@/constants/app.constants";
import type { RecommendationResponse } from "@/services/shared/recommendations.types";
import type { GenerateRecommendationsInput } from "./recommendations.server";

type SupabaseMcpResponse =
  | { success: true; data: RecommendationResponse }
  | { success: false; message?: string; errorCode?: string };

export async function generateRecommendationsViaSupabaseMcp(
  input: GenerateRecommendationsInput
): Promise<RecommendationResponse | null> {
  if (!SUPABASE_MCP_URL) {
    return null;
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (SUPABASE_MCP_API_KEY) {
    headers.Authorization = `Bearer ${SUPABASE_MCP_API_KEY}`;
  }

  try {
    const response = await fetch(SUPABASE_MCP_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        ...input,
        source: DEFAULT_RECOMMENDATION_DATA_SOURCE,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn("[supabase-mcp] Non-200 response", response.status, errorText);
      return null;
    }

    const payload = (await response.json()) as SupabaseMcpResponse;
    if (payload && payload.success) {
      return payload.data;
    }

    console.warn("[supabase-mcp] Received unsuccessful payload", payload);
    return null;
  } catch (error) {
    console.warn("[supabase-mcp] Failed to fetch recommendations", error);
    return null;
  }
}

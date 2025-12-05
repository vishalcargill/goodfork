import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { trackTelemetry } from "@/lib/telemetry";
import { recommendationRequestSchema } from "@/schema/recommendations.schema";
import { generateRecommendations } from "@/services/server/recommendations.server";
import { generateRecommendationsViaSupabaseMcp } from "@/services/server/supabase-recommendations.server";
import { DEFAULT_RECOMMENDATION_DATA_SOURCE } from "@/constants/data-sources";

type RecommendationIdentifier = {
  userId?: string;
  email?: string;
};

export async function POST(request: Request) {
  const requestId = randomUUID();
  const requestedAt = performance.now();
  let identifier: RecommendationIdentifier = {};
  let sessionId: string | null = null;
  let requestedSource = DEFAULT_RECOMMENDATION_DATA_SOURCE;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    identifier = {
      userId: typeof body.userId === "string" ? body.userId : undefined,
      email: typeof body.email === "string" ? body.email : undefined,
    };
    sessionId = typeof body.sessionId === "string" ? body.sessionId : null;
    const parsed = recommendationRequestSchema.safeParse(body);

    if (!parsed.success) {
      trackTelemetry({
        type: "recommendation.failed",
        requestId,
        identifier,
        reason: "validation_error",
        dataSource: requestedSource,
      });

      return NextResponse.json({
        success: false,
        message: "Please review the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    }

    const { source, ...generateInput } = parsed.data;
    requestedSource = source ?? DEFAULT_RECOMMENDATION_DATA_SOURCE;

    trackTelemetry({
      type: "recommendation.requested",
      requestId,
      identifier,
      limit: parsed.data.limit,
      deterministicOnly: parsed.data.deterministicOnly,
      sessionId: parsed.data.sessionId ?? null,
      dataSource: requestedSource,
    });

    let data = null;

    if (requestedSource === "supabase") {
      data = await generateRecommendationsViaSupabaseMcp(generateInput);
    }

    if (!data) {
      data = await generateRecommendations(generateInput);
    }
    const latencyMs = Math.round(performance.now() - requestedAt);

    trackTelemetry({
      type: "recommendation.succeeded",
      requestId,
      userId: data.userId,
      requested: data.requested,
      delivered: data.delivered,
      source: data.source,
      deterministicFallback: data.source === "deterministic",
      latencyMs,
      sessionId: parsed.data.sessionId ?? null,
      dataSource: requestedSource,
    });

    return NextResponse.json({
      success: true,
      message: "Recommendations generated.",
      data,
    });
  } catch (error) {
    const latencyMs = Math.round(performance.now() - requestedAt);
    trackTelemetry({
      type: "recommendation.failed",
      requestId,
      identifier,
      reason: error instanceof Error ? error.message : "unknown_error",
      latencyMs,
      sessionId,
      dataSource: requestedSource,
    });

    console.error("Recommendations API error", error);

    const status =
      typeof error === "object" && error && "statusCode" in error
        ? Number((error as { statusCode?: number }).statusCode ?? 500)
        : 500;
    const clientMessage =
      typeof error === "object" && error && "clientMessage" in error
        ? String((error as { clientMessage?: string }).clientMessage ?? "")
        : "";
    const errorCode =
      typeof error === "object" && error && "errorCode" in error
        ? String((error as { errorCode?: string }).errorCode ?? "")
        : "";
    const responseMessage =
      clientMessage && clientMessage.trim().length > 0
        ? clientMessage
        : "Unable to generate recommendations right now. Try again shortly.";

    return NextResponse.json(
      {
        success: false,
        message: responseMessage,
        errorCode: errorCode || undefined,
      },
      { status }
    );
  }
}

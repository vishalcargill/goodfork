import type { RecommendationResponse } from "@/services/shared/recommendations.types";

type RecommendationSource = RecommendationResponse["source"];

type RecommendationIdentifier = {
  userId?: string;
  email?: string;
};

type RecommendationRequestedEvent = {
  type: "recommendation.requested";
  requestId: string;
  identifier: RecommendationIdentifier;
  limit?: number;
  deterministicOnly?: boolean;
  sessionId?: string | null;
};

type RecommendationSucceededEvent = {
  type: "recommendation.succeeded";
  requestId: string;
  userId: string;
  requested: number;
  delivered: number;
  source: RecommendationSource;
  deterministicFallback: boolean;
  latencyMs: number;
  sessionId?: string | null;
};

type RecommendationFailedEvent = {
  type: "recommendation.failed";
  requestId: string;
  identifier: RecommendationIdentifier;
  reason: string;
  latencyMs?: number;
  sessionId?: string | null;
};

export type TelemetryEvent =
  | RecommendationRequestedEvent
  | RecommendationSucceededEvent
  | RecommendationFailedEvent;

export function trackTelemetry(event: TelemetryEvent) {
  const payload = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === "test") {
    return;
  }

  console.log(`[telemetry] ${JSON.stringify(payload)}`);
}

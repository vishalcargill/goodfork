import {
  FeedbackAction,
  FeedbackSentiment,
  RecommendationStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { FeedbackEventPayload } from "@/schema/feedback.schema";

export async function logFeedbackEvent(payload: FeedbackEventPayload) {
  const recommendation = await prisma.recommendation.findUnique({
    where: { id: payload.recommendationId },
    select: { id: true, userId: true },
  });

  if (!recommendation || recommendation.userId !== payload.userId) {
    throw Object.assign(new Error("Recommendation not found for the provided user."), {
      statusCode: 404,
    });
  }

  const sentiment = payload.sentiment ?? deriveSentiment(payload.action);
  const notes = payload.notes?.trim();

  const feedback = await prisma.$transaction(async (tx) => {
    const created = await tx.feedback.create({
      data: {
        recommendationId: payload.recommendationId,
        userId: payload.userId,
        action: payload.action,
        sentiment,
        notes: notes && notes.length > 0 ? notes : null,
      },
    });

    await tx.recommendation.update({
      where: { id: payload.recommendationId },
      data: {
        status: mapActionToStatus(payload.action),
      },
    });

    return created;
  });

  return feedback;
}

function deriveSentiment(action: FeedbackAction): FeedbackSentiment {
  if (action === "ACCEPT") {
    return FeedbackSentiment.POSITIVE;
  }

  return FeedbackSentiment.NEUTRAL;
}

function mapActionToStatus(action: FeedbackAction): RecommendationStatus {
  switch (action) {
    case "ACCEPT":
      return RecommendationStatus.ACCEPTED;
    case "SAVE":
      return RecommendationStatus.SAVED;
    case "SWAP":
      return RecommendationStatus.SWAPPED;
    default:
      return RecommendationStatus.SHOWN;
  }
}

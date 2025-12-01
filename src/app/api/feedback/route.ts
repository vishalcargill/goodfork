import { NextResponse } from "next/server";

import { feedbackEventSchema } from "@/schema/feedback.schema";
import { logFeedbackEvent } from "@/services/server/feedback.server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = feedbackEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please review the highlighted fields.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const feedback = await logFeedbackEvent(parsed.data);

    return NextResponse.json({
      success: true,
      message: "Feedback captured.",
      data: {
        id: feedback.id,
        action: feedback.action,
        sentiment: feedback.sentiment,
        createdAt: feedback.createdAt,
      },
    });
  } catch (error) {
    console.error("Feedback API error", error);

    const status =
      typeof error === "object" && error && "statusCode" in error && typeof error.statusCode === "number"
        ? error.statusCode
        : 500;

    return NextResponse.json(
      {
        success: false,
        message:
          status === 404
            ? "Recommendation was not found for this user. Refresh and try once more."
            : "Unable to capture feedback right now. Try again shortly.",
      },
      { status }
    );
  }
}
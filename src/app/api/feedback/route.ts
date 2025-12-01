import { NextResponse } from "next/server";

import { feedbackEventSchema } from "@/schema/feedback.schema";
import { logFeedbackEvent } from "@/services/server/feedback.server";

export async function POST(request: Request) {
  return NextResponse.json(
    {
      success: false,
      message: "Database access is disabled in this deployment.",
    },
    { status: 501 }
  );
}

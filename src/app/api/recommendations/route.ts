import { NextResponse } from "next/server";

import { recommendationRequestSchema } from "@/schema/recommendations.schema";
import { generateRecommendations } from "@/services/server/recommendations.server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = recommendationRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        message: "Please review the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    }

    const data = await generateRecommendations(parsed.data);
    return NextResponse.json({
      success: true,
      message: "Recommendations generated.",
      data,
    });
  } catch (error) {
    console.error("Recommendations API error", error);
    return NextResponse.json(
      {
        success: false,
        message: "Unable to generate recommendations right now. Try again shortly.",
      },
      { status: 500 }
    );
  }
}

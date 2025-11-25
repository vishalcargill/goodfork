import { NextResponse } from "next/server";

import { onboardingSchema } from "@/schema/onboarding.schema";
import { saveOnboardingProfile } from "@/services/server/onboarding.server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = onboardingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please review the highlighted fields.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 200 }
      );
    }

    const { user, profile } = await saveOnboardingProfile(parsed.data);

    return NextResponse.json({
      success: true,
      message: "Profile saved — recommendations unlocked.",
      userId: user.id,
      profileId: profile.id,
    });
  } catch (error) {
    console.error("Onboarding API error", error);
    return NextResponse.json(
      {
        success: false,
        message: "Unable to save onboarding right now. Try again shortly.",
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

import { onboardingSchema } from "@/schema/onboarding.schema";
import { saveOnboardingProfile } from "@/services/server/onboarding.server";
import { ONBOARDING_PROFILE_COOKIE, SESSION_COOKIE_NAME, serializeOnboardingCookie } from "@/constants/cookies";
import { createSessionForUser, SESSION_TTL_SECONDS } from "@/services/server/auth.server";

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

    const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
    const ipAddress = forwardedFor.split(",")[0]?.trim() || null;
    const userAgent = request.headers.get("user-agent");

    const { user, profile } = await saveOnboardingProfile(parsed.data);
    const session = await createSessionForUser({
      userId: user.id,
      ipAddress,
      userAgent,
    });
    const response = NextResponse.json({
      success: true,
      message: "Profile saved — recommendations unlocked.",
      userId: user.id,
      profileId: profile.id,
    });

    response.cookies.set({
      name: ONBOARDING_PROFILE_COOKIE,
      value: serializeOnboardingCookie({
        id: user.id,
        name: user.name,
        email: user.email,
      }),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 14, // 14 days
    });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: session.tokenId,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });
    return response;
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

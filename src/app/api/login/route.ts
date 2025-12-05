import { NextResponse } from "next/server";

import { loginSchema } from "@/schema/login.schema";
import { authenticateUser, SESSION_TTL_SECONDS } from "@/services/server/auth.server";
import { ADMIN_EMAIL } from "@/constants/app.constants";
import { ONBOARDING_PROFILE_COOKIE, SESSION_COOKIE_NAME, serializeOnboardingCookie } from "@/constants/cookies";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

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

    const userAgent = request.headers.get("user-agent");
    const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
    const ipAddress = forwardedFor.split(",")[0]?.trim() || null;

    const { user, session } = await authenticateUser({
      ...parsed.data,
      userAgent,
      ipAddress,
    });

    const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL;

    const response = NextResponse.json({
      success: true,
      message: "Logged in successfully.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin,
      },
    });

    const cookieOptions = {
      httpOnly: true,
      path: "/",
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
    };

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: session.tokenId,
      ...cookieOptions,
      maxAge: SESSION_TTL_SECONDS,
    });

    response.cookies.set({
      name: ONBOARDING_PROFILE_COOKIE,
      value: serializeOnboardingCookie({
        id: user.id,
        name: user.name,
        email: user.email,
      }),
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 14,
    });

    return response;
  } catch (error) {
    console.error("Login API error", error);
    const status =
      typeof error === "object" && error && "statusCode" in error && typeof error.statusCode === "number"
        ? error.statusCode
        : 500;

    return NextResponse.json(
      {
        success: false,
        message: status === 401 ? "Invalid email or password." : "Unable to sign in right now. Try again shortly.",
      },
      { status }
    );
  }
}

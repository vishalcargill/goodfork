import { NextResponse } from "next/server";

import { loginSchema } from "@/schema/login.schema";
import { authenticateUser } from "@/services/server/auth.server";

const SESSION_COOKIE_NAME = "gf_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

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

    const response = NextResponse.json({
      success: true,
      message: "Logged in successfully.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: session.tokenId,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_TTL_SECONDS,
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

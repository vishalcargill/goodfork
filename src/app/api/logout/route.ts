import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { ONBOARDING_PROFILE_COOKIE, SESSION_COOKIE_NAME } from "@/constants/cookies";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;

    if (sessionToken) {
      await prisma.userSession.deleteMany({
        where: { tokenId: sessionToken },
      });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: "",
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
    });
    response.cookies.set({
      name: ONBOARDING_PROFILE_COOKIE,
      value: "",
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Logout API error", error);
    return NextResponse.json(
      {
        success: false,
        message: "Unable to log out right now. Try again shortly.",
      },
      { status: 500 },
    );
  }
}

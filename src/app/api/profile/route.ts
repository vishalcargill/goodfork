import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileSettingsSchema } from "@/schema/profile-settings.schema";

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    profile,
  });
}

export async function PUT(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = profileSettingsSchema.safeParse(body);

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

    const { dietaryGoals, allergens, password } = parsed.data;
    const existingProfile = await prisma.userProfile.findUnique({ where: { userId: user.id } });

    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        dietaryGoals,
        allergens,
      },
      create: {
        userId: user.id,
        dietaryGoals,
        allergens,
        dietaryPreferences: existingProfile?.dietaryPreferences ?? [],
        tastePreferences: existingProfile?.tastePreferences ?? [],
        lifestyleNotes: existingProfile?.lifestyleNotes ?? null,
      },
    });

    if (password) {
      const passwordHash = await bcrypt.hash(password, 11);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Personalization updated.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      profile,
    });
  } catch (error) {
    console.error("Profile update error", error);
    return NextResponse.json(
      {
        success: false,
        message: "Unable to update profile right now. Try again shortly.",
      },
      { status: 500 }
    );
  }
}

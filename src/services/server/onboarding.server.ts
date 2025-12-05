import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import type { OnboardingPayload } from "@/schema/onboarding.schema";

type PersistedProfileInput = {
  name: string;
  email: string;
  passwordHash: string;
  dietaryGoals: string[];
  allergens: string[];
  dietaryPreferences: string[];
  tastePreferences: string[];
  lifestyleNotes: string | null;
};

export async function upsertUserWithProfile(input: PersistedProfileInput) {
  const normalizedEmail = input.email.toLowerCase();

  const user = await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {
      name: input.name,
      passwordHash: input.passwordHash,
    },
    create: {
      name: input.name,
      email: normalizedEmail,
      passwordHash: input.passwordHash,
    },
  });

  const profile = await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: {
      dietaryGoals: input.dietaryGoals,
      allergens: input.allergens,
      dietaryPreferences: input.dietaryPreferences,
      tastePreferences: input.tastePreferences,
      lifestyleNotes: input.lifestyleNotes,
    },
    create: {
      userId: user.id,
      dietaryGoals: input.dietaryGoals,
      allergens: input.allergens,
      dietaryPreferences: input.dietaryPreferences,
      tastePreferences: input.tastePreferences,
      lifestyleNotes: input.lifestyleNotes,
    },
  });

  return { user, profile };
}

export async function saveOnboardingProfile(payload: OnboardingPayload) {
  const passwordHash = await bcrypt.hash(payload.password, 11);

  return upsertUserWithProfile({
    name: payload.name,
    email: payload.email,
    passwordHash,
    dietaryGoals: payload.dietaryGoals,
    allergens: payload.allergens,
    dietaryPreferences: payload.dietaryPreferences,
    tastePreferences: payload.tastePreferences,
    lifestyleNotes: payload.lifestyleNotes ?? null,
  });
}

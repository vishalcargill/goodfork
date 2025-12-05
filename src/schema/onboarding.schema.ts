import { z } from "zod";

export const onboardingSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(64, "Password must be 64 characters or fewer"),
  dietaryGoals: z.array(z.string()).min(1, "Select at least one goal"),
  allergens: z.array(z.string()).default([]),
  dietaryPreferences: z.array(z.string()).default([]),
  tastePreferences: z.array(z.string()).default([]),
  lifestyleNotes: z
    .string()
    .trim()
    .max(280, "Notes must be under 280 characters")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
});

export type OnboardingPayload = z.infer<typeof onboardingSchema>;

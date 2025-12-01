import { z } from "zod";

export const profileSettingsSchema = z
  .object({
    dietaryGoals: z.array(z.string()).min(1, "Select at least one goal"),
    allergens: z.array(z.string()).default([]),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(64, "Password must be 64 characters or fewer")
      .optional()
      .or(z.literal(""))
      .transform((value) => (value && value.length > 0 ? value : undefined)),
    confirmPassword: z
      .string()
      .optional()
      .or(z.literal(""))
      .transform((value) => (value && value.length > 0 ? value : undefined)),
  })
  .refine(
    (data) => {
      if (!data.password && !data.confirmPassword) {
        return true;
      }
      return data.password === data.confirmPassword;
    },
    {
      message: "Passwords must match",
      path: ["confirmPassword"],
    }
  );

export type ProfileSettingsPayload = z.infer<typeof profileSettingsSchema>;

import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Passwords must be at least 8 characters."),
});

export type LoginPayload = z.infer<typeof loginSchema>;

import { z } from "zod";

import { RECOMMENDATION_DATA_SOURCES } from "@/constants/data-sources";

export const recommendationRequestSchema = z
  .object({
    userId: z.string().cuid("Provide a valid user id.").optional(),
    email: z.string().email("Enter a valid email.").optional(),
    limit: z.number().int().min(3).max(5).optional(),
    sessionId: z.string().trim().min(2).max(64).optional(),
    deterministicOnly: z.boolean().optional(),
    source: z.enum(RECOMMENDATION_DATA_SOURCES).optional(),
  })
  .refine((value) => Boolean(value.userId || value.email), {
    message: "Provide a user id or email.",
    path: ["userId"],
  });

export type RecommendationRequestPayload = z.infer<typeof recommendationRequestSchema>;

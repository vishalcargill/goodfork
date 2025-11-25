import { z } from "zod";

export const feedbackActionSchema = z.enum(["ACCEPT", "SAVE", "SWAP"]);
export const feedbackSentimentSchema = z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]);

export const feedbackEventSchema = z.object({
  recommendationId: z.string().cuid("Provide a valid recommendation id."),
  userId: z.string().cuid("Provide a valid user id."),
  action: feedbackActionSchema,
  sentiment: feedbackSentimentSchema.optional(),
  notes: z
    .string()
    .trim()
    .min(2, "Add at least 2 characters.")
    .max(280, "Keep feedback under 280 characters.")
    .optional(),
});

export type FeedbackEventPayload = z.infer<typeof feedbackEventSchema>;

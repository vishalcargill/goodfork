import { z } from "zod";

import type { Prisma } from "@/generated/prisma/client";
import { InventoryStatus } from "@/generated/prisma/client";

const stringArrayField = z.array(z.string().min(1)).default([]);
const optionalString = z.string().trim().min(1).optional().nullable();
const jsonValueSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.array(jsonValueSchema), z.record(z.string(), jsonValueSchema)])
);
const optionalJsonField = jsonValueSchema.nullable().optional();

export const adminRecipeSchema = z.object({
  slug: z.string().trim().min(2),
  sourceId: optionalString,
  sourceUrl: z.string().trim().optional().nullable(),
  author: z.string().trim().optional().nullable(),
  title: z.string().trim().min(2),
  description: z.string().trim().optional().nullable(),
  cuisine: z.string().trim().optional().nullable(),
  calories: z.number().int().nullable(),
  proteinGrams: z.number().int().nullable(),
  carbsGrams: z.number().int().nullable(),
  fatGrams: z.number().int().nullable(),
  priceCents: z.number().int().min(0),
  tags: stringArrayField,
  allergens: stringArrayField,
  healthyHighlights: stringArrayField,
  ingredients: stringArrayField,
  instructions: stringArrayField,
  imageUrl: z.string().trim().optional().nullable(),
  serves: z.number().int().nullable(),
  difficulty: z.string().trim().optional().nullable(),
  prepTimeMinutes: z.number().int().nullable(),
  cookTimeMinutes: z.number().int().nullable(),
  averageRating: z.number().nullable(),
  ratingCount: z.number().int().nullable(),
  dishType: z.string().trim().optional().nullable(),
  mainCategory: z.string().trim().optional().nullable(),
  subCategory: z.string().trim().optional().nullable(),
  nutrients: optionalJsonField,
  timers: optionalJsonField,
  inventory: z.object({
    quantity: z.number().int().min(0),
    unitLabel: z.string().trim().min(1),
    status: z.nativeEnum(InventoryStatus),
    restockDate: z.string().trim().optional().nullable(),
  }),
});

export type AdminRecipeInput = z.infer<typeof adminRecipeSchema>;

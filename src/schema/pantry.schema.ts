import { z } from "zod";

import { InventoryStatus } from "@/generated/prisma/client";

export const pantryUpdateSchema = z.object({
  items: z
    .array(
      z.object({
        ingredientSlug: z.string().min(1, "Ingredient slug required"),
        quantity: z.number().min(0, "Quantity cannot be negative"),
        unitLabel: z.string().min(1, "Unit label required"),
        status: z.nativeEnum(InventoryStatus),
        expiresOn: z.string().datetime().nullable().optional(),
      })
    )
    .min(1),
});

export const pantryRestockSchema = z.object({
  items: z
    .array(
      z.object({
        ingredientSlug: z.string().min(1),
        amount: z.number().positive("Amount must be greater than zero"),
      })
    )
    .min(1),
});

export const pantryConsumeSchema = pantryRestockSchema;

export type PantryUpdateInput = z.infer<typeof pantryUpdateSchema>;
export type PantryAdjustInput = z.infer<typeof pantryRestockSchema>;

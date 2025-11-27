import { z } from "zod";

import { InventoryStatus } from "@/generated/prisma/client";

const optionalString = z.string().trim().min(1).optional().nullable();

export const adminInventoryFiltersSchema = z.object({
  status: z.nativeEnum(InventoryStatus).optional(),
});

const adminInventoryItemSchema = z.object({
  recipeId: z.string().min(1),
  quantity: z.number().int().min(0),
  unitLabel: z.string().trim().min(1),
  status: z.nativeEnum(InventoryStatus),
  restockDate: optionalString,
});

export const adminInventoryBulkSchema = z.object({
  items: z.array(adminInventoryItemSchema).min(1),
});

export const adminInventoryRestockSchema = z.object({
  recipeId: z.string().min(1),
  quantityDelta: z.number().int().min(1),
  restockDate: optionalString,
  status: z.nativeEnum(InventoryStatus).optional(),
});

export type AdminInventoryUpdateInput = z.infer<typeof adminInventoryBulkSchema>;
export type AdminInventoryRestockInput = z.infer<typeof adminInventoryRestockSchema>;

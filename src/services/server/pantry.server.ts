import { Prisma } from "@/generated/prisma/client";
import { InventoryStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { trackTelemetry } from "@/lib/telemetry";
import { getSystemPantryUserId } from "@/lib/system-user";
import { unstable_cache } from "next/cache";

import type { PantryUpdateInput, PantryAdjustInput } from "@/schema/pantry.schema";
import type { PantryItemView, PantryStatus } from "@/services/shared/pantry.types";

export type PantryScope = "personal" | "global";

export async function getPantryForUser(userId: string) {
  const items = await prisma.pantryItem.findMany({
    where: { userId },
    include: { ingredient: true },
    orderBy: { ingredient: { name: "asc" } },
  });

  return items;
}

const getCachedSystemPantryItems = unstable_cache(
  async () => {
    const systemUserId = await getSystemPantryUserId();
    return getPantryForUser(systemUserId);
  },
  ["system-pantry-items"],
  { revalidate: 60 }
);

export async function getSystemPantryItems() {
  return getCachedSystemPantryItems();
}

export async function upsertPantryItems(userId: string, payload: PantryUpdateInput["items"]) {
  for (const entry of payload) {
    const ingredient = await getOrCreateIngredient(entry.ingredientSlug);

    await prisma.pantryItem.upsert({
      where: {
        userId_ingredientId: {
          userId,
          ingredientId: ingredient.id,
        },
      },
      update: {
        quantity: new Prisma.Decimal(entry.quantity),
        unitLabel: entry.unitLabel,
        status: entry.status,
        expiresOn: entry.expiresOn ? new Date(entry.expiresOn) : null,
      },
      create: {
        userId,
        ingredientId: ingredient.id,
        quantity: new Prisma.Decimal(entry.quantity),
        unitLabel: entry.unitLabel,
        status: entry.status,
        expiresOn: entry.expiresOn ? new Date(entry.expiresOn) : null,
      },
    });
  }

  return getPantryForUser(userId);
}

export async function restockPantryItems(
  userId: string,
  changes: PantryAdjustInput["items"],
  scope: PantryScope = "personal"
) {
  await adjustPantryQuantities(
    userId,
    scope,
    changes.map((change) => ({ ...change, delta: change.amount }))
  );
  return getPantryForUser(userId);
}

export async function consumePantryItems(
  userId: string,
  changes: PantryAdjustInput["items"],
  scope: PantryScope = "personal"
) {
  await adjustPantryQuantities(
    userId,
    scope,
    changes.map((change) => ({ ...change, delta: change.amount * -1 }))
  );
  return getPantryForUser(userId);
}

export function serializePantry(items: Awaited<ReturnType<typeof getPantryForUser>>): PantryItemView[] {
  return items.map((item) => ({
    id: item.id,
    ingredientSlug: item.ingredient.slug,
    ingredientName: item.ingredient.name,
    unitLabel: item.unitLabel,
    quantity: Number(item.quantity),
    status: item.status as PantryStatus,
    expiresOn: item.expiresOn ? item.expiresOn.toISOString() : null,
  }));
}

async function adjustPantryQuantities(
  userId: string,
  scope: PantryScope,
  changes: Array<{ ingredientSlug: string; delta: number }>
) {
  for (const change of changes) {
    const ingredient = await getOrCreateIngredient(change.ingredientSlug);

    const existing = await prisma.pantryItem.findUnique({
      where: {
        userId_ingredientId: {
          userId,
          ingredientId: ingredient.id,
        },
      },
    });

    const currentQuantity = existing ? Number(existing.quantity) : 0;
    const nextQuantity = Math.max(0, currentQuantity + change.delta);
    const status = derivePantryStatus(nextQuantity);

    await prisma.pantryItem.upsert({
      where: {
        userId_ingredientId: {
          userId,
          ingredientId: ingredient.id,
        },
      },
      update: {
        quantity: new Prisma.Decimal(nextQuantity),
        status,
      },
      create: {
        userId,
        ingredientId: ingredient.id,
        quantity: new Prisma.Decimal(nextQuantity),
        unitLabel: existing?.unitLabel ?? ingredient.defaultUnit,
        status,
      },
    });

    trackTelemetry({
      type: change.delta >= 0 ? "pantry.restocked" : "pantry.consumed",
      userId,
      ingredientSlug: change.ingredientSlug,
      quantity: nextQuantity,
      delta: change.delta,
      status,
      scope,
    });

    if (nextQuantity === 0) {
      trackTelemetry({
        type: "pantry.missing",
        userId,
        ingredientSlug: change.ingredientSlug,
        scope,
      });
    }
  }
}

function derivePantryStatus(quantity: number): InventoryStatus {
  if (quantity <= 0) {
    return InventoryStatus.OUT_OF_STOCK;
  }

  if (quantity < 1.5) {
    return InventoryStatus.LOW_STOCK;
  }

  return InventoryStatus.IN_STOCK;
}

async function getOrCreateIngredient(rawSlug: string) {
  const normalizedSlug = slugify(rawSlug);

  const existing = await prisma.ingredient.findUnique({
    where: { slug: normalizedSlug },
  });

  if (existing) {
    return existing;
  }

  const friendlyName = toTitleCase(normalizedSlug.replace(/-/g, " ")) || "Pantry ingredient";

  return prisma.ingredient.create({
    data: {
      slug: normalizedSlug,
      name: friendlyName,
      defaultUnit: "unit",
      allergens: [],
      tags: [],
    },
  });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^$/, "ingredient");
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

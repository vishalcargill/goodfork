import { NextResponse } from "next/server";
import { z } from "zod";

import { InventoryStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { INVENTORY_SYNC_SECRET } from "@/constants/app.constants";
import { trackTelemetry } from "@/lib/telemetry";

const payloadSchema = z.object({
  imports: z
    .array(
      z.object({
        recipeSlug: z.string().min(1),
        quantity: z.number().int().min(0),
        unitLabel: z.string().trim().min(1).optional(),
        status: z.nativeEnum(InventoryStatus).optional(),
        restockDate: z.string().trim().optional().nullable(),
      })
    )
    .min(1),
  source: z.string().trim().default("cron"),
});

const DEFAULT_UNIT = "unit";

export async function POST(request: Request) {
  if (!INVENTORY_SYNC_SECRET) {
    return NextResponse.json(
      { success: false, message: "INVENTORY_SYNC_SECRET is not configured." },
      { status: 500 }
    );
  }

  const providedSecret = request.headers.get("x-cron-secret");
  if (!providedSecret || providedSecret !== INVENTORY_SYNC_SECRET) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = payloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payload.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const slugMap = new Map<string, { id: string; title: string }>();
    const recipes = await prisma.recipe.findMany({
      where: { slug: { in: parsed.data.imports.map((entry) => entry.recipeSlug) } },
      select: { id: true, slug: true, title: true },
    });

    recipes.forEach((recipe) => slugMap.set(recipe.slug, { id: recipe.id, title: recipe.title }));

    const missing: string[] = [];
    const operations = parsed.data.imports
      .map((entry) => {
        const recipe = slugMap.get(entry.recipeSlug);
        if (!recipe) {
          missing.push(entry.recipeSlug);
          return null;
        }

        const nextStatus =
          entry.status ??
          (entry.quantity <= 0
            ? InventoryStatus.OUT_OF_STOCK
            : entry.quantity <= 10
              ? InventoryStatus.LOW_STOCK
              : InventoryStatus.IN_STOCK);

        return prisma.inventoryItem.upsert({
          where: { recipeId: recipe.id },
          update: {
            quantity: entry.quantity,
            unitLabel: entry.unitLabel ?? DEFAULT_UNIT,
            status: nextStatus,
            restockDate: entry.restockDate ? new Date(entry.restockDate) : null,
          },
          create: {
            recipeId: recipe.id,
            quantity: entry.quantity,
            unitLabel: entry.unitLabel ?? DEFAULT_UNIT,
            status: nextStatus,
            restockDate: entry.restockDate ? new Date(entry.restockDate) : null,
          },
          include: {
            recipe: { select: { id: true, title: true } },
          },
        });
      })
      .filter((op): op is NonNullable<typeof op> => Boolean(op));

    const updated = operations.length ? await prisma.$transaction(operations) : [];

    updated.forEach((record) => {
      if (record.status === InventoryStatus.LOW_STOCK || record.status === InventoryStatus.OUT_OF_STOCK) {
        trackTelemetry({
          type: "inventory.low_stock",
          recipeId: record.recipeId,
          recipeTitle: record.recipe.title,
          quantity: record.quantity,
          unitLabel: record.unitLabel,
          status: record.status,
          restockDate: record.restockDate?.toISOString() ?? null,
        });
      } else {
        trackTelemetry({
          type: "inventory.restocked",
          recipeId: record.recipeId,
          recipeTitle: record.recipe.title,
          quantity: record.quantity,
          unitLabel: record.unitLabel,
          status: record.status,
          restockDate: record.restockDate?.toISOString() ?? null,
        });
      }
    });

    if (missing.length) {
      trackTelemetry({
        type: "inventory.sync_failed",
        source: parsed.data.source,
        reason: `Missing recipes: ${missing.join(", ")}`,
      });
    }

    return NextResponse.json({
      success: true,
      updated: updated.length,
      missing,
    });
  } catch (error) {
    console.error("Inventory import failed", error);
    trackTelemetry({
      type: "inventory.sync_failed",
      source: "cron",
      reason: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, message: "Unable to sync inventory feed." },
      { status: 500 }
    );
  }
}

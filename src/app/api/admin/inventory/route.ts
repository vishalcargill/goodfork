import { NextResponse } from "next/server";

import { InventoryStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminApiUser } from "@/lib/auth";
import {
  adminInventoryBulkSchema,
  adminInventoryFiltersSchema,
  adminInventoryRestockSchema,
} from "@/schema/admin-inventory.schema";
import { trackTelemetry } from "@/lib/telemetry";

const inventoryInclude = {
  recipe: {
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      imageUrl: true,
      calories: true,
      proteinGrams: true,
      carbsGrams: true,
      fatGrams: true,
      healthyHighlights: true,
      tags: true,
      allergens: true,
      ratingCount: true,
      difficulty: true,
      serves: true,
    },
  },
};

function parseDateInput(value?: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildErrorResponse(error: unknown, fallback: string) {
  const status =
    typeof error === "object" && error && "statusCode" in error
      ? Number((error as { statusCode?: number }).statusCode)
      : 500;

  return NextResponse.json(
    {
      success: false,
      message: status === 401 ? "Unauthorized." : fallback,
    },
    { status }
  );
}

export async function GET(request: Request) {
  try {
    await requireAdminApiUser();
    const { searchParams } = new URL(request.url);
    const filters = adminInventoryFiltersSchema.safeParse({
      status: searchParams.get("status") ?? undefined,
    });

    if (!filters.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid filters supplied.",
          fieldErrors: filters.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const where = filters.data.status
      ? { status: filters.data.status }
      : undefined;

    const items = await prisma.inventoryItem.findMany({
      where,
      include: inventoryInclude,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("Admin inventory GET failed", error);
    return buildErrorResponse(error, "Unable to load inventory right now.");
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdminApiUser();
    const body = await request.json();
    const parsed = adminInventoryBulkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please review the highlighted fields.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const operations = parsed.data.items.map((item) =>
      prisma.inventoryItem.update({
        where: { recipeId: item.recipeId },
        data: {
          quantity: item.quantity,
          unitLabel: item.unitLabel,
          status: item.status,
          restockDate: parseDateInput(item.restockDate),
        },
        include: inventoryInclude,
      })
    );

    const updated = await prisma.$transaction(operations);

    updated.forEach((item) => {
      if (item.status === InventoryStatus.LOW_STOCK) {
        trackTelemetry({
          type: "inventory.low_stock",
          recipeId: item.recipeId,
          recipeTitle: item.recipe.title,
          quantity: item.quantity,
          unitLabel: item.unitLabel,
          status: item.status,
          restockDate: item.restockDate?.toISOString() ?? null,
        });
      }
    });

    return NextResponse.json({
      success: true,
      updatedCount: updated.length,
      items: updated,
    });
  } catch (error) {
    console.error("Admin inventory PATCH failed", error);
    return buildErrorResponse(error, "Unable to update inventory right now.");
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminApiUser();
    const body = await request.json();
    const parsed = adminInventoryRestockSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please review the highlighted fields.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const existing = await prisma.inventoryItem.findUnique({
      where: { recipeId: parsed.data.recipeId },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Inventory record not found for recipe.",
        },
        { status: 404 }
      );
    }

    const nextQuantity = existing.quantity + parsed.data.quantityDelta;
    const nextStatus =
      parsed.data.status ??
      (nextQuantity <= 0
        ? InventoryStatus.OUT_OF_STOCK
        : InventoryStatus.IN_STOCK);

    const updated = await prisma.inventoryItem.update({
      where: { recipeId: parsed.data.recipeId },
      data: {
        quantity: nextQuantity,
        status: nextStatus,
        restockDate: parseDateInput(parsed.data.restockDate) ?? new Date(),
      },
      include: inventoryInclude,
    });

    trackTelemetry({
      type: "inventory.restocked",
      recipeId: updated.recipeId,
      recipeTitle: updated.recipe.title,
      quantity: updated.quantity,
      unitLabel: updated.unitLabel,
      status: updated.status,
      restockDate: updated.restockDate?.toISOString() ?? null,
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    console.error("Admin inventory POST (restock) failed", error);
    return buildErrorResponse(error, "Unable to restock inventory right now.");
  }
}

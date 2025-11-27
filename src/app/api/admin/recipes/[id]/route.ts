import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { adminRecipeSchema } from "@/schema/admin-recipe.schema";
import { requireAdminApiUser } from "@/lib/auth";
import { ensureRecipeExists, normalizeRecipeData, recipeInclude } from "@/app/api/admin/recipes/recipe-utils";

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

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    await requireAdminApiUser();
    await ensureRecipeExists(id);

    const body = await request.json();
    const parsed = adminRecipeSchema.safeParse(body);

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

    const { recipeData, inventoryData } = normalizeRecipeData(parsed.data);

    const updated = await prisma.recipe.update({
      where: { id },
      data: {
        ...recipeData,
        inventory: {
          upsert: {
            update: inventoryData,
            create: inventoryData,
          },
        },
      },
      include: recipeInclude,
    });

    return NextResponse.json({ success: true, recipe: updated });
  } catch (error) {
    console.error("Admin recipes PUT failed", error);
    return buildErrorResponse(error, "Unable to update recipe right now.");
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
  await requireAdminApiUser();
  await ensureRecipeExists(id);

  await prisma.recipe.delete({ where: { id } });

  return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin recipes DELETE failed", error);
    return buildErrorResponse(error, "Unable to delete recipe right now.");
  }
}

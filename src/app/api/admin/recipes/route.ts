import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { adminRecipeSchema } from "@/schema/admin-recipe.schema";
import { requireAdminApiUser } from "@/lib/auth";
import { normalizeRecipeData, recipeInclude } from "@/app/api/admin/recipes/recipe-utils";

export async function GET() {
  try {
    await requireAdminApiUser();

    const recipes = await prisma.recipe.findMany({
      include: recipeInclude,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ success: true, recipes });
  } catch (error) {
    console.error("Admin recipes GET failed", error);
    const status =
      typeof error === "object" && error && "statusCode" in error
        ? Number((error as { statusCode?: number }).statusCode)
        : 500;

    return NextResponse.json(
      {
        success: false,
        message: status === 401 ? "Unauthorized." : "Unable to load recipes right now.",
      },
      { status }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminApiUser();
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

    const created = await prisma.recipe.create({
      data: {
        ...recipeData,
        inventory: {
          create: inventoryData,
        },
      },
      include: recipeInclude,
    });

    return NextResponse.json({ success: true, recipe: created });
  } catch (error) {
    console.error("Admin recipes POST failed", error);
    const status =
      typeof error === "object" && error && "statusCode" in error
        ? Number((error as { statusCode?: number }).statusCode)
        : 500;

    return NextResponse.json(
      {
        success: false,
        message: status === 401 ? "Unauthorized." : "Unable to create recipe right now.",
      },
      { status }
    );
  }
}

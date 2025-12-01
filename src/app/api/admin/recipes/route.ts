import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { adminRecipeSchema } from "@/schema/admin-recipe.schema";
import { requireAdminApiUser } from "@/lib/auth";
import { normalizeRecipeData, recipeInclude } from "@/app/api/admin/recipes/recipe-utils";

// DB access stubbed for deployment: always returns static error
  return NextResponse.json(
    {
      success: false,
      message: "Database access is disabled in this deployment.",
    },
    { status: 501 }
  );
}

// DB access stubbed for deployment: always returns static error
  return NextResponse.json(
    {
      success: false,
      message: "Database access is disabled in this deployment.",
    },
    { status: 501 }
  );
}

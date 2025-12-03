import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth";
import { pantryConsumeSchema } from "@/schema/pantry.schema";
import { consumePantryItems, serializePantry } from "@/services/server/pantry.server";
import { resolvePantryScope } from "../pantry-scope";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  }

  try {
    const context = await resolvePantryScope(request, user);
    const body = await request.json();
    const parsed = pantryConsumeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid consume payload.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const pantry = await consumePantryItems(context.ownerId, parsed.data.items, context.scope);
    return NextResponse.json({
      success: true,
      pantry: serializePantry(pantry),
    });
  } catch (error) {
    if (isScopeError(error)) {
      return buildScopeErrorResponse(error);
    }

    console.error("Pantry consume failed", error);
    return NextResponse.json({ success: false, message: "Unable to update pantry." }, { status: 500 });
  }
}

function buildScopeErrorResponse(error: unknown) {
  const status =
    typeof error === "object" && error && "statusCode" in error
      ? Number((error as { statusCode?: number }).statusCode)
      : 500;

  const message = status === 403 ? "Admin privileges required." : "Unable to load pantry scope right now.";

  return NextResponse.json({ success: false, message }, { status });
}

function isScopeError(error: unknown) {
  return Boolean(
    typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      (error as { statusCode?: number }).statusCode
  );
}

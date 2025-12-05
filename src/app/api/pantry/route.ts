import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth";
import { pantryUpdateSchema } from "@/schema/pantry.schema";
import { getPantryForUser, serializePantry, upsertPantryItems } from "@/services/server/pantry.server";
import { resolvePantryScope } from "./pantry-scope";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  }

  try {
    const context = await resolvePantryScope(request, user);
    const pantry = await getPantryForUser(context.ownerId);

    return NextResponse.json({
      success: true,
      pantry: serializePantry(pantry),
    });
  } catch (error) {
    if (isScopeError(error)) {
      return buildScopeErrorResponse(error);
    }

    console.error("Pantry fetch failed", error);
    return NextResponse.json({ success: false, message: "Unable to load pantry right now." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  }

  try {
    const context = await resolvePantryScope(request, user);
    const body = await request.json();
    const parsed = pantryUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid pantry payload.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const pantry = await upsertPantryItems(context.ownerId, parsed.data.items);
    return NextResponse.json({
      success: true,
      pantry: serializePantry(pantry),
    });
  } catch (error) {
    if (isScopeError(error)) {
      return buildScopeErrorResponse(error);
    }

    console.error("Pantry update failed", error);
    return NextResponse.json({ success: false, message: "Unable to update pantry right now." }, { status: 500 });
  }
}

function buildScopeErrorResponse(error: unknown) {
  const status =
    typeof error === "object" && error && "statusCode" in error
      ? Number((error as { statusCode?: number }).statusCode)
      : 500;

  const message =
    status === 403 ? "Admin privileges required." : "Unable to load pantry scope right now.";

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

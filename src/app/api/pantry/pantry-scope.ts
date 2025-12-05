import type { User } from "@/generated/prisma/client";
import { ADMIN_EMAIL } from "@/constants/app.constants";
import { getSystemPantryUserId } from "@/lib/system-user";
import type { PantryScope } from "@/services/server/pantry.server";

export type PantryScopeContext = {
  scope: PantryScope;
  ownerId: string;
};

export async function resolvePantryScope(request: Request, user: User): Promise<PantryScopeContext> {
  const scopeParam = new URL(request.url).searchParams.get("scope");

  if (scopeParam === "global") {
    if (user.email.toLowerCase() !== ADMIN_EMAIL) {
      throw Object.assign(new Error("Admin access required to view the operator pantry."), {
        statusCode: 403,
      });
    }

    const ownerId = await getSystemPantryUserId();
    return { scope: "global", ownerId };
  }

  return { scope: "personal", ownerId: user.id };
}

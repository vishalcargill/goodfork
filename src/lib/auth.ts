import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { User } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ADMIN_EMAIL } from "@/constants/app.constants";

const SESSION_COOKIE_NAME = "gf_session";

type SessionWithUser = {
  tokenId: string;
  expiresAt: Date;
  user: User;
};

async function loadSession(): Promise<SessionWithUser | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await prisma.userSession.findUnique({
    where: { tokenId: sessionToken },
    include: { user: true },
  });

  if (!session || session.expiresAt.getTime() < Date.now()) {
    return null;
  }

  return session;
}

export async function getAuthenticatedUser(): Promise<User | null> {
  const session = await loadSession();
  return session?.user ?? null;
}

export async function requireAdminUser() {
  const user = await getAuthenticatedUser();

  if (!user || user.email.toLowerCase() !== ADMIN_EMAIL) {
    redirect("/");
  }

  return user;
}

export async function requireAdminApiUser() {
  const user = await getAuthenticatedUser();

  if (!user || user.email.toLowerCase() !== ADMIN_EMAIL) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }

  return user;
}

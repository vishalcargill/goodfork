import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

type AuthenticateUserInput = {
  email: string;
  password: string;
  userAgent?: string | null;
  ipAddress?: string | null;
};

export async function authenticateUser(input: AuthenticateUserInput) {
  const normalizedEmail = input.email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw Object.assign(new Error("Invalid credentials."), { statusCode: 401 });
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw Object.assign(new Error("Invalid credentials."), { statusCode: 401 });
  }

  const session = await prisma.userSession.create({
    data: {
      userId: user.id,
      tokenId: randomUUID(),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      userAgent: input.userAgent?.slice(0, 255) ?? null,
      ipAddress: input.ipAddress?.slice(0, 64) ?? null,
    },
  });

  return { user, session };
}

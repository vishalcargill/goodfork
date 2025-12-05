import { randomUUID } from "crypto";

import bcrypt from "bcryptjs";

import { SYSTEM_PANTRY_EMAIL } from "@/constants/app.constants";
import { prisma } from "@/lib/prisma";

let cachedSystemUserId: string | null = null;
let createPromise: Promise<string> | null = null;

export async function getSystemPantryUserId() {
  if (cachedSystemUserId) {
    return cachedSystemUserId;
  }

  const systemUser = await prisma.user.findUnique({
    where: { email: SYSTEM_PANTRY_EMAIL },
    select: { id: true },
  });

  if (!systemUser) {
    if (!createPromise) {
      createPromise = createSystemPantryUser();
    }

    cachedSystemUserId = await createPromise;
    createPromise = null;
    return cachedSystemUserId;
  }

  cachedSystemUserId = systemUser.id;
  return cachedSystemUserId;
}

async function createSystemPantryUser() {
  const placeholderPassword = `system-${randomUUID()}`;
  const passwordHash = await bcrypt.hash(placeholderPassword, 11);

  const created = await prisma.user.create({
    data: {
      name: "GoodFork Pantry",
      email: SYSTEM_PANTRY_EMAIL,
      passwordHash,
    },
    select: { id: true },
  });

  console.warn(
    `[pantry] Created system pantry user at ${SYSTEM_PANTRY_EMAIL}. Update pantry rows via /admin/inventory when ready.`
  );

  return created.id;
}

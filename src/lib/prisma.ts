import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { DATABASE_URL } from "@/constants/app.constants";

declare global {
  var prisma: InstanceType<typeof PrismaClient> | undefined;
}

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured. Check your env vars.");
}

const adapter = new PrismaPg({ connectionString: DATABASE_URL });

const prismaClient = globalThis.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prismaClient;
}

export const prisma = prismaClient;

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { DATABASE_URL } from "@/constants/app.constants";

declare global {
  var prisma: InstanceType<typeof PrismaClient> | undefined;
}

const prismaClient =
  DATABASE_URL && !globalThis.prisma
    ? new PrismaClient({ adapter: new PrismaPg({ connectionString: DATABASE_URL }) })
    : globalThis.prisma;

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prismaClient;
}

export const prisma =
  prismaClient ??
  (new Proxy(
    {},
    {
      get() {
        throw new Error("Prisma client unavailable: DATABASE_URL not configured.");
      },
    },
  ) as unknown as PrismaClient);

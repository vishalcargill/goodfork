import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { DATABASE_URL } from "@/constants/app.constants";

declare global {
  var prisma: InstanceType<typeof PrismaClient> | undefined;
}

// Configure SSL for Supabase connections
const getPoolConfig = (connectionString: string) => {
  const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === "production" 
      ? { rejectUnauthorized: true }
      : { rejectUnauthorized: false }, // Allow self-signed certs in development
  });
  return pool;
};

const prismaClient =
  DATABASE_URL && !globalThis.prisma
    ? new PrismaClient({ 
        adapter: new PrismaPg(getPoolConfig(DATABASE_URL))
      })
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

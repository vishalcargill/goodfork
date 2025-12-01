import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const DATABASE_URL = process.env.DATABASE_URL ?? "";

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined. Cannot create admin user.");
}

const ADMIN_DEFAULT_EMAIL = "admin@cargill.com";
const ADMIN_DEFAULT_PASSWORD = "admin@123";

const emailArg = process.argv[2];
const nameArg = process.argv[3];

const adminEmail = (emailArg ?? process.env.ADMIN_EMAIL ?? ADMIN_DEFAULT_EMAIL).toLowerCase();
const adminName = nameArg ?? process.env.ADMIN_NAME ?? "Admin";
const adminPassword = process.env.ADMIN_PASSWORD ?? ADMIN_DEFAULT_PASSWORD;

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  if (!adminEmail) {
    throw new Error("Admin email is required. Pass it as an argument or set ADMIN_EMAIL.");
  }

  if (!adminPassword) {
    throw new Error("Admin password is required.");
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      passwordHash,
    },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash,
    },
  });

  console.log(`Admin user ready: ${user.email}`);
}

main()
  .catch((error) => {
    console.error("Failed to create admin user", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

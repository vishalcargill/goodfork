import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

import { createHash } from "crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const DATABASE_URL = process.env.DATABASE_URL ?? "";
const SUPABASE_URL = (process.env.SUPABASE_URL ?? process.env.SUPABASE_PROJECT_URL ?? "").replace(/\/$/, "");
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? "";
const SUPABASE_SCHEMA = process.env.SUPABASE_SCHEMA ?? "public";
const PAGE_SIZE = Number(process.env.SUPABASE_VERIFY_PAGE_SIZE ?? 500);

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined. Cannot read from Prisma.");
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for verification.");
}

const REST_URL = `${SUPABASE_URL}/rest/v1`;
const TABLES = {
  users: "User",
  profiles: "UserProfile",
  recipes: "Recipe",
  inventory: "InventoryItem",
  recommendations: "Recommendation",
  feedback: "Feedback",
} as const;

type CheckRow = { id: string; updatedAt?: string | null };

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function serializeDate(value?: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function supabaseHeaders(extra?: Record<string, string>): HeadersInit {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "count=exact",
    ...(SUPABASE_SCHEMA ? { "Accept-Profile": SUPABASE_SCHEMA, "Content-Profile": SUPABASE_SCHEMA } : {}),
    ...(extra ?? {}),
  };
}

function checksumRows(rows: CheckRow[]): string {
  const sorted = [...rows].sort((a, b) => a.id.localeCompare(b.id));
  const hash = createHash("sha256");
  for (const row of sorted) {
    hash.update(`${row.id}:${row.updatedAt ?? ""}|`);
  }
  return hash.digest("hex");
}

function parseContentRange(range: string | null): number | null {
  if (!range || !range.includes("/")) return null;
  const [, total] = range.split("/");
  const parsed = Number(total);
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchSupabaseRows(table: string): Promise<{ rows: CheckRow[]; count: number | null }> {
  let offset = 0;
  const rows: CheckRow[] = [];
  let latestCount: number | null = null;

  while (true) {
    const url =
      table === "Feedback"
        ? `${REST_URL}/${table}?select=id,createdAt&order=createdAt.asc&limit=${PAGE_SIZE}&offset=${offset}`
        : `${REST_URL}/${table}?select=id,updatedAt&order=updatedAt.asc&limit=${PAGE_SIZE}&offset=${offset}`;
    const response = await fetch(url, { headers: supabaseHeaders() });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Failed to read ${table} from Supabase: ${response.status} ${message}`);
    }

    const batch = (await response.json()) as CheckRow[];
    rows.push(...batch);

    const rangeHeader = response.headers.get("content-range");
    latestCount = parseContentRange(rangeHeader) ?? latestCount;

    if (batch.length < PAGE_SIZE) {
      break;
    }

    offset += PAGE_SIZE;
  }

  return { rows, count: latestCount ?? rows.length };
}

async function fetchPrismaRows(table: keyof typeof TABLES): Promise<CheckRow[]> {
  switch (table) {
    case "users":
      return prisma.user
        .findMany({ select: { id: true, updatedAt: true } })
        .then((entries) => entries.map((entry) => ({ id: entry.id, updatedAt: serializeDate(entry.updatedAt) })));
    case "profiles":
      return prisma.userProfile
        .findMany({ select: { id: true, updatedAt: true } })
        .then((entries) => entries.map((entry) => ({ id: entry.id, updatedAt: serializeDate(entry.updatedAt) })));
    case "recipes":
      return prisma.recipe
        .findMany({ select: { id: true, updatedAt: true } })
        .then((entries) => entries.map((entry) => ({ id: entry.id, updatedAt: serializeDate(entry.updatedAt) })));
    case "inventory":
      return prisma.inventoryItem
        .findMany({ select: { id: true, updatedAt: true } })
        .then((entries) => entries.map((entry) => ({ id: entry.id, updatedAt: serializeDate(entry.updatedAt) })));
    case "recommendations":
      return prisma.recommendation
        .findMany({ select: { id: true, updatedAt: true } })
        .then((entries) => entries.map((entry) => ({ id: entry.id, updatedAt: serializeDate(entry.updatedAt) })));
    case "feedback":
      return prisma.feedback.findMany({ select: { id: true, createdAt: true } }).then((entries) =>
        entries.map((entry) => ({ id: entry.id, updatedAt: serializeDate(entry.createdAt) }))
      );
    default:
      return [];
  }
}

async function compareTable(tableKey: keyof typeof TABLES) {
  const tableName = TABLES[tableKey];
  const [prismaRows, supabaseData] = await Promise.all([fetchPrismaRows(tableKey), fetchSupabaseRows(tableName)]);

  const prismaChecksum = checksumRows(prismaRows);
  const supabaseChecksum = checksumRows(supabaseData.rows);

  const prismaCount = prismaRows.length;
  const supabaseCount = supabaseData.count ?? supabaseData.rows.length;

  return {
    table: tableName,
    prismaCount,
    supabaseCount,
    checksumMatch: prismaChecksum === supabaseChecksum,
    prismaChecksum,
    supabaseChecksum,
  };
}

async function main() {
  console.log("[supabase-verify] Comparing Prisma vs Supabase…");
  const results = [];

  for (const key of Object.keys(TABLES) as (keyof typeof TABLES)[]) {
    const result = await compareTable(key);
    results.push(result);
    console.log(
      `[${result.table}] prisma=${result.prismaCount} supabase=${result.supabaseCount} checksumMatch=${result.checksumMatch}`
    );
  }

  const mismatches = results.filter((item) => item.prismaCount !== item.supabaseCount || !item.checksumMatch);

  if (mismatches.length) {
    console.warn("[supabase-verify] Mismatches detected:");
    for (const mismatch of mismatches) {
      console.warn(
        `- ${mismatch.table}: prisma=${mismatch.prismaCount} supabase=${mismatch.supabaseCount} checksumMatch=${mismatch.checksumMatch}`
      );
    }
    process.exitCode = 1;
  } else {
    console.log("[supabase-verify] Parity check passed for all tracked tables.");
  }
}

main()
  .catch((error) => {
    console.error("[supabase-verify] Verification failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import {
  DATABASE_URL,
  ENV_WARNINGS,
  FEATURE_FLAGS,
  JWT_SECRET,
  OPENAI_API_KEY,
  RECOMMENDER_MODEL,
} from "@/constants/app.constants";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type HealthIndicator = {
  label: string;
  ok: boolean;
  details: string;
};

export type HealthSnapshot = {
  timestamp: string;
  indicators: HealthIndicator[];
};

async function checkDatabase(): Promise<HealthIndicator> {
  if (!DATABASE_URL) {
    return {
      label: "Database",
      ok: true,
      details: "Skipped database check (DATABASE_URL not configured)",
    };
  }

  try {
    await prisma.$queryRaw(Prisma.sql`SELECT 1`);
    return { label: "Database", ok: true, details: "Connected to Postgres" };
  } catch (error) {
    return {
      label: "Database",
      ok: false,
      details: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

function checkOpenAI(): HealthIndicator {
  if (!OPENAI_API_KEY) {
    return {
      label: "OpenAI",
      ok: false,
      details: ENV_WARNINGS.missingOpenAIKey,
    };
  }

  return {
    label: "OpenAI",
    ok: true,
    details: `SDK configured (${RECOMMENDER_MODEL})`,
  };
}

function checkJwt(): HealthIndicator {
  if (!JWT_SECRET) {
    return {
      label: "JWT Secret",
      ok: false,
      details: ENV_WARNINGS.missingJwtSecret,
    };
  }

  return { label: "JWT Secret", ok: true, details: "Auth tokens can be signed" };
}

function checkHealthySwapFlag(): HealthIndicator {
  return {
    label: "Healthy Swap",
    ok: FEATURE_FLAGS.healthySwap,
    details: FEATURE_FLAGS.healthySwap
      ? "AI swaps enabled via env flag"
      : "Disabled via NEXT_PUBLIC_ENABLE_HEALTHY_SWAP",
  };
}

export async function getHealthSnapshot(): Promise<HealthSnapshot> {
  const [database] = await Promise.all([checkDatabase()]);

  const indicators: HealthIndicator[] = [database, checkOpenAI(), checkJwt(), checkHealthySwapFlag()];

  return {
    timestamp: new Date().toISOString(),
    indicators,
  };
}

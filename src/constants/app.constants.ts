export const DATABASE_URL = process.env.DATABASE_URL ?? "";
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";
export const RECOMMENDER_MODEL = process.env.RECOMMENDER_MODEL ?? "gpt-4o-mini";
export const JWT_SECRET = process.env.JWT_SECRET ?? "";

export const FEATURE_FLAGS = {
  healthySwap: (process.env.NEXT_PUBLIC_ENABLE_HEALTHY_SWAP ?? "true").toLowerCase() !== "false",
};

export const ENV_WARNINGS = {
  missingDatabaseUrl: "DATABASE_URL is not defined. Check your env configuration.",
  missingOpenAIKey: "OPENAI_API_KEY is not defined. Update env before calling AI services.",
  missingJwtSecret: "JWT_SECRET is not defined. Auth tokens cannot be signed.",
};

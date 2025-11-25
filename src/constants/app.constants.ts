export const DATABASE_URL = process.env.DATABASE_URL ?? "";
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";
export const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
export const RECOMMENDER_MODEL = process.env.RECOMMENDER_MODEL ?? "gpt-4o-mini";
export const JWT_SECRET = process.env.JWT_SECRET ?? "";
export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "admin@cargill.com").toLowerCase();
export const RECIPE_EMBEDDING_MODEL =
  process.env.RECIPE_EMBEDDING_MODEL ?? "text-embedding-3-large";
export const RECIPE_EMBEDDING_PROVIDER = (
  process.env.RECIPE_EMBEDDING_PROVIDER ?? "openai"
).toLowerCase();
export const RECIPE_EMBEDDING_VERSION = process.env.RECIPE_EMBEDDING_VERSION ?? "v1";

export const FEATURE_FLAGS = {
  healthySwap: (process.env.NEXT_PUBLIC_ENABLE_HEALTHY_SWAP ?? "true").toLowerCase() !== "false",
};

export const ENV_WARNINGS = {
  missingDatabaseUrl: "DATABASE_URL is not defined. Check your env configuration.",
  missingOpenAIKey: "OPENAI_API_KEY is not defined. Update env before calling AI services.",
  missingJwtSecret: "JWT_SECRET is not defined. Auth tokens cannot be signed.",
  missingEmbeddingModel: "Configure RECIPE_EMBEDDING_MODEL to generate semantic vectors.",
};

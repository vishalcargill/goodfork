-- AlterTable
ALTER TABLE "Recipe"
  ADD COLUMN     "sourceId" TEXT,
  ADD COLUMN     "sourceUrl" TEXT,
  ADD COLUMN     "author" TEXT,
  ADD COLUMN     "ingredients" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN     "instructions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN     "serves" INTEGER,
  ADD COLUMN     "difficulty" TEXT,
  ADD COLUMN     "prepTimeMinutes" INTEGER,
  ADD COLUMN     "cookTimeMinutes" INTEGER,
  ADD COLUMN     "averageRating" DOUBLE PRECISION,
  ADD COLUMN     "ratingCount" INTEGER,
  ADD COLUMN     "dishType" TEXT,
  ADD COLUMN     "mainCategory" TEXT,
  ADD COLUMN     "subCategory" TEXT,
  ADD COLUMN     "nutrients" JSONB,
  ADD COLUMN     "timers" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_sourceId_key" ON "Recipe"("sourceId");

-- CreateEnum
CREATE TYPE "EmbeddingStatus" AS ENUM ('ACTIVE', 'STALE', 'FAILED');

-- CreateTable
CREATE TABLE "RecipeEmbedding" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'v1',
    "dimension" INTEGER NOT NULL,
    "embedding" DOUBLE PRECISION[] NOT NULL,
    "status" "EmbeddingStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipeEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecipeEmbedding_recipeId_provider_model_version_key" ON "RecipeEmbedding"("recipeId", "provider", "model", "version");

-- CreateIndex
CREATE INDEX "RecipeEmbedding_model_idx" ON "RecipeEmbedding"("model");

-- CreateIndex
CREATE INDEX "RecipeEmbedding_provider_idx" ON "RecipeEmbedding"("provider");

-- AddForeignKey
ALTER TABLE "RecipeEmbedding" ADD CONSTRAINT "RecipeEmbedding_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

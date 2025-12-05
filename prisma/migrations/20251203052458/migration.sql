-- AlterTable
ALTER TABLE "Ingredient" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PantryItem" ALTER COLUMN "quantity" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "RecipeIngredient" ALTER COLUMN "updatedAt" DROP DEFAULT;

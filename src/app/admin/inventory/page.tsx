import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth";
import { AdminStockWorkspace } from "@/components/admin/admin-stock-workspace";
import { mergeIngredientOptions } from "@/constants/ingredient-catalog";
import { serializePantry, getSystemPantryItems } from "@/services/server/pantry.server";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  await requireAdminUser();

  const [inventory, systemPantry, dbIngredients] = await Promise.all([
    prisma.inventoryItem.findMany({
      include: {
        recipe: {
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            imageUrl: true,
            calories: true,
            proteinGrams: true,
            carbsGrams: true,
            fatGrams: true,
            healthyHighlights: true,
            tags: true,
            allergens: true,
            ratingCount: true,
            difficulty: true,
            serves: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    getSystemPantryItems(),
    prisma.ingredient.findMany({
      select: {
        slug: true,
        name: true,
        defaultUnit: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedPantry = serializePantry(systemPantry);
  const ingredientOptions = mergeIngredientOptions(dbIngredients);

  return (
    <div className='space-y-8 pb-8'>
      <header className='space-y-2'>
        <h1 className='text-3xl font-bold text-foreground'>Inventory</h1>
        <p className='max-w-3xl text-muted-foreground'>
          Monitor live availability, bulk-edit quantities, and log restocks.
        </p>
      </header>
      <AdminStockWorkspace
        inventoryItems={inventory}
        pantryItems={serializedPantry}
        ingredientOptions={ingredientOptions}
      />
    </div>
  );
}

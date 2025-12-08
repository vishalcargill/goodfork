import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth";
import { AdminRecipeManager } from "@/components/admin/admin-recipe-manager";

export const dynamic = "force-dynamic";

export default async function AdminRecipesPage() {
  await requireAdminUser();

  const recipes = await prisma.recipe.findMany({
    include: { inventory: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className='space-y-8 pb-8'>
      <header className='space-y-2'>
        <h1 className='text-3xl font-bold text-foreground'>Recipes</h1>
        <p className='max-w-3xl text-muted-foreground'>
          Add, edit, and retire recipes while previewing exactly how each card renders for consumers.
        </p>
      </header>
      <AdminRecipeManager initialRecipes={recipes} />
    </div>
  );
}



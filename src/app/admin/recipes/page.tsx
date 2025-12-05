import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth";
import { AdminRecipeManager } from "@/components/admin/admin-recipe-manager";
import { AdminNavigation } from "@/components/admin/admin-navigation";

export const dynamic = "force-dynamic";

export default async function AdminRecipesPage() {
  await requireAdminUser();

  const recipes = await prisma.recipe.findMany({
    include: { inventory: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className='mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8'>
      <AdminNavigation active='recipes' />
      <div className='space-y-2 pb-8'>
        <p className='text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600'>
          Admin · Recipes
        </p>
        <h1 className='text-3xl font-semibold text-slate-900'>Manage menu inventory</h1>
        <p className='max-w-3xl text-slate-600'>
          Add, edit, and retire recipes while previewing exactly how each card renders for consumers. All
          fields map 1:1 to the Prisma data model so the recommendation engine stays consistent.
        </p>
      </div>
      <AdminRecipeManager initialRecipes={recipes} />
    </div>
  );
}

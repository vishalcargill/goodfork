import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PantryManager } from "@/components/pantry/pantry-manager";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mergeIngredientOptions } from "@/constants/ingredient-catalog";
import { getPantryForUser, serializePantry } from "@/services/server/pantry.server";

export const metadata: Metadata = {
  title: "GoodFork | Pantry",
  description: "Track pantry availability, restock ingredients, and keep recommendations aligned with your inventory.",
};

export default async function PantryPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/onboarding?next=/pantry");
  }

  const pantryItems = await getPantryForUser(user.id);
  const dbIngredients = await prisma.ingredient.findMany({
    select: {
      slug: true,
      name: true,
      defaultUnit: true,
    },
    orderBy: { name: "asc" },
  });
  const ingredientOptions = mergeIngredientOptions(dbIngredients);

  return (
    <div className='min-h-screen bg-[#f2f6f2] text-slate-900'>
      <div className='mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-8'>
        <header className='rounded-[28px] border border-emerald-100 bg-[#f8fbf7] px-6 py-8 shadow-[0_16px_50px_rgba(16,185,129,0.12)]'>
          <p className='text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700'>Personal pantry</p>
          <h1 className='mt-3 text-3xl font-semibold text-[#1c2a24] sm:text-4xl'>Stay stocked for your menus</h1>
          <p className='mt-3 text-sm text-slate-600'>
            Restock or consume ingredients here and your personalized menus will immediately reflect new availability.
          </p>
        </header>
        <PantryManager initialItems={serializePantry(pantryItems)} ingredientOptions={ingredientOptions} />
      </div>
    </div>
  );
}

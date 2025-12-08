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
    <div className='space-y-8 pb-8'>
      <header className='space-y-2'>
        <h1 className='text-3xl font-bold text-foreground'>Personal Pantry</h1>
        <p className='max-w-3xl text-muted-foreground'>
          Restock or consume ingredients here and your personalized menus will immediately reflect new availability.
        </p>
      </header>
      <PantryManager initialItems={serializePantry(pantryItems)} ingredientOptions={ingredientOptions} />
    </div>
  );
}



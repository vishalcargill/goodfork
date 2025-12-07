import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { RecommendationsGrid } from "@/components/recommendations/recommendations-grid";
import { ProfileSummaryBar } from "@/components/profile/profile-summary-bar";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ADMIN_EMAIL } from "@/constants/app.constants";
import { ALLERGEN_OPTIONS, GOAL_OPTIONS } from "@/constants/personalization-options";
import { normalizeRecommendationSource } from "@/constants/data-sources";
import { InventoryStatus } from "@/generated/prisma/client";

export const metadata: Metadata = {
  title: "GoodFork | Your Menus",
  description:
    "Personalized menus tuned to your goals, allergens, and pantry inventory.",
};

type MenusPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MenusPage({ searchParams }: MenusPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const prefillValue = resolvedSearchParams?.prefillEmail;
  const prefillEmail = typeof prefillValue === "string" ? prefillValue : undefined;
  const sourceValue = resolvedSearchParams?.source;
  const initialSource = normalizeRecommendationSource(typeof sourceValue === "string" ? sourceValue : undefined);

  const currentUser = await getAuthenticatedUser();

  if (currentUser?.email.toLowerCase() === ADMIN_EMAIL) {
    redirect("/admin");
  }

  const activeEmail = (currentUser?.email ?? prefillEmail)?.toLowerCase();

  if (!activeEmail) {
    redirect("/onboarding?next=/menus");
  }

  const displayEmail = currentUser?.email ?? prefillEmail ?? activeEmail;

  const user = await prisma.user.findUnique({
    where: { email: activeEmail },
    include: { profile: true },
  });

  // Double check profile existence if we rely on it heavily
  if (!user?.profile) {
    // If user exists but no profile, they might need onboarding
     // This redirect logic might loop if user is created but not profiled properly, 
     // but for now it matches existing flow.
  }

  const profile = user?.profile ?? null;
  const pantryItems =
    user && user.id
      ? await prisma.pantryItem.findMany({
          where: { userId: user.id },
          include: { ingredient: true },
          orderBy: { ingredient: { name: "asc" } },
        })
      : [];

  const goalLabels = profile?.dietaryGoals?.length
    ? GOAL_OPTIONS.filter((option) => profile.dietaryGoals?.includes(option.value)).map((option) => option.label)
    : [];

  const allergenLabels = profile?.allergens?.length
    ? ALLERGEN_OPTIONS.filter((option) => profile.allergens?.includes(option.value)).map((option) => option.label)
    : [];

  const readyPantryCount = pantryItems.filter((item) => item.status === InventoryStatus.IN_STOCK).length;
  const lowPantryCount = pantryItems.filter((item) => item.status === InventoryStatus.LOW_STOCK).length;
  const pantryIsEmpty = pantryItems.length === 0;

  return (
    <div className="flex flex-col min-h-full">
      <ProfileSummaryBar 
        goalLabels={goalLabels} 
        allergenLabels={allergenLabels} 
        pantryStats={{
          readyCount: readyPantryCount,
          lowCount: lowPantryCount,
          isEmpty: pantryIsEmpty
        }}
      />

      <div className="flex-1 space-y-8 p-4 md:p-8 max-w-7xl mx-auto w-full">
        <header className="max-w-3xl space-y-2">
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">
            Your Menus
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Menus tuned to your goals, allergens, and pantry. <br className="hidden sm:inline"/>
            Adjust your profile above and we’ll re-personalize in seconds.
          </p>
        </header>

        <section>
          <RecommendationsGrid activeEmail={displayEmail} initialSource={initialSource} />
        </section>
      </div>
    </div>
  );
}

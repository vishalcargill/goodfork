import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GearSix } from "@phosphor-icons/react/dist/ssr";

import { RecommendationsDemo } from "@/components/recommendations/recommendations-demo";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ADMIN_EMAIL } from "@/constants/app.constants";
import { ALLERGEN_OPTIONS, GOAL_OPTIONS } from "@/constants/personalization-options";
import { normalizeRecommendationSource } from "@/constants/data-sources";
import { InventoryStatus } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "GoodFork | Personalized Menus",
  description:
    "Review personalized menu cards, swap insights, and live inventory signals tailored to your onboarding profile.",
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
  const pantryValues =
    pantryItems.length === 0
      ? ["Add pantry items to unlock cookable menus"]
      : [
          `Ready: ${readyPantryCount}`,
          lowPantryCount ? `${lowPantryCount} low stock` : "Fully stocked",
        ];

  const sessionHighlights = [
    {
      label: "Active goals",
      values: goalLabels.length ? goalLabels : ["Add goals in personalization"],
    },
    {
      label: "Allergen shields",
      values: allergenLabels.length ? allergenLabels : ["No active shields"],
    },
    {
      label: "Pantry pulse",
      values: pantryValues,
    },
  ];

  return (
    <div className='space-y-8 pb-8'>
      <header className='flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between'>
        <div className='space-y-2'>
          <h1 className='text-3xl font-bold text-foreground'>
            Your Menus
          </h1>
          <p className='max-w-3xl text-muted-foreground'>
            Menus tuned to your saved profile, inventory, and preferences.
          </p>
        </div>
        <Link
          href='/personalization'
          className='inline-flex items-center gap-2 self-start rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:bg-surface-subtle hover:text-primary'
        >
          <GearSix className='h-5 w-5 text-primary' weight='duotone' />
          Adjust settings
        </Link>
      </header>

      <section className='grid gap-4 sm:grid-cols-3'>
        {sessionHighlights.map((highlight) => (
          <div key={highlight.label} className='rounded-xl border border-border bg-surface p-4 shadow-sm'>
            <p className='text-xs font-semibold uppercase tracking-wider text-primary mb-2'>{highlight.label}</p>
            <div className='flex flex-wrap gap-2'>
              {highlight.values.map((value) => (
                <span
                  key={`${highlight.label}-${value}`}
                  className='inline-flex items-center rounded-full bg-surface-subtle px-2.5 py-0.5 text-xs font-medium text-foreground border border-border-subtle'
                >
                  {value}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section>
        <RecommendationsDemo activeEmail={displayEmail} initialSource={initialSource} />
      </section>
    </div>
  );
}

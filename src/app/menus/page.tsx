import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GearSix } from "@phosphor-icons/react/dist/ssr";

import { RecommendationsDemo } from "@/components/recommendations/recommendations-demo";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ADMIN_EMAIL } from "@/constants/app.constants";
import { ALLERGEN_OPTIONS, GOAL_OPTIONS } from "@/constants/personalization-options";
import { InventoryStatus } from "@/generated/prisma/client";

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
    <div className='min-h-screen bg-[#f2f6f2] text-slate-900'>
      <div className='mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:px-8'>
        <header className='rounded-[28px] border border-emerald-100 bg-[#f8fbf7] px-6 py-8 shadow-[0_16px_50px_rgba(16,185,129,0.1)] sm:px-10'>
          <div className='flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between'>
            <div className='space-y-4'>
              <h1 className='text-4xl font-semibold leading-tight text-[#1c2a24] sm:text-5xl'>
                Menus tuned to your saved profile
              </h1>
              <p className='max-w-3xl text-lg text-slate-600'>
                We hydrate this workspace directly from onboarding so recommendations, swaps, and inventory context stay
                in sync.
              </p>
            </div>
            <Link
              href='/personalization'
              className='inline-flex items-center gap-2 self-start rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_42px_rgba(15,23,42,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8fbf7]'
            >
              <GearSix className='h-5 w-5 text-emerald-700' weight='duotone' />
              Adjust settings
            </Link>
          </div>

          <div className='mt-8 grid gap-8 sm:grid-cols-2 sm:items-start'>
            {sessionHighlights.map((highlight) => (
              <div key={highlight.label} className='space-y-3'>
                <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-700'>{highlight.label}</p>
                <div className='flex flex-wrap gap-3'>
                  {highlight.values.map((value) => (
                    <span
                      key={`${highlight.label}-${value}`}
                      className='inline-flex items-center rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-[0_8px_24px_rgba(15,23,42,0.08)]'
                    >
                      {value}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </header>

        <section className='rounded-[28px] border border-emerald-100 bg-white p-6 shadow-[0_20px_60px_rgba(16,185,129,0.12)]'>
          <RecommendationsDemo prefillEmail={displayEmail} />
        </section>
      </div>
    </div>
  );
}

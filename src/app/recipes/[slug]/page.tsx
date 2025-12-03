import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { FeedbackActions } from "@/components/feedback/feedback-actions";
import { RecipeInsightsTabs } from "@/components/recipes/recipe-insights-tabs";
import { cn } from "@/lib/utils";
import { getAuthenticatedUser } from "@/lib/auth";
import { getRecipeDetailBySlug } from "@/services/server/recipes.server";
import type { InventoryStatus } from "@/generated/prisma/client";

type RecipeDetailPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const inventoryThemes: Record<InventoryStatus, { badge: string; label: string; copy: string }> = {
  IN_STOCK: {
    label: "Ready now",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
    copy: "Inventory looks great—recommendations surface this meal instantly.",
  },
  LOW_STOCK: {
    label: "Low stock",
    badge: "border-amber-200 bg-amber-50 text-amber-800",
    copy: "Quantities are tapering. Consumers may see healthy swap nudges soon.",
  },
  OUT_OF_STOCK: {
    label: "Out of stock",
    badge: "border-rose-200 bg-rose-50 text-rose-800",
    copy: "Temporarily hidden while operators restock ingredients.",
  },
};

export async function generateMetadata({ params }: RecipeDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getRecipeDetailBySlug(slug);

  if (!detail) {
    return {
      title: "Recipe not found · GoodFork",
    };
  }

  return {
    title: `${detail.recipe.title} | GoodFork Recipe Detail`,
    description: detail.recipe.description ?? "Full nutrition context, inventory state, and insights for this recipe.",
  };
}

export default async function RecipeDetailPage({ params, searchParams }: RecipeDetailPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const currentUser = await getAuthenticatedUser();
  const queryUserId = typeof resolvedSearchParams?.userId === "string" ? resolvedSearchParams.userId : undefined;
  const recommendationId =
    typeof resolvedSearchParams?.recommendationId === "string" ? resolvedSearchParams.recommendationId : undefined;
  const userId = queryUserId ?? currentUser?.id;

  const { slug } = await params;
  const detail = await getRecipeDetailBySlug(slug, { userId, recommendationId });

  if (!detail) {
    notFound();
  }

  const { recipe, macroStats, timeStats, aiInsights, nutritionEntries, recommendationStats, recommendationContext } =
    detail;
  const inventory = recipe.inventory;
  const inventoryTheme = inventory ? inventoryThemes[inventory.status] : null;
  const highlightGroups = [
    { title: "Tags", values: recipe.tags },
    { title: "Allergens", values: recipe.allergens },
    { title: "Healthy highlights", values: recipe.healthyHighlights },
  ];
  const isRemoteImage = recipe.imageUrl?.startsWith("http");
  const fallbackContext = recommendationId && userId ? { recommendationId, userId } : null;
  const activeContext = recommendationContext ?? fallbackContext;
  const feedbackRecommendationId = activeContext?.recommendationId;
  const feedbackUserId = activeContext?.userId ?? userId;

  const metadataPills = [
    { label: "Cuisine", value: recipe.cuisine ?? "Chef's pick" },
    { label: "Dish type", value: recipe.dishType ?? "Fusion" },
    { label: "Serves", value: recipe.serves ? `${recipe.serves} person${recipe.serves > 1 ? "s" : ""}` : "Flexible" },
    { label: "Difficulty", value: recipe.difficulty ?? "Approachable" },
    ...timeStats,
  ];

  const ratingLabel = recipe.averageRating
    ? `${recipe.averageRating.toFixed(1)} • ${recipe.ratingCount ?? 0} votes`
    : "Rating data coming soon";

  const lastRecommendedLabel = recommendationStats.lastServedAt
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric" }).format(
        recommendationStats.lastServedAt
      )
    : "Not shown yet";

  return (
    <div className='relative min-h-screen bg-[#f6fff4] text-slate-900'>
      <div className='pointer-events-none absolute inset-0 -z-10 opacity-70'>
        <div className='absolute left-[5%] top-10 h-64 w-64 rounded-full bg-emerald-100 blur-[160px]' />
        <div className='absolute right-[12%] top-0 h-72 w-72 rounded-full bg-lime-200 blur-[180px]' />
        <div className='absolute bottom-[-5%] left-[30%] h-80 w-80 rounded-full bg-cyan-100 blur-[160px]' />
      </div>

      <div className='mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:px-8'>
        <header className='grid gap-6 rounded-[32px] border border-emerald-100 bg-white/95 p-6 shadow-[0_20px_60px_rgba(16,185,129,0.15)] backdrop-blur lg:grid-cols-[1.35fr_1fr]'>
          <div className='space-y-5'>
            <span className='inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700'>
              Recipe detail
            </span>
            <div className='space-y-3'>
              <h1 className='text-3xl font-semibold text-slate-900 sm:text-4xl'>{recipe.title}</h1>
              <p className='text-sm text-slate-600'>
                {recipe.description ?? "Operators are still adding the story for this dish."}
              </p>
            </div>

            <div className='flex flex-wrap items-center gap-3'>
              {inventoryTheme ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                    inventoryTheme.badge
                  )}
                >
                  {inventoryTheme.label}
                </span>
              ) : (
                <span className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600'>
                  Inventory pending
                </span>
              )}
              <span className='inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700'>
                {ratingLabel}
              </span>
            </div>

            {macroStats.length ? (
              <div className='flex flex-wrap gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-slate-800'>
                {macroStats.map((macro) => (
                  <div key={macro.key}>
                    <p className='text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600'>
                      {macro.label}
                    </p>
                    <p className='text-lg font-semibold text-slate-900'>{macro.value}</p>
                  </div>
                ))}
              </div>
            ) : null}

            <dl className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
              {metadataPills.map((pill) => (
                <div
                  key={`${pill.label}-${pill.value}`}
                  className='rounded-2xl border border-emerald-100 bg-white/70 p-4 text-sm text-slate-600'
                >
                  <dt className='text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600'>
                    {pill.label}
                  </dt>
                  <dd className='mt-1 text-base font-semibold text-slate-900'>{pill.value}</dd>
                </div>
              ))}
            </dl>

            <div className='rounded-2xl border border-emerald-100 bg-white/70 p-4 shadow-[0_12px_32px_rgba(16,185,129,0.12)]'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <FeedbackActions
                  recommendationId={feedbackRecommendationId}
                  userId={feedbackUserId}
                  layout='inline'
                  disabledHint='Open this recipe from your personalized menu cards to record Accept or Swap.'
                />
              </div>
            </div>

            {inventoryTheme ? (
              <p className='text-sm text-slate-600'>{inventoryTheme.copy}</p>
            ) : (
              <p className='text-sm text-slate-600'>Inventory data sync pending for this recipe.</p>
            )}
          </div>

          <div className='relative h-72 w-full overflow-hidden rounded-[28px] border border-emerald-100 bg-emerald-50 shadow-[0_25px_60px_rgba(16,185,129,0.25)] sm:h-96'>
            {recipe.imageUrl ? (
              <Image
                src={recipe.imageUrl}
                alt={recipe.title}
                fill
                className='object-cover'
                sizes='(max-width: 768px) 100vw, 480px'
                priority
                unoptimized={Boolean(isRemoteImage)}
              />
            ) : (
              <div className='flex h-full w-full items-center justify-center text-sm font-semibold text-emerald-700'>
                Imagery coming soon
              </div>
            )}
            <div className='absolute left-4 top-4 rounded-2xl border border-white/60 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700'>
              {recipe.cuisine ?? "Nutrition"}
            </div>
          </div>
        </header>

        <section className='grid gap-4 rounded-[28px] border border-emerald-100 bg-white/80 p-6 shadow-[0_20px_50px_rgba(16,185,129,0.12)] sm:grid-cols-3'>
          {highlightGroups.map((group) => (
            <div key={group.title} className='space-y-3'>
              <p className='text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600'>{group.title}</p>
              {group.values?.length ? (
                <div className='flex flex-wrap gap-2'>
                  {group.values.map((value) => (
                    <span
                      key={`${group.title}-${value}`}
                      className='inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800'
                    >
                      {value.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              ) : (
                <p className='text-sm text-slate-500'>No {group.title.toLowerCase()} logged yet.</p>
              )}
            </div>
          ))}
        </section>

        <RecipeInsightsTabs nutritionEntries={nutritionEntries} aiInsights={aiInsights} />

        <section className='grid gap-8 rounded-[28px] border border-emerald-100 bg-white/80 p-6 shadow-[0_20px_60px_rgba(16,185,129,0.12)] md:grid-cols-2'>
          <div>
            <h2 className='text-xl font-semibold text-slate-900'>Ingredients</h2>
            {recipe.ingredients?.length ? (
              <ul className='mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700'>
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={`${ingredient}-${index}`}>{ingredient}</li>
                ))}
              </ul>
            ) : (
              <p className='mt-3 text-sm text-slate-600'>
                Ingredient list coming soon—operators are still mapping raw inventory.
              </p>
            )}
          </div>

          <div>
            <h2 className='text-xl font-semibold text-slate-900'>Instructions</h2>
            {recipe.instructions?.length ? (
              <ol className='mt-4 space-y-3 text-sm text-slate-700'>
                {recipe.instructions.map((step, index) => (
                  <li key={`${step}-${index}`} className='flex items-start gap-3'>
                    <span className='flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800'>
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className='mt-3 text-sm text-slate-600'>Steps will appear after the recipe handoff is finalized.</p>
            )}
          </div>
        </section>

        <section className='grid gap-6 md:grid-cols-2'>
          <div className='rounded-[28px] border border-emerald-100 bg-white/90 p-6 shadow-[0_20px_50px_rgba(16,185,129,0.12)]'>
            <p className='text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600'>Inventory</p>
            {inventory ? (
              <div className='mt-4 space-y-3 text-sm text-slate-700'>
                <p>
                  <span className='font-semibold text-slate-900'>Quantity:</span> {inventory.quantity}{" "}
                  {inventory.unitLabel}
                </p>
                {inventory.restockDate ? (
                  <p>
                    <span className='font-semibold text-slate-900'>Next restock:</span>{" "}
                    {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
                      new Date(inventory.restockDate)
                    )}
                  </p>
                ) : null}
                <p className='text-xs text-slate-500'>
                  Status updates here fan out to personalization + admin workspaces instantly.
                </p>
              </div>
            ) : (
              <p className='mt-3 text-sm text-slate-600'>Inventory record not attached yet.</p>
            )}
          </div>

          <div className='rounded-[28px] border border-emerald-100 bg-white/90 p-6 shadow-[0_20px_50px_rgba(16,185,129,0.12)]'>
            <p className='text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600'>
              Recommendation telemetry
            </p>
            <div className='mt-4 space-y-3 text-sm text-slate-700'>
              <p>
                <span className='font-semibold text-slate-900'>Sessions served:</span>{" "}
                {recommendationStats.totalServed.toLocaleString()}
              </p>
              <p>
                <span className='font-semibold text-slate-900'>Last recommended:</span> {lastRecommendedLabel}
              </p>
              <p className='text-xs text-slate-500'>
                Pulls from the live recommendations table so ops + analysts can cite demo usage.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

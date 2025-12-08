import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { FeedbackActions } from "@/components/feedback/feedback-actions";
import { RecipeInsightsTabs } from "@/components/recipes/recipe-insights-tabs";
import { cn } from "@/lib/utils";
import { normalizeImageUrl } from "@/lib/images";
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
    badge: "border-success/20 bg-success/10 text-success",
    copy: "Inventory looks great—recommendations surface this meal instantly.",
  },
  LOW_STOCK: {
    label: "Low stock",
    badge: "border-warning/20 bg-warning/10 text-warning-foreground",
    copy: "Quantities are tapering. Consumers may see healthy swap nudges soon.",
  },
  OUT_OF_STOCK: {
    label: "Out of stock",
    badge: "border-destructive/20 bg-destructive/10 text-destructive",
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
  const normalizedImageUrl = normalizeImageUrl(recipe.imageUrl);
  const isRemoteImage = normalizedImageUrl?.startsWith("http");
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
    <div className='bg-background text-foreground pb-12'>
      <div className='mx-auto flex max-w-6xl flex-col gap-8'>
        {/* Header Section */}
        <header className='grid gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm lg:grid-cols-[1.35fr_1fr]'>
          <div className='space-y-5'>
            <div className='flex items-center gap-3'>
               <span className='inline-flex items-center rounded-full border border-border-subtle bg-surface-subtle px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary'>
                 Recipe detail
               </span>
            </div>
            
            <div className='space-y-3'>
              <h1 className='text-3xl font-bold text-foreground sm:text-4xl'>{recipe.title}</h1>
              <p className='text-sm text-muted-foreground'>
                {recipe.description ?? "Operators are still adding the story for this dish."}
              </p>
            </div>

            <div className='flex flex-wrap items-center gap-3'>
              {inventoryTheme ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                    inventoryTheme.badge
                  )}
                >
                  {inventoryTheme.label}
                </span>
              ) : (
                <span className='inline-flex items-center gap-2 rounded-full border border-border bg-surface-subtle px-2.5 py-0.5 text-xs font-semibold text-muted-foreground'>
                  Inventory pending
                </span>
              )}
              <span className='inline-flex items-center gap-2 rounded-full border border-border bg-surface-subtle px-2.5 py-0.5 text-xs font-semibold text-primary'>
                {ratingLabel}
              </span>
            </div>

            {macroStats.length ? (
              <div className='flex flex-wrap gap-4 rounded-xl border border-border-subtle bg-surface-subtle p-4 text-foreground'>
                {macroStats.map((macro) => (
                  <div key={macro.key}>
                    <p className='text-[10px] font-bold uppercase tracking-wider text-primary'>
                      {macro.label}
                    </p>
                    <p className='text-lg font-semibold'>{macro.value}</p>
                  </div>
                ))}
              </div>
            ) : null}

            <dl className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
              {metadataPills.map((pill) => (
                <div
                  key={`${pill.label}-${pill.value}`}
                  className='rounded-xl border border-border-subtle bg-surface p-3 text-sm text-muted-foreground'
                >
                  <dt className='text-[10px] font-bold uppercase tracking-wider text-primary'>
                    {pill.label}
                  </dt>
                  <dd className='mt-1 text-base font-semibold text-foreground'>{pill.value}</dd>
                </div>
              ))}
            </dl>

            <div className='rounded-xl border border-border bg-surface p-4 shadow-sm'>
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
              <p className='text-xs text-muted-foreground'>{inventoryTheme.copy}</p>
            ) : (
              <p className='text-xs text-muted-foreground'>Inventory data sync pending for this recipe.</p>
            )}
          </div>

          <div className='relative h-72 w-full overflow-hidden rounded-xl border border-border bg-surface-subtle shadow-sm sm:h-96'>
            {normalizedImageUrl ? (
              <Image
                src={normalizedImageUrl}
                alt={recipe.title}
                fill
                className='object-cover'
                sizes='(max-width: 768px) 100vw, 480px'
                priority
                unoptimized={Boolean(isRemoteImage)}
              />
            ) : (
              <div className='flex h-full w-full items-center justify-center text-sm font-semibold text-primary'>
                Imagery coming soon
              </div>
            )}
            <div className='absolute left-4 top-4 rounded-lg border border-white/60 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary backdrop-blur-sm'>
              {recipe.cuisine ?? "Nutrition"}
            </div>
          </div>
        </header>

        {/* Highlights */}
        <section className='grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm sm:grid-cols-3'>
          {highlightGroups.map((group) => (
            <div key={group.title} className='space-y-3'>
              <p className='text-[10px] font-bold uppercase tracking-wider text-primary'>{group.title}</p>
              {group.values?.length ? (
                <div className='flex flex-wrap gap-2'>
                  {group.values.map((value) => (
                    <span
                      key={`${group.title}-${value}`}
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                        group.title === "Allergens"
                          ? "border-red-500/20 bg-red-50 text-red-700"
                          : "border-border-subtle bg-surface-subtle text-foreground"
                      )}
                    >
                      {value.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              ) : (
                <p className='text-sm text-muted-foreground'>No {group.title.toLowerCase()} logged yet.</p>
              )}
            </div>
          ))}
        </section>

        {/* Insights Tabs */}
        <RecipeInsightsTabs nutritionEntries={nutritionEntries} aiInsights={aiInsights} />

        {/* Instructions & Ingredients */}
        <section className='grid gap-8 rounded-2xl border border-border bg-card p-6 shadow-sm md:grid-cols-2'>
          <div>
            <h2 className='text-xl font-semibold text-foreground'>Ingredients</h2>
            {recipe.ingredients?.length ? (
              <ul className='mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground'>
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={`${ingredient}-${index}`}>{ingredient}</li>
                ))}
              </ul>
            ) : (
              <p className='mt-3 text-sm text-muted-foreground'>
                Ingredient list coming soon—operators are still mapping raw inventory.
              </p>
            )}
          </div>

          <div>
            <h2 className='text-xl font-semibold text-foreground'>Instructions</h2>
            {recipe.instructions?.length ? (
              <ol className='mt-4 space-y-3 text-sm text-muted-foreground'>
                {recipe.instructions.map((step, index) => (
                  <li key={`${step}-${index}`} className='flex items-start gap-3'>
                    <span className='flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary'>
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className='mt-3 text-sm text-muted-foreground'>Steps will appear after the recipe handoff is finalized.</p>
            )}
          </div>
        </section>

        {/* Inventory & Telemetry */}
        <section className='grid gap-6 md:grid-cols-2'>
          <div className='rounded-2xl border border-border bg-card p-6 shadow-sm'>
            <p className='text-[10px] font-bold uppercase tracking-wider text-primary'>Inventory</p>
            {inventory ? (
              <div className='mt-4 space-y-3 text-sm text-muted-foreground'>
                <p>
                  <span className='font-semibold text-foreground'>Quantity:</span> {inventory.quantity}{" "}
                  {inventory.unitLabel}
                </p>
                {inventory.restockDate ? (
                  <p>
                    <span className='font-semibold text-foreground'>Next restock:</span>{" "}
                    {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
                      new Date(inventory.restockDate)
                    )}
                  </p>
                ) : null}
                <p className='text-xs text-muted-foreground'>
                  Status updates here fan out to personalization + admin workspaces instantly.
                </p>
              </div>
            ) : (
              <p className='mt-3 text-sm text-muted-foreground'>Inventory record not attached yet.</p>
            )}
          </div>

          <div className='rounded-2xl border border-border bg-card p-6 shadow-sm'>
            <p className='text-[10px] font-bold uppercase tracking-wider text-primary'>
              Recommendation telemetry
            </p>
            <div className='mt-4 space-y-3 text-sm text-muted-foreground'>
              <p>
                <span className='font-semibold text-foreground'>Sessions served:</span>{" "}
                {recommendationStats.totalServed.toLocaleString()}
              </p>
              <p>
                <span className='font-semibold text-foreground'>Last recommended:</span> {lastRecommendedLabel}
              </p>
              <p className='text-xs text-muted-foreground'>
                Pulls from the live recommendations table so ops + analysts can cite demo usage.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

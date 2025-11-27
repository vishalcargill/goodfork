import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { RecommendationsDemo } from "@/components/recommendations/recommendations-demo";

export const metadata: Metadata = {
  title: "GoodFork | Personalized Menus",
  description:
    "Review personalized menu cards, swap insights, and live inventory signals tailored to your onboarding profile.",
};

const profileHighlights = [
  {
    label: "Active goal",
    value: "Lean muscle + metabolic reset",
  },
  {
    label: "Budget guardrail",
    value: "$12 – $15 lunch window",
  },
  {
    label: "Allergen shields",
    value: "No dairy · No soy",
  },
];

const swapInsights = [
  {
    title: "Lighter lunch swap",
    detail: "Tom Yum Grain Bowl traded for Citrus Herb Quinoa",
    metric: "-180 kcal",
  },
  {
    title: "Sodium-aware swap",
    detail: "Smoky Chickpea Wrap swapped to Charred Greens Pita",
    metric: "-480 mg sodium",
  },
  {
    title: "Budget-friendly alt",
    detail: "Golden Turmeric Salmon → Harissa Carrot Salad",
    metric: "-$2.10 per serving",
  },
];

type MenusPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MenusPage({ searchParams }: MenusPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const prefillValue = resolvedSearchParams?.prefillEmail;
  const prefillEmail = typeof prefillValue === "string" ? prefillValue : undefined;

  if (!prefillEmail) {
    redirect("/onboarding?next=/menus");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#f8fff4] via-white to-[#f2f9ef] text-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-70">
        <div className="absolute left-[5%] top-10 h-64 w-64 rounded-full bg-emerald-100 blur-[160px]" />
        <div className="absolute right-[12%] top-0 h-72 w-72 rounded-full bg-lime-200 blur-[180px]" />
        <div className="absolute bottom-[-5%] left-[30%] h-80 w-80 rounded-full bg-cyan-100 blur-[160px]" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
        <section className="space-y-6 rounded-[28px] border border-emerald-100 bg-white/90 p-8 shadow-[0_25px_80px_rgba(16,185,129,0.12)] backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Personalized session
              </span>
              <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl">
                Recommendations tuned for your current goals.
              </h1>
              <p className="max-w-2xl text-base text-slate-600">
                Inventory-aware menu cards, rationale history, and healthy swap suggestions all live here. Refresh
                onboarding whenever goals, taste, or allergens evolve.
              </p>
            </div>
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-5 text-sm text-slate-700 shadow-[0_15px_40px_rgba(16,185,129,0.12)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Signed in as</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{prefillEmail}</p>
              <p className="mt-1 text-sm text-slate-600">
                This page hydrates from your onboarding profile to keep swaps and preferences synced.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <Link
                  href="/onboarding"
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 font-semibold text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-600 hover:text-white"
                >
                  Refresh onboarding
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-2 font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:text-emerald-800"
                >
                  Back to landing
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {profileHighlights.map((highlight) => (
              <div
                key={highlight.label}
                className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 text-sm text-slate-700 shadow-inner"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">{highlight.label}</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{highlight.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-[0_20px_60px_rgba(15,118,110,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Profile snapshot</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Signals driving each recommendation</h2>
            <p className="mt-1 text-sm text-slate-600">
              Goals, allergens, budget targets, and lifestyle notes shape the scoring pipeline before AI re-ranks
              results.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-50 bg-emerald-50/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Goals + taste</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  <li>• Build lean muscle through 30g protein floor</li>
                  <li>• Favor bold spice + citrus notes for satiety</li>
                  <li>• Weekly swap prompts keep variety high</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-emerald-50 bg-emerald-50/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Constraints</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  <li>• $15 max lunch guardrail</li>
                  <li>• Strict dairy + soy allergen filters</li>
                  <li>• Prefer complex carbs for afternoon focus</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="rounded-[28px] border border-lime-100 bg-gradient-to-b from-lime-50 via-white to-white p-6 shadow-[0_20px_60px_rgba(132,169,26,0.12)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-700">Inventory pulse</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">Live kitchen feed</h3>
            <p className="mt-1 text-sm text-slate-600">
              Operators push updates every hour so cards never surface out-of-stock cravings.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-800">
              <li className="flex items-start justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Charred Greens Pita</p>
                  <p className="text-xs text-emerald-700">Ready now · Lot 238</p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">IN STOCK</span>
              </li>
              <li className="flex items-start justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Smoky Chickpea Wrap</p>
                  <p className="text-xs text-amber-700">Low stock · Prep new batch</p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">LOW STOCK</span>
              </li>
              <li className="flex items-start justify-between rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Harissa Carrot Salad</p>
                  <p className="text-xs text-rose-700">Swapped into plan</p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">SWAP READY</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="rounded-[32px] border border-emerald-100 bg-white p-6 shadow-[0_25px_70px_rgba(16,185,129,0.1)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Menus</p>
              <h2 className="text-2xl font-semibold text-slate-900">Spin up personalized cards</h2>
              <p className="text-sm text-slate-600">
                Drop the same onboarding email to fetch 3–5 recommendations with AI rationale + swap notes.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
              Live Sonner toasts highlight profile mismatches
            </span>
          </div>
          <div className="mt-8">
            <RecommendationsDemo prefillEmail={prefillEmail} />
          </div>
        </section>

        <section className="rounded-[28px] border border-emerald-100 bg-white/90 p-6 shadow-[0_25px_65px_rgba(16,185,129,0.08)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Swap insights</p>
              <h2 className="text-2xl font-semibold text-slate-900">Healthy nudges ready when feedback lands</h2>
              <p className="mt-1 text-sm text-slate-600">
                Every swap request logs rationale + macro impact so operators and AI keep personalization sharp.
              </p>
            </div>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-600 hover:text-white"
            >
              Refine preferences
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {swapInsights.map((insight) => (
              <article key={insight.title} className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">{insight.metric}</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{insight.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{insight.detail}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

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
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-80">
        <div className="absolute left-[5%] top-5 h-72 w-72 rounded-full bg-emerald-500/20 blur-[120px]" />
        <div className="absolute right-[15%] top-0 h-80 w-80 rounded-full bg-lime-400/20 blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[35%] h-96 w-96 rounded-full bg-cyan-500/20 blur-[150px]" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
        <section className="space-y-6 rounded-[28px] border border-white/10 bg-slate-900/70 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.55)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                Personalized session
              </span>
              <h1 className="text-4xl font-semibold text-white sm:text-5xl">
                Recommendations tuned for your current goals.
              </h1>
              <p className="max-w-2xl text-base text-slate-200">
                Inventory-aware menu cards, rationale history, and healthy swap suggestions all live here.
                Refresh onboarding whenever goals, taste, or allergens evolve.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                Signed in as
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{prefillEmail}</p>
              <p className="mt-1 text-sm text-slate-300">
                This page hydrates from your onboarding profile to keep swaps and preferences synced.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <Link
                  href="/onboarding"
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 px-4 py-2 font-semibold text-emerald-100 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-white"
                >
                  Refresh onboarding
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 font-semibold text-slate-200 transition hover:-translate-y-0.5 hover:border-white/30 hover:text-white"
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
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{highlight.label}</p>
                <p className="mt-2 text-base font-semibold text-white">{highlight.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Profile snapshot
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Signals driving each recommendation</h2>
            <p className="mt-1 text-sm text-slate-300">
              Goals, allergens, budget targets, and lifestyle notes shape the scoring pipeline before AI re-ranks results.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Goals + taste
                </p>
                <ul className="mt-3 space-y-2 text-sm text-slate-200">
                  <li>• Build lean muscle through 30g protein floor</li>
                  <li>• Favor bold spice + citrus notes for satiety</li>
                  <li>• Weekly swap prompts keep variety high</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Constraints</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-200">
                  <li>• $15 max lunch guardrail</li>
                  <li>• Strict dairy + soy allergen filters</li>
                  <li>• Prefer complex carbs for afternoon focus</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/10 to-slate-950/40 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Inventory pulse</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Live kitchen feed</h3>
            <p className="mt-1 text-sm text-slate-300">
              Operators push updates every hour so cards never surface out-of-stock cravings.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-100">
              <li className="flex items-start justify-between rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-white">Charred Greens Pita</p>
                  <p className="text-xs text-emerald-100">Ready now · Lot 238</p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                  IN STOCK
                </span>
              </li>
              <li className="flex items-start justify-between rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-white">Smoky Chickpea Wrap</p>
                  <p className="text-xs text-amber-100">Low stock · Prep new batch</p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
                  LOW STOCK
                </span>
              </li>
              <li className="flex items-start justify-between rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-white">Harissa Carrot Salad</p>
                  <p className="text-xs text-rose-100">Swapped into plan</p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-100">
                  SWAP READY
                </span>
              </li>
            </ul>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_30px_70px_rgba(15,23,42,0.45)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Menus</p>
              <h2 className="text-2xl font-semibold text-white">Spin up personalized cards</h2>
              <p className="text-sm text-slate-300">
                Drop the same onboarding email to fetch 3–5 recommendations with AI rationale + swap notes.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-100">
              Live Sonner toasts highlight profile mismatches
            </span>
          </div>
          <div className="mt-8">
            <RecommendationsDemo prefillEmail={prefillEmail} />
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-gradient-to-r from-slate-900/80 to-slate-900/40 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Swap insights
              </p>
              <h2 className="text-2xl font-semibold text-white">Healthy nudges ready when feedback lands</h2>
              <p className="mt-1 text-sm text-slate-300">
                Every swap request logs rationale + macro impact so operators and AI keep personalization sharp.
              </p>
            </div>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/40"
            >
              Refine preferences
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {swapInsights.map((insight) => (
              <article key={insight.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {insight.metric}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">{insight.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{insight.detail}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

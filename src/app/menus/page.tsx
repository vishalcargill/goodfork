import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { RecommendationsDemo } from "@/components/recommendations/recommendations-demo";

export const metadata: Metadata = {
  title: "GoodFork | Personalized Menus",
  description:
    "Review personalized menu cards, swap insights, and live inventory signals tailored to your onboarding profile.",
};

const sessionHighlights = [
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

const kitchenPulse = [
  {
    title: "Charred Greens Pita",
    meta: "Ready now · Lot 238",
    badge: "IN STOCK",
    tone: "text-emerald-700 border-emerald-200 bg-emerald-50",
  },
  {
    title: "Smoky Chickpea Wrap",
    meta: "Low stock · Prep batch",
    badge: "LOW STOCK",
    tone: "text-amber-700 border-amber-200 bg-amber-50",
  },
  {
    title: "Harissa Carrot Salad",
    meta: "Swap locked for sodium cut",
    badge: "SWAP READY",
    tone: "text-emerald-800 border-emerald-200 bg-emerald-50",
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
    <div className="relative min-h-screen bg-[#f6fff4] text-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-70">
        <div className="absolute left-[5%] top-10 h-64 w-64 rounded-full bg-emerald-100 blur-[160px]" />
        <div className="absolute right-[12%] top-0 h-72 w-72 rounded-full bg-lime-200 blur-[180px]" />
        <div className="absolute bottom-[-5%] left-[30%] h-80 w-80 rounded-full bg-cyan-100 blur-[160px]" />
      </div>

      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
        <header className="space-y-6 rounded-[28px] border border-emerald-100 bg-white/95 p-6 shadow-[0_18px_60px_rgba(16,185,129,0.12)] backdrop-blur">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Session ready
            </span>
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Menus tuned to your saved profile.</h1>
            <p className="text-sm text-slate-600 sm:text-base">
              We hydrate this workspace directly from onboarding so recommendations, swaps, and inventory context stay
              in sync. Keep mobile in mind—everything stacks cleanly from 360px upward.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {sessionHighlights.map((highlight) => (
              <div
                key={highlight.label}
                className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-slate-700"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
                  {highlight.label}
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900">{highlight.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-emerald-100 bg-white/80 p-5 text-sm shadow-[0_12px_38px_rgba(16,185,129,0.15)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600">Signed in as</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{prefillEmail}</p>
              <p className="mt-1 text-sm text-slate-600">
                Update onboarding anytime to nudge macros, allergens, or budget. Toasts confirm any profile gap.
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
            <div className="rounded-3xl border border-emerald-100 bg-gradient-to-b from-lime-50 to-white p-5 shadow-[0_12px_38px_rgba(132,169,26,0.12)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lime-700">Kitchen pulse</p>
              <p className="mt-2 text-base font-semibold text-slate-900">Inventory signals live-sync here.</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                {kitchenPulse.map((item) => (
                  <li key={item.title} className="rounded-2xl border px-4 py-3" data-status={item.badge}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900">{item.title}</span>
                      <span
                        className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${item.tone}`}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{item.meta}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </header>

        <section className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-[0_20px_60px_rgba(16,185,129,0.12)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600">Menus</p>
              <h2 className="text-2xl font-semibold text-slate-900">Review and interact with your cards</h2>
              <p className="text-sm text-slate-600">
                We cap visible cards per breakpoint to avoid four-column squish—use next and previous to explore the
                rest.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
              Sonner toasts surface profile gaps instantly
            </span>
          </div>
          <div className="mt-8">
            <RecommendationsDemo prefillEmail={prefillEmail} />
          </div>
        </section>
      </div>
    </div>
  );
}

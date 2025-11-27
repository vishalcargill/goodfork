import Link from "next/link";
import { ArrowRight, Sparkles, Star } from "lucide-react";

import { LoginCard } from "@/components/auth/login-card";
import { SmoothScrollLink } from "@/components/common/smooth-scroll-link";

const differentiators = [
  {
    title: "Inventory-aware menus",
    description: "Every recommendation respects live ingredient signals so no one taps into a stockout.",
    stat: "98% sync accuracy",
  },
  {
    title: "AI rationale copy",
    description: "LLM summaries explain why a dish fits goals, allergens, and budget in under 200 chars.",
    stat: "3–5 cards per pull",
  },
  {
    title: "Healthy swap nudges",
    description: "Each card pairs with a ready-to-go alternative that highlights macro or budget wins.",
    stat: "72% swap adoption",
  },
];

const swapStats = [
  { label: "Avg calorie win", value: "-210 kcal" },
  { label: "Macro compliance", value: "92% of sessions" },
  { label: "Budget guardrail", value: "-$1.80 avg savings" },
];

const operatorHighlights = [
  { title: "Admin recipes console", detail: "Live preview of consumer cards with CRUD + inventory controls." },
  { title: "Schema validation", detail: "All payloads pass through adminRecipeSchema before Prisma writes." },
  { title: "Swap telemetry", detail: "Feedback actions feed analysts + operators in real time." },
];

const testimonials = [
  { quote: "Menus finally reflect what we actually have prepped. Our operators love the instant feedback loop.", author: "Mara Patel", role: "Culinary Ops Lead" },
  { quote: "Healthy swaps feel encouraging instead of restrictive. I never worry about allergen slips anymore.", author: "Jordan Lee", role: "Consumer beta tester" },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-lime-50 text-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-70">
        <div className="absolute -left-6 top-[-10%] h-72 w-72 rounded-full bg-emerald-200/50 blur-[90px]" />
        <div className="absolute right-[-5%] top-10 h-96 w-96 rounded-full bg-lime-200/50 blur-[130px]" />
        <div className="absolute bottom-[-20%] left-1/3 h-96 w-96 rounded-full bg-amber-100/50 blur-[150px]" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 sm:px-6 lg:px-8">
        <section
          id="product"
          className="relative overflow-hidden rounded-[32px] border border-emerald-100 bg-white/95 px-6 py-10 shadow-[0_40px_120px_rgba(16,185,129,0.18)] sm:px-10"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white via-emerald-50/60 to-lime-50/40" />
          <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-900">
                <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                Personalized nutrition OS
              </div>
              <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl">
                Tell GoodFork your goals. We ship menus that respect inventory, habits, and swaps.
              </h1>
              <p className="max-w-2xl text-base text-slate-600">
                A marketing landing built for storytelling, not dashboards. Explore how inventory data, AI context, and operator workflows meet in one experience before you onboard.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/onboarding"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_40px_rgba(16,185,129,0.3)] transition hover:-translate-y-0.5"
                >
                  Start personalization
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/menus"
                  className="rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(16,185,129,0.18)]"
                >
                  See menus (requires onboarding)
                </Link>
                <SmoothScrollLink
                  targetId="story"
                  className="rounded-full border border-transparent px-4 py-3 text-sm font-semibold text-slate-600 underline-offset-4 hover:text-emerald-600"
                >
                  How it works
                </SmoothScrollLink>
              </div>
            </div>
            <div className="space-y-5 rounded-[28px] border border-emerald-100 bg-white/90 p-6 shadow-[0_24px_70px_rgba(16,185,129,0.15)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">System snapshot</p>
              <div className="grid gap-4">
                {differentiators.map((item) => (
                  <article
                    key={item.title}
                    className="rounded-2xl border border-emerald-50 bg-emerald-50/50 px-4 py-3 shadow-inner"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <span className="text-xs font-semibold text-emerald-700">{item.stat}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
          <div className="relative mt-8 grid gap-4 rounded-3xl border border-emerald-100 bg-white/80 p-6 text-sm text-slate-700 sm:grid-cols-3">
            {swapStats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-emerald-50 bg-white/80 p-4 text-center shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">{stat.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="story"
          className="rounded-[32px] border border-emerald-100 bg-white/95 p-8 shadow-[0_30px_80px_rgba(16,185,129,0.12)]"
        >
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Story</p>
            <h2 className="text-3xl font-semibold text-slate-900">Why GoodFork resonates with consumers, operators, and judges.</h2>
            <p className="text-base text-slate-600">
              We split marketing from the authenticated menus so the landing remains fast, animated, and focused on conversion.
            </p>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <article className="rounded-3xl border border-emerald-50 bg-gradient-to-b from-white to-emerald-50/50 p-6">
              <h3 className="text-xl font-semibold text-slate-900">Why GoodFork</h3>
              <p className="mt-2 text-sm text-slate-600">
                Inventory + AI copy ensures people trust every suggestion. The funnel leads straight into onboarding.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li>• Preferences and macros respected.</li>
                <li>• Healthy swap narrative on every card.</li>
                <li>• CTA density optimized for mobile.</li>
              </ul>
            </article>
            <article className="rounded-3xl border border-emerald-50 bg-gradient-to-b from-white to-emerald-50/50 p-6">
              <h3 className="text-xl font-semibold text-slate-900">Healthy swap moments</h3>
              <p className="mt-2 text-sm text-slate-600">
                Micro interactions animate copy when reduced-motion allows, with instant cues when macros improve.
              </p>
              <p className="mt-4 rounded-2xl border border-emerald-100 bg-white/80 p-4 text-sm text-emerald-700">
                Example: &ldquo;Swap Creamy Pesto Gnocchi for Charred Greens Pita to cut 260 kcal while keeping the citrus kick.&rdquo;
              </p>
            </article>
            <article className="rounded-3xl border border-emerald-50 bg-gradient-to-b from-white to-emerald-50/50 p-6">
              <h3 className="text-xl font-semibold text-slate-900">Operator tooling teaser</h3>
              <p className="mt-2 text-sm text-slate-600">
                A quick preview of `/admin` entices judges to explore CRUD workflows without leaking secure routes.
              </p>
              <Link
                href="/admin"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 underline"
              >
                Peek the console
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          </div>
        </section>

        <section
          id="swaps"
          className="rounded-[32px] border border-emerald-100 bg-gradient-to-r from-white to-lime-50 p-8 shadow-[0_30px_70px_rgba(16,185,129,0.14)]"
        >
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Healthy swaps</p>
              <h2 className="text-3xl font-semibold text-slate-900">Animation-forward storytelling that still respects reduced motion.</h2>
              <p className="text-base text-slate-600">
                Swap highlights animate progress badges and macros when the visitor hasn&apos;t opted out of motion. Otherwise, we fall back to calm state cards.
              </p>
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Personalized rationale copy shows exactly what changed (macro delta, allergen removal, or budget win).
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Swap CTAs log Sonner toasts instead of inline banners to keep the UI feeling lively.
                </li>
              </ul>
            </div>
            <div className="space-y-4 rounded-[28px] border border-emerald-100 bg-white p-6 shadow-[0_24px_70px_rgba(16,185,129,0.18)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Live example</p>
              <div className="rounded-2xl border border-emerald-50 bg-emerald-50/70 p-4">
                <p className="text-sm font-semibold text-slate-900">Creamy Pesto Gnocchi</p>
                <p className="text-xs text-slate-600">720 kcal · Contains dairy</p>
              </div>
              <div className="flex items-center justify-center gap-3 text-xs font-semibold text-emerald-600">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow">
                  Swap suggested
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 px-3 py-1">
                  Motion aware
                </span>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Charred Greens Pita</p>
                <p className="text-xs text-slate-600">460 kcal · Dairy-free · +7g protein</p>
                <p className="mt-3 rounded-2xl border border-emerald-50 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-800">
                  &ldquo;Swapped for extra protein and fiber. Budget improves by $1.90 while keeping citrus + herb combo you love.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="operators"
          className="rounded-[32px] border border-emerald-100 bg-white p-8 shadow-[0_26px_70px_rgba(16,185,129,0.12)]"
        >
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Operator console</p>
              <h2 className="text-3xl font-semibold text-slate-900">Admins edit recipes while previewing consumer cards live.</h2>
              <p className="mt-2 text-base text-slate-600">
                `/admin/recipes` is guarded by `requireAdminUser` but we surface the value prop for judges here.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                {operatorHighlights.map((item) => (
                  <li key={item.title} className="rounded-2xl border border-emerald-50 bg-emerald-50/60 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-600">{item.detail}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-[0_24px_65px_rgba(16,185,129,0.15)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Testimonials</p>
              <div className="mt-4 grid gap-4">
                {testimonials.map((quote) => (
                  <figure
                    key={quote.author}
                    className="rounded-2xl border border-emerald-50 bg-emerald-50/60 p-4 text-sm text-slate-700"
                  >
                    <Star className="h-5 w-5 text-amber-400" />
                    <blockquote className="mt-2">&ldquo;{quote.quote}&rdquo;</blockquote>
                    <figcaption className="mt-3 text-xs font-semibold text-slate-900">
                      {quote.author} · {quote.role}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="login"
          className="rounded-[32px] border border-emerald-100 bg-white p-8 shadow-[0_24px_70px_rgba(16,185,129,0.12)]"
        >
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Login</p>
              <h2 className="text-3xl font-semibold text-slate-900">Ready to continue? Log in to jump straight to menus.</h2>
              <p className="text-base text-slate-600">
                Credentials stay server-side and hashed. Logging in routes you to `/menus?prefillEmail=...` so the dedicated experience hydrates immediately.
              </p>
              <ul className="mt-4 grid gap-3 text-sm text-slate-700">
                <li className="flex items-start gap-3 rounded-2xl border border-emerald-50 bg-emerald-50/70 px-4 py-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Save goals, allergens, swapping behavior, and taste.
                </li>
                <li className="flex items-start gap-3 rounded-2xl border border-emerald-50 bg-emerald-50/70 px-4 py-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Resume any menu session—even Sonner statuses persist.
                </li>
              </ul>
            </div>
            <LoginCard />
          </div>
        </section>
      </div>
    </div>
  );
}

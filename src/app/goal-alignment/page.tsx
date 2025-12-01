import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Activity, ArrowUpRight, Gauge, Info, Sparkles, TrendingUp } from "lucide-react";

import { ADMIN_EMAIL } from "@/constants/app.constants";
import { GOAL_OPTIONS } from "@/constants/personalization-options";
import { getAuthenticatedUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  type GoalAlignmentBand,
  getGoalAlignmentForUser,
} from "@/services/server/goal-alignment.server";

export const metadata: Metadata = {
  title: "GoodFork | Goal Alignment",
  description: "See how your recent choices align to your primary nutrition goal.",
};

export default async function GoalAlignmentPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/onboarding?next=/goal-alignment");
  }

  if (user.email.toLowerCase() === ADMIN_EMAIL) {
    redirect("/admin");
  }

  const alignment = await getGoalAlignmentForUser(user.id);
  const goalLabel =
    alignment.goal?.label ??
    GOAL_OPTIONS.find((option) => option.value === alignment.goal?.value)?.label ??
    "Set your primary goal";

  const goalHelper = alignment.goal?.helper ?? "Update your goals to unlock precise scoring.";
  const band = deriveBand(alignment.averageScore);
  const hasSamples = alignment.sampleCount > 0;

  return (
    <div className="relative min-h-screen bg-[#f5fff3] text-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-70">
        <div className="absolute left-[8%] top-10 h-64 w-64 rounded-full bg-emerald-100 blur-[160px]" />
        <div className="absolute right-[6%] top-[-10%] h-80 w-80 rounded-full bg-lime-200 blur-[180px]" />
        <div className="absolute bottom-[-6%] left-[32%] h-80 w-80 rounded-full bg-cyan-100 blur-[170px]" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
        <header className="rounded-[28px] border border-emerald-100 bg-white/95 p-6 shadow-[0_20px_60px_rgba(16,185,129,0.12)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Goal alignment</p>
          <div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
                How closely your meals match <span className="text-emerald-700">{goalLabel.toLowerCase()}</span>
              </h1>
              <p className="max-w-2xl text-sm text-slate-600">
                We score your recent accepted or saved menus against your primary goal, flagging wins and gaps. Keep picking aligned dishes to lift your score.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                  <Gauge className="h-4 w-4" />
                  Score updates with every accept/save
                </div>
                {alignment.usedFallbackData ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                    <Info className="h-4 w-4" />
                    Showing latest menus until feedback arrives
                  </div>
                ) : null}
              </div>
            </div>
            <Link
              href="/personalization"
              className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(16,185,129,0.16)]"
            >
              Adjust goals
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        {!alignment.goal ? (
          <EmptyGoalState />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <AlignmentGaugeCard score={alignment.averageScore} band={band} sampleCount={alignment.sampleCount} goalHelper={goalHelper} />
              <MacroAveragesCard macroAverages={alignment.macroAverages} />
            </div>
            <div className="rounded-[28px] border border-emerald-100 bg-white/90 p-6 shadow-[0_18px_50px_rgba(16,185,129,0.14)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">Alignment breakdown</p>
                  <p className="text-sm text-slate-600">Based on your latest accepted/saved menus.</p>
                </div>
                <div className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                  {alignment.sampleCount} meals
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <BreakdownPill label="Aligned" value={alignment.alignedCount} tone="aligned" />
                <BreakdownPill label="Needs nudge" value={alignment.needsNudgeCount} tone="needs_nudge" />
                <BreakdownPill label="Off track" value={alignment.offTrackCount} tone="off_track" />
              </div>
              <div className="mt-6 space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-slate-700">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">How to improve</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>Favor dishes tagged for your goal and check macro badges before accepting.</li>
                  <li>Use healthy swaps when a meal is outside your carb/protein window.</li>
                  <li>Keep logging feedback—scores update as soon as you save or accept.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {alignment.goal && (
          <div className="rounded-[28px] border border-emerald-100 bg-white/90 p-6 shadow-[0_18px_50px_rgba(16,185,129,0.14)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">Recent meals</p>
                <p className="text-sm text-slate-600">Latest items influencing your alignment score.</p>
              </div>
              {alignment.usedFallbackData ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                  <Info className="h-4 w-4" />
                  No feedback yet—using recent menus
                </span>
              ) : null}
            </div>
            {hasSamples ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {alignment.samples.map((sample) => (
                  <article
                    key={sample.id}
                    className="flex flex-col gap-3 rounded-3xl border border-emerald-100 bg-white/95 p-4 shadow-[0_12px_32px_rgba(16,185,129,0.12)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <Link
                          href={`/recipes/${sample.recipeSlug}`}
                          className="text-base font-semibold text-slate-900 underline decoration-emerald-200 underline-offset-4 transition hover:text-emerald-700"
                        >
                          {sample.recipeTitle}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {formatDate(sample.createdAt)} · {sample.macrosLabel || "Macros pending"}
                        </p>
                      </div>
                      <BandBadge band={sample.band} score={sample.score} />
                    </div>
                    <p className="text-sm text-slate-700">{sample.note}</p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <StatusBadge status={sample.status} />
                      {sample.macrosLabel ? (
                        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-emerald-800">
                          {sample.macrosLabel}
                        </span>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptySamplesState />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function deriveBand(score: number): GoalAlignmentBand {
  if (score >= 80) return "aligned";
  if (score >= 60) return "needs_nudge";
  return "off_track";
}

type AlignmentGaugeCardProps = {
  score: number;
  band: GoalAlignmentBand;
  sampleCount: number;
  goalHelper: string;
};

function AlignmentGaugeCard({ score, band, sampleCount, goalHelper }: AlignmentGaugeCardProps) {
  const dial = Math.min(Math.max(score, 0), 100);
  const gradient = `conic-gradient(#10b981 ${dial}%, #e2e8f0 ${dial}% 100%)`;
  const theme = bandTheme[band];

  return (
    <div className="rounded-[28px] border border-emerald-100 bg-white/95 p-6 shadow-[0_18px_50px_rgba(16,185,129,0.14)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">Alignment score</p>
          <p className="text-sm text-slate-600">Averages your last {sampleCount || "few"} logged meals.</p>
        </div>
        <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold", theme.pill)}>
          <Sparkles className="h-4 w-4" />
          {theme.label}
        </span>
      </div>
      <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_1.2fr] sm:items-center">
        <div className="flex justify-center">
          <div
            className="relative flex h-48 w-48 items-center justify-center rounded-full bg-slate-100"
            aria-label={`Alignment score ${score}`}
          >
            <div className="absolute inset-1 rounded-full" style={{ background: gradient }} />
            <div className="absolute inset-4 rounded-full bg-white" />
            <div className="relative z-10 text-center">
              <p className="text-4xl font-semibold text-slate-900">{dial}</p>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">/100</p>
              <p className="mt-2 text-xs text-slate-500">{theme.label}</p>
            </div>
          </div>
        </div>
        <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-slate-700">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
            <TrendingUp className="h-4 w-4" />
            Guidance
          </div>
          <p>{goalHelper}</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Score <span className="font-semibold text-emerald-800">80+</span>: strongly aligned.</li>
            <li><span className="font-semibold text-amber-700">60–79</span>: close—use swaps or side tweaks.</li>
            <li><span className="font-semibold text-rose-700">0–59</span>: off-track—pick another option.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

type BreakdownPillProps = {
  label: string;
  value: number;
  tone: GoalAlignmentBand;
};

function BreakdownPill({ label, value, tone }: BreakdownPillProps) {
  const theme = bandTheme[tone];
  return (
    <div className={cn("rounded-2xl border px-4 py-3 text-sm font-semibold shadow-inner", theme.card)}>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-1 text-2xl text-slate-900">{value}</p>
    </div>
  );
}

type MacroAveragesCardProps = {
  macroAverages: {
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
  };
};

function MacroAveragesCard({ macroAverages }: MacroAveragesCardProps) {
  const entries = [
    { label: "Calories", value: macroAverages.calories ? `${macroAverages.calories} kcal` : "—" },
    { label: "Protein", value: macroAverages.protein ? `${macroAverages.protein} g` : "—" },
    { label: "Carbs", value: macroAverages.carbs ? `${macroAverages.carbs} g` : "—" },
    { label: "Fats", value: macroAverages.fat ? `${macroAverages.fat} g` : "—" },
  ];

  return (
    <div className="rounded-[28px] border border-emerald-100 bg-white/95 p-6 shadow-[0_18px_50px_rgba(16,185,129,0.14)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">Macro averages</p>
          <p className="text-sm text-slate-600">Rolling averages across your scored meals.</p>
        </div>
        <div className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
          Balanced view
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {entries.map((entry) => (
          <div
            key={entry.label}
            className="rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-sm text-slate-700 shadow-inner shadow-emerald-50/70"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">{entry.label}</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{entry.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

type BandBadgeProps = {
  band: GoalAlignmentBand;
  score: number;
};

function BandBadge({ band, score }: BandBadgeProps) {
  const theme = bandTheme[band];
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold", theme.pill)}>
      <Sparkles className="h-4 w-4" />
      {theme.label} · {score}
    </span>
  );
}

type StatusBadgeProps = {
  status: string;
};

function StatusBadge({ status }: StatusBadgeProps) {
  const labelMap: Record<string, { label: string; className: string }> = {
    ACCEPTED: { label: "Accepted", className: "border-emerald-200 bg-emerald-50 text-emerald-800" },
    SAVED: { label: "Saved", className: "border-slate-200 bg-slate-50 text-slate-700" },
    SWAPPED: { label: "Swapped", className: "border-amber-200 bg-amber-50 text-amber-800" },
    SHOWN: { label: "Previewed", className: "border-slate-200 bg-white text-slate-700" },
  };

  const theme = labelMap[status] ?? labelMap.SHOWN;

  return <span className={cn("rounded-full border px-2 py-1", theme.className)}>{theme.label}</span>;
}

const bandTheme: Record<
  GoalAlignmentBand,
  { label: string; pill: string; card: string }
> = {
  aligned: {
    label: "Aligned",
    pill: "border-emerald-200 bg-emerald-50 text-emerald-800",
    card: "border-emerald-100 bg-emerald-50/60 text-emerald-800",
  },
  needs_nudge: {
    label: "Needs nudge",
    pill: "border-amber-200 bg-amber-50 text-amber-900",
    card: "border-amber-100 bg-amber-50/60 text-amber-900",
  },
  off_track: {
    label: "Off track",
    pill: "border-rose-200 bg-rose-50 text-rose-800",
    card: "border-rose-100 bg-rose-50/70 text-rose-800",
  },
};

function EmptyGoalState() {
  return (
    <div className="rounded-[28px] border border-emerald-100 bg-white/90 p-6 text-sm text-slate-700 shadow-[0_18px_50px_rgba(16,185,129,0.14)]">
      <div className="flex items-start gap-3">
        <Activity className="mt-1 h-5 w-5 text-emerald-500" aria-hidden="true" />
        <div className="space-y-2">
          <p className="text-base font-semibold text-slate-900">Pick a primary goal to start tracking alignment.</p>
          <p>Once you save a goal in personalization and accept or save a few menus, we will compute your alignment score.</p>
          <Link
            href="/personalization"
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(16,185,129,0.14)]"
          >
            Go to personalization
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function EmptySamplesState() {
  return (
    <div className="mt-4 flex flex-col gap-3 rounded-3xl border border-dashed border-emerald-200 bg-white p-6 text-sm text-slate-600">
      <Info className="h-5 w-5 text-emerald-500" aria-hidden="true" />
      <p className="font-semibold text-slate-900">No meals logged yet.</p>
      <p>Accept or save a couple of menu cards to see how they align to your goals.</p>
      <Link
        href="/menus"
        className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(16,185,129,0.14)]"
      >
        View menus
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(value);
}

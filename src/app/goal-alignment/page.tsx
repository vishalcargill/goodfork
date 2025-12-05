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
    <div className='space-y-8 pb-8'>
      <header className='rounded-xl border border-border bg-card p-6 shadow-sm'>
        <p className='text-xs font-bold uppercase tracking-wider text-primary'>Goal alignment</p>
        <div className='mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-start'>
          <div className='space-y-3'>
            <h1 className='text-3xl font-bold text-foreground sm:text-4xl'>
              How closely your meals match <span className='text-primary'>{goalLabel.toLowerCase()}</span>
            </h1>
            <p className='max-w-2xl text-sm text-muted-foreground'>
              We score your recent accepted or saved menus against your primary goal, flagging wins and gaps. Keep picking aligned dishes to lift your score.
            </p>
            <div className='flex flex-wrap items-center gap-3 text-sm text-muted-foreground'>
              <div className='inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground'>
                <Gauge className='h-4 w-4' />
                Score updates with every accept/save
              </div>
              {alignment.usedFallbackData ? (
                <div className='inline-flex items-center gap-2 rounded-full border border-warning/20 bg-warning/10 px-3 py-1 text-xs font-semibold text-warning-foreground'>
                  <Info className='h-4 w-4' />
                  Showing latest menus until feedback arrives
                </div>
              ) : null}
            </div>
          </div>
          <Link
            href='/personalization'
            className='inline-flex items-center gap-2 self-start rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:bg-surface-subtle'
          >
            Adjust goals
            <ArrowUpRight className='h-4 w-4' />
          </Link>
        </div>
      </header>

      {!alignment.goal ? (
        <EmptyGoalState />
      ) : (
        <div className='grid gap-6 lg:grid-cols-[1.1fr_0.9fr]'>
          <div className='space-y-6'>
            <AlignmentGaugeCard score={alignment.averageScore} band={band} sampleCount={alignment.sampleCount} goalHelper={goalHelper} />
            <MacroAveragesCard macroAverages={alignment.macroAverages} />
          </div>
          <div className='rounded-xl border border-border bg-card p-6 shadow-sm'>
            <div className='flex items-center justify-between gap-3'>
              <div>
                <p className='text-[10px] font-bold uppercase tracking-wider text-primary'>Alignment breakdown</p>
                <p className='text-sm text-muted-foreground'>Based on your latest accepted/saved menus.</p>
              </div>
              <div className='rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground'>
                {alignment.sampleCount} meals
              </div>
            </div>
            <div className='mt-4 grid gap-3 sm:grid-cols-3'>
              <BreakdownPill label='Aligned' value={alignment.alignedCount} tone='aligned' />
              <BreakdownPill label='Needs nudge' value={alignment.needsNudgeCount} tone='needs_nudge' />
              <BreakdownPill label='Off track' value={alignment.offTrackCount} tone='off_track' />
            </div>
            <div className='mt-6 space-y-3 rounded-lg border border-border bg-surface-subtle p-4 text-sm text-foreground'>
              <p className='text-[10px] font-bold uppercase tracking-wider text-primary'>How to improve</p>
              <ul className='list-disc space-y-1 pl-5 text-muted-foreground'>
                <li>Favor dishes tagged for your goal and check macro badges before accepting.</li>
                <li>Use healthy swaps when a meal is outside your carb/protein window.</li>
                <li>Keep logging feedback—scores update as soon as you save or accept.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {alignment.goal && (
        <div className='rounded-xl border border-border bg-card p-6 shadow-sm'>
          <div className='flex items-center justify-between gap-3'>
            <div>
              <p className='text-[10px] font-bold uppercase tracking-wider text-primary'>Recent meals</p>
              <p className='text-sm text-muted-foreground'>Latest items influencing your alignment score.</p>
            </div>
            {alignment.usedFallbackData ? (
              <span className='inline-flex items-center gap-2 rounded-full border border-warning/20 bg-warning/10 px-3 py-1 text-xs font-semibold text-warning-foreground'>
                <Info className='h-4 w-4' />
                No feedback yet—using recent menus
              </span>
            ) : null}
          </div>
          {hasSamples ? (
            <div className='mt-4 grid gap-4 md:grid-cols-2'>
              {alignment.samples.map((sample) => (
                <article
                  key={sample.id}
                  className='flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm'
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='space-y-1'>
                      <Link
                        href={`/recipes/${sample.recipeSlug}`}
                        className='text-base font-semibold text-foreground underline decoration-primary/30 underline-offset-4 transition hover:text-primary'
                      >
                        {sample.recipeTitle}
                      </Link>
                      <p className='text-xs text-muted-foreground'>
                        {formatDate(sample.createdAt)} · {sample.macrosLabel || "Macros pending"}
                      </p>
                    </div>
                    <BandBadge band={sample.band} score={sample.score} />
                  </div>
                  <p className='text-sm text-muted-foreground'>{sample.note}</p>
                  <div className='flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
                    <StatusBadge status={sample.status} />
                    {sample.macrosLabel ? (
                      <span className='rounded-full border border-border bg-surface-subtle px-2 py-1 text-foreground'>
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
  // Using token colors directly would be ideal but gradients need hex or var() which works.
  // var(--primary) is set in globals.css
  const gradient = `conic-gradient(var(--primary) ${dial}%, var(--border) ${dial}% 100%)`;
  const theme = bandTheme[band];

  return (
    <div className='rounded-xl border border-border bg-card p-6 shadow-sm'>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <p className='text-[10px] font-bold uppercase tracking-wider text-primary'>Alignment score</p>
          <p className='text-sm text-muted-foreground'>Averages your last {sampleCount || "few"} logged meals.</p>
        </div>
        <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold", theme.pill)}>
          <Sparkles className='h-4 w-4' />
          {theme.label}
        </span>
      </div>
      <div className='mt-6 grid gap-6 sm:grid-cols-[1fr_1.2fr] sm:items-center'>
        <div className='flex justify-center'>
          <div
            className='relative flex h-48 w-48 items-center justify-center rounded-full bg-surface-subtle'
            aria-label={`Alignment score ${score}`}
          >
            <div className='absolute inset-1 rounded-full' style={{ background: gradient }} />
            <div className='absolute inset-4 rounded-full bg-card' />
            <div className='relative z-10 text-center'>
              <p className='text-4xl font-bold text-foreground'>{dial}</p>
              <p className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>/100</p>
              <p className='mt-2 text-xs text-muted-foreground'>{theme.label}</p>
            </div>
          </div>
        </div>
        <div className='space-y-3 rounded-lg border border-border bg-surface-subtle p-4 text-sm text-foreground'>
          <div className='flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-primary'>
            <TrendingUp className='h-4 w-4' />
            Guidance
          </div>
          <p>{goalHelper}</p>
          <ul className='list-disc space-y-1 pl-5 text-muted-foreground'>
            <li>Score <span className='font-semibold text-success'>80+</span>: strongly aligned.</li>
            <li><span className='font-semibold text-warning'>60–79</span>: close—use swaps or side tweaks.</li>
            <li><span className='font-semibold text-destructive'>0–59</span>: off-track—pick another option.</li>
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
    <div className={cn("rounded-lg border px-4 py-3 text-sm font-semibold shadow-sm", theme.card)}>
      <p className='text-xs uppercase tracking-wider opacity-70'>{label}</p>
      <p className='mt-1 text-2xl font-bold'>{value}</p>
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
    <div className='rounded-xl border border-border bg-card p-6 shadow-sm'>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <p className='text-[10px] font-bold uppercase tracking-wider text-primary'>Macro averages</p>
          <p className='text-sm text-muted-foreground'>Rolling averages across your scored meals.</p>
        </div>
        <div className='rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground'>
          Balanced view
        </div>
      </div>
      <div className='mt-5 grid gap-3 sm:grid-cols-2'>
        {entries.map((entry) => (
          <div
            key={entry.label}
            className='rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm'
          >
            <p className='text-[10px] font-bold uppercase tracking-wider text-primary'>{entry.label}</p>
            <p className='mt-1 text-lg font-semibold'>{entry.value}</p>
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
    <span className={cn("inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs font-semibold", theme.pill)}>
      <Sparkles className='h-4 w-4' />
      {theme.label} · {score}
    </span>
  );
}

type StatusBadgeProps = {
  status: string;
};

function StatusBadge({ status }: StatusBadgeProps) {
  const labelMap: Record<string, { label: string; className: string }> = {
    ACCEPTED: { label: "Accepted", className: "border-success/20 bg-success/10 text-success" },
    SAVED: { label: "Saved", className: "border-border bg-surface text-muted-foreground" },
    SWAPPED: { label: "Swapped", className: "border-warning/20 bg-warning/10 text-warning-foreground" },
    SHOWN: { label: "Previewed", className: "border-border bg-surface text-muted-foreground" },
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
    pill: "border-success/20 bg-success/10 text-success",
    card: "border-success/20 bg-success/5 text-success",
  },
  needs_nudge: {
    label: "Needs nudge",
    pill: "border-warning/20 bg-warning/10 text-warning-foreground",
    card: "border-warning/20 bg-warning/5 text-warning-foreground",
  },
  off_track: {
    label: "Off track",
    pill: "border-destructive/20 bg-destructive/10 text-destructive",
    card: "border-destructive/20 bg-destructive/5 text-destructive",
  },
};

function EmptyGoalState() {
  return (
    <div className='rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm'>
      <div className='flex items-start gap-3'>
        <Activity className='mt-1 h-5 w-5 text-primary' aria-hidden='true' />
        <div className='space-y-2'>
          <p className='text-base font-semibold text-foreground'>Pick a primary goal to start tracking alignment.</p>
          <p>Once you save a goal in personalization and accept or save a few menus, we will compute your alignment score.</p>
          <Link
            href='/personalization'
            className='inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-subtle'
          >
            Go to personalization
            <ArrowUpRight className='h-4 w-4' />
          </Link>
        </div>
      </div>
    </div>
  );
}

function EmptySamplesState() {
  return (
    <div className='mt-4 flex flex-col gap-3 rounded-xl border border-dashed border-border bg-surface p-6 text-sm text-muted-foreground'>
      <Info className='h-5 w-5 text-primary' aria-hidden='true' />
      <p className='font-semibold text-foreground'>No meals logged yet.</p>
      <p>Accept or save a couple of menu cards to see how they align to your goals.</p>
      <Link
        href='/menus'
        className='inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-subtle'
      >
        View menus
        <ArrowUpRight className='h-4 w-4' />
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

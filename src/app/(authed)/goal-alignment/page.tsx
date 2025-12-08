import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Flame,
  Info,
  Sparkles,
  Target,
  TrendingUp,
  Utensils,
  Zap,
} from "lucide-react";

import { ADMIN_EMAIL } from "@/constants/app.constants";
import { GOAL_OPTIONS } from "@/constants/personalization-options";
import { getAuthenticatedUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { type GoalAlignmentBand, getGoalAlignmentForUser } from "@/services/server/goal-alignment.server";

export const metadata: Metadata = {
  title: "GoodFork | Goal Alignment",
  description: "See how your recent choices align to your primary nutrition goal.",
};

// --- Shared Card Patterns ---
const CARD_SHELL = "rounded-xl border border-border bg-card shadow-soft transition-all duration-200";
const ELEVATED_CARD = "hover:shadow-medium hover:-translate-y-0.5";
const HERO_CARD = "rounded-2xl border border-border-subtle bg-surface shadow-medium ring-1 ring-border-subtle/50";

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
    <div className='min-h-screen bg-muted pb-12'>
      <div className='container mx-auto max-w-5xl space-y-8 p-4 sm:p-6'>
        {/* Hero Section - Elevated Card */}
        <div className={cn(HERO_CARD, "relative overflow-hidden mt-2")}>
          {/* Subtle Gradient Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--surface),var(--surface-subtle))] opacity-50" />
          
          <div className='relative p-6 md:p-8'>
            <div className='flex flex-col gap-6 md:flex-row md:items-start md:justify-between'>
              <div className='space-y-4'>
                <div className='flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground'>
                  <Target className='h-4 w-4 text-primary' />
                  <span>Goal Alignment</span>
                </div>
                <div className='space-y-2'>
                  <h1 className='text-3xl font-bold tracking-tight text-foreground sm:text-4xl'>
                    Tracking against <br className='hidden sm:block' />
                    <span className='text-primary'>{goalLabel}</span>
                  </h1>
                  <p className='max-w-xl text-base text-muted-foreground'>
                    We score your recent accepted or saved menus against your primary goal. Keep picking aligned dishes to
                    lift your score.
                  </p>
                </div>

                <div className='flex flex-wrap items-center gap-3 pt-2'>
                  <div className='inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-surface-subtle'>
                    <Activity className='h-3.5 w-3.5 text-primary' />
                    Updates on accept/save
                  </div>
                  {alignment.usedFallbackData && (
                    <div className='inline-flex items-center gap-2 rounded-full border border-warning/20 bg-warning/10 px-3 py-1 text-xs text-black font-semibold'>
                      <Info className='h-3.5 w-3.5' />
                      Using recent history
                    </div>
                  )}
                </div>
              </div>

              <Link
                href='/personalization'
                className='group inline-flex items-center gap-2 self-start rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-strong active:scale-95'
              >
                Adjust goals
                <ArrowUpRight className='h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5' />
              </Link>
            </div>
          </div>
        </div>

        {!alignment.goal ? (
          <EmptyGoalState />
        ) : (
          <>
            {/* Macro Stat Strip - Bento Grid */}
            <MacroStatsStrip macroAverages={alignment.macroAverages} />

            {/* Main Dashboard Grid */}
            <div className='grid gap-6 lg:grid-cols-2'>
              {/* Left Column: Score Gauge */}
              <AlignmentGaugeCard
                score={alignment.averageScore}
                band={band}
                sampleCount={alignment.sampleCount}
                goalHelper={goalHelper}
              />

              {/* Right Column: Breakdown */}
              <div className='flex flex-col gap-6'>
                <div className={cn(CARD_SHELL, "p-6")}>
                  <div className='mb-4 flex items-center justify-between'>
                    <h3 className='flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground'>
                      <TrendingUp className='h-4 w-4 text-primary' />
                      Breakdown
                    </h3>
                    <span className='text-xs text-muted-foreground'>Last {alignment.sampleCount} meals</span>
                  </div>

                  <div className='grid gap-3 sm:grid-cols-3'>
                    <BreakdownPill label='Aligned' value={alignment.alignedCount} tone='aligned' />
                    <BreakdownPill label='Needs nudge' value={alignment.needsNudgeCount} tone='needs_nudge' />
                    <BreakdownPill label='Off track' value={alignment.offTrackCount} tone='off_track' />
                  </div>

                  <div className='mt-6 rounded-lg border border-border bg-surface-subtle p-4'>
                    <h4 className='mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                      How to improve
                    </h4>
                    <ul className='space-y-2 text-sm text-muted-foreground'>
                      <li className='flex items-start gap-2'>
                        <Check className='mt-0.5 h-4 w-4 shrink-0 text-primary' />
                        <span>
                          Favor dishes tagged for <strong>{goalLabel.toLowerCase()}</strong>.
                        </span>
                      </li>
                      <li className='flex items-start gap-2'>
                        <Check className='mt-0.5 h-4 w-4 shrink-0 text-primary' />
                        <span>Check macro badges before accepting.</span>
                      </li>
                      <li className='flex items-start gap-2'>
                        <Check className='mt-0.5 h-4 w-4 shrink-0 text-primary' />
                        <span>
                          Use <strong>healthy swaps</strong> when off-track.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Meals Section */}
            <div className='space-y-4'>
              <div className='flex items-center justify-between px-1'>
                <h3 className='text-lg font-bold text-foreground'>Recent Meals</h3>
                {alignment.usedFallbackData && (
                  <span className='hidden text-xs text-muted-foreground sm:inline-block'>
                    * Showing latest menus until feedback arrives
                  </span>
                )}
              </div>

              {hasSamples ? (
                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                  {alignment.samples.map((sample) => (
                    <MealCard key={sample.id} sample={sample} />
                  ))}
                </div>
              ) : (
                <EmptySamplesState />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// --- Helpers & Components ---

function deriveBand(score: number): GoalAlignmentBand {
  if (score >= 80) return "aligned";
  if (score >= 60) return "needs_nudge";
  return "off_track";
}

const bandConfig: Record<
  GoalAlignmentBand,
  { label: string; color: string; bg: string; icon: React.ReactNode; border: string; ring: string }
> = {
  aligned: {
    label: "Aligned",
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/20",
    ring: "ring-success/20",
    icon: <CheckCircle2 className='h-4 w-4' />,
  },
  needs_nudge: {
    label: "Needs Nudge",
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/20",
    ring: "ring-warning/20",
    icon: <AlertTriangle className='h-4 w-4' />,
  },
  off_track: {
    label: "Off Track",
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/20",
    ring: "ring-destructive/20",
    icon: <AlertCircle className='h-4 w-4' />,
  },
};

function AlignmentGaugeCard({
  score,
  band,
  sampleCount,
  goalHelper,
}: {
  score: number;
  band: GoalAlignmentBand;
  sampleCount: number;
  goalHelper: string;
}) {
  const dial = Math.min(Math.max(score, 0), 100);
  const theme = bandConfig[band];

  // Conic gradient for the gauge
  const gradient = `conic-gradient(currentColor ${dial}%, transparent ${dial}% 100%)`;

  return (
    <div className={cn(CARD_SHELL, "flex flex-col justify-between p-6")}>
      <div className='flex items-start justify-between'>
        <div>
          <h3 className='flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground'>
            <Sparkles className='h-4 w-4 text-primary' />
            Score
          </h3>
          <p className='mt-1 text-sm text-muted-foreground'>Average of last {sampleCount} meals</p>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors",
            theme.bg,
            theme.color,
            theme.border
          )}
        >
          {theme.icon}
          {theme.label}
        </div>
      </div>

      <div className='my-8 flex justify-center'>
        <div
          className={cn(
            "relative flex h-56 w-56 items-center justify-center rounded-full bg-surface-subtle shadow-inner ring-1 ring-black/5",
            theme.color
          )}
          aria-label={`Alignment score ${score} out of 100`}
        >
          {/* Outer Glow Ring */}
          <div className="absolute -inset-4 rounded-full border border-primary/5 bg-primary/5 opacity-50 blur-sm" />

          {/* Gauge Track */}
          <div className='absolute inset-0 rounded-full border-[16px] border-surface opacity-50' />

          {/* Active Gauge */}
          <div
            className='absolute inset-0 rounded-full drop-shadow-sm'
            style={{
              background: gradient,
              maskImage: "radial-gradient(transparent 62%, black 63%)",
              WebkitMaskImage: "radial-gradient(transparent 62%, black 63%)",
            }}
          />

          {/* Center Content */}
          <div className='relative z-10 flex flex-col items-center text-center'>
            <span className='text-6xl font-black tracking-tight text-foreground drop-shadow-sm'>{dial}</span>
            <span className='text-sm font-bold uppercase tracking-wider text-muted-foreground'>/ 100</span>
          </div>
        </div>
      </div>

      <div className='rounded-lg border border-border bg-surface-subtle p-4'>
        <div className='flex gap-3'>
          <Info className='mt-0.5 h-4 w-4 shrink-0 text-muted-foreground' />
          <div className='space-y-1'>
            <p className='text-sm font-medium text-foreground'>{goalHelper}</p>
            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
              <span className='font-bold text-success'>80+</span> Good
              <span>·</span>
              <span className='font-bold text-warning'>60-79</span> Fair
              <span>·</span>
              <span className='font-bold text-destructive'>&lt;60</span> Poor
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MacroStatsStrip({
  macroAverages,
}: {
  macroAverages: { calories: number | null; protein: number | null; carbs: number | null; fat: number | null };
}) {
  const stats = [
    {
      label: "Calories",
      value: macroAverages.calories ? `${macroAverages.calories}` : "—",
      unit: "kcal",
      icon: <Flame className='h-4 w-4 text-primary' />,
    },
    {
      label: "Protein",
      value: macroAverages.protein ? `${macroAverages.protein}` : "—",
      unit: "g",
      icon: <Utensils className='h-4 w-4 text-primary' />,
    },
    {
      label: "Carbs",
      value: macroAverages.carbs ? `${macroAverages.carbs}` : "—",
      unit: "g",
      icon: <Zap className='h-4 w-4 text-primary' />,
    },
    {
      label: "Fats",
      value: macroAverages.fat ? `${macroAverages.fat}` : "—",
      unit: "g",
      icon: <Activity className='h-4 w-4 text-primary' />,
    },
  ];

  return (
    <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={cn(CARD_SHELL, ELEVATED_CARD, "flex flex-col justify-between p-4")}
        >
          <div className='flex items-center gap-2 text-muted-foreground'>
            {stat.icon}
            <span className='text-xs font-bold uppercase tracking-wider'>{stat.label}</span>
          </div>
          <div className='mt-2 flex items-baseline gap-1'>
            <span className='text-2xl font-bold text-foreground'>{stat.value}</span>
            <span className='text-xs font-medium text-muted-foreground'>{stat.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function BreakdownPill({ label, value, tone }: { label: string; value: number; tone: GoalAlignmentBand }) {
  const theme = bandConfig[tone];
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        theme.border
      )}
    >
      <div
        className={cn(
          "absolute inset-0 opacity-[0.03] transition-opacity group-hover:opacity-[0.08]",
          theme.bg.replace("bg-", "bg-current text-")
        )}
      />
      {/* Top Stripe */}
      <div className={cn("absolute top-0 left-0 right-0 h-1 opacity-50", theme.bg.replace("bg-", "bg-current text-"))} />

      <div className='relative z-10'>
        <div className='flex items-center justify-between'>
          <span className={cn("text-xs font-bold uppercase tracking-wider opacity-80", theme.color)}>{label}</span>
          {theme.icon}
        </div>
        <p className='mt-2 text-3xl font-bold text-foreground'>{value}</p>
      </div>
    </div>
  );
}

function MealCard({
  sample,
}: {
  sample: {
    id: string;
    recipeSlug: string;
    recipeTitle: string;
    score: number;
    band: string;
    note: string;
    status: string;
    createdAt: Date;
    macrosLabel?: string | null;
  };
}) {
  const band = sample.band as GoalAlignmentBand;
  const theme = bandConfig[band];

  return (
    <article
      className={cn(
        CARD_SHELL,
        ELEVATED_CARD,
        "group flex flex-col justify-between overflow-hidden"
      )}
    >
      <div className='relative p-5'>
        {/* Color Stripe with fade */}
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1.5 transition-opacity opacity-60 group-hover:opacity-100",
            theme.bg.replace("bg-", "bg-current text-")
          )}
        />

        <div className='mb-3 flex items-start justify-between gap-2 pl-2'>
          <Link
            href={`/recipes/${sample.recipeSlug}`}
            className='line-clamp-1 font-semibold text-foreground decoration-primary/30 underline-offset-4 transition hover:text-primary hover:underline'
          >
            {sample.recipeTitle}
          </Link>
          <div
            className={cn(
              "shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              theme.bg,
              theme.color,
              theme.ring,
              "ring-1 ring-inset"
            )}
          >
            {sample.score}
          </div>
        </div>

        <p className='mb-4 line-clamp-2 pl-2 text-sm text-muted-foreground'>{sample.note}</p>

        <div className='flex flex-wrap items-center gap-2 pl-2'>
          <StatusBadge status={sample.status} />
          {sample.macrosLabel && (
            <span className='rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-surface-subtle border border-border-subtle'>
              {sample.macrosLabel}
            </span>
          )}
        </div>
      </div>

      <div className='border-t border-border bg-surface-subtle/30 px-5 py-3 text-xs text-muted-foreground transition-colors group-hover:bg-surface-subtle/60'>
        <div className="pl-2">
          {formatDate(sample.createdAt)}
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    ACCEPTED: "bg-success/15 text-success border-success/20",
    SAVED: "bg-secondary text-secondary-foreground border-border",
    SWAPPED: "bg-warning/15 text-warning-foreground border-warning/20",
    SHOWN: "bg-muted text-muted-foreground border-border",
  };

  const styles = config[status] || config.SHOWN;
  const label = status.charAt(0) + status.slice(1).toLowerCase();

  return (
    <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", styles)}>
      {label}
    </span>
  );
}

function EmptyGoalState() {
  return (
    <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-12 text-center shadow-sm'>
      <div className='mb-4 rounded-full bg-surface-subtle p-4'>
        <Target className='h-8 w-8 text-muted-foreground' />
      </div>
      <h3 className='text-lg font-bold text-foreground'>Set a primary goal</h3>
      <p className='mt-2 max-w-sm text-muted-foreground'>
        Pick a nutrition goal in your settings to start tracking alignment scores and receiving tailored insights.
      </p>
      <Link
        href='/personalization'
        className='mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90'
      >
        Go to personalization
        <ChevronRight className='h-4 w-4' />
      </Link>
    </div>
  );
}

function EmptySamplesState() {
  return (
    <div className='rounded-xl border border-dashed border-border bg-card p-8 text-center'>
      <p className='font-semibold text-foreground'>No meals logged yet</p>
      <p className='mt-1 text-sm text-muted-foreground'>
        Accept or save menu cards to start building your score history.
      </p>
      <Link
        href='/menus'
        className='mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline'
      >
        Browse menus
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



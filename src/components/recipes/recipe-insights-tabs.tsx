"use client";

import { useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Activity, Sparkles } from "lucide-react";

import type { NutritionEntry, RecipeInsight } from "@/services/server/recipes.server";
import { cn } from "@/lib/utils";

type RecipeInsightsTabsProps = {
  nutritionEntries: NutritionEntry[];
  aiInsights: RecipeInsight[];
};

const tabs = [
  { id: "snapshot", label: "Nutrition snapshot" },
  { id: "insights", label: "AI insights" },
];

export function RecipeInsightsTabs({ nutritionEntries, aiInsights }: RecipeInsightsTabsProps) {
  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.id ?? "snapshot");
  const idBase = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
      return;
    }

    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + direction + tabs.length) % tabs.length;
    const nextTab = tabs[nextIndex];
    setActiveTab(nextTab.id);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div className='rounded-[28px] border border-emerald-100 bg-white/80 p-6 shadow-[0_20px_60px_rgba(16,185,129,0.14)] backdrop-blur'>
      <div role='tablist' aria-label='Recipe insights tabs' className='flex flex-wrap gap-3'>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            type='button'
            id={`${idBase}-${tab.id}`}
            role='tab'
            aria-selected={activeTab === tab.id}
            aria-controls={`${idBase}-${tab.id}-panel`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onKeyDown={(event) => handleKeyDown(event, index)}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-full border px-5 py-2 text-sm font-semibold transition",
              activeTab === tab.id
                ? "border-emerald-400 bg-emerald-50 text-emerald-800 shadow-[0_12px_32px_rgba(16,185,129,0.25)]"
                : "border-slate-200 bg-white/70 text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className='mt-6'>
        {tabs.map((tab) => (
          <section
            key={tab.id}
            id={`${idBase}-${tab.id}-panel`}
            role='tabpanel'
            aria-labelledby={`${idBase}-${tab.id}`}
            hidden={activeTab !== tab.id}
            className='focus:outline-none'
          >
            {tab.id === "snapshot" ? (
              <NutritionSnapshot entries={nutritionEntries} />
            ) : (
              <InsightsPanel insights={aiInsights} />
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

type NutritionSnapshotProps = {
  entries: NutritionEntry[];
};

function NutritionSnapshot({ entries }: NutritionSnapshotProps) {
  if (!entries.length) {
    return (
      <div className='flex flex-col items-start gap-2 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-6 text-sm text-slate-600'>
        <Activity className='h-5 w-5 text-emerald-500' aria-hidden='true' />
        Operators are still logging the nutrition object for this recipe. Check back after the next inventory sync.
      </div>
    );
  }

  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      {entries.map((entry) => (
        <div
          key={entry.key}
          className='rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-slate-700 shadow-inner shadow-emerald-100/40'
        >
          <p className='text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600'>{entry.label}</p>
          <p className='mt-2 text-2xl font-semibold text-slate-900'>{entry.value}</p>
        </div>
      ))}
    </div>
  );
}

type InsightsPanelProps = {
  insights: RecipeInsight[];
};

function InsightsPanel({ insights }: InsightsPanelProps) {
  if (!insights.length) {
    return (
      <div className='rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600'>
        <Sparkles className='mb-3 h-5 w-5 text-emerald-500' aria-hidden='true' />
        AI insights will appear once operators finish annotating macros + highlight labels for this recipe.
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {insights.map((insight) => (
        <article
          key={insight.title}
          className='rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.08)]'
        >
          <div className='flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600'>
            <Sparkles className='h-4 w-4 text-emerald-500' aria-hidden='true' />
            {insight.title}
          </div>
          <p className='mt-2 text-sm text-slate-700'>{insight.description}</p>
        </article>
      ))}
    </div>
  );
}

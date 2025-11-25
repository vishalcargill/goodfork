import type { Metadata } from "next";

import { OnboardingFlow } from "./onboarding-flow";

export const metadata: Metadata = {
  title: "GoodFork | Personalization Onboarding",
  description:
    "Set your goals, allergens, and nutrition preferences so every GoodFork menu feels crafted for you.",
};

export default function OnboardingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-lime-50 text-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-60">
        <div className="absolute left-[10%] top-10 h-72 w-72 rounded-full bg-lime-200/40 blur-[90px]" />
        <div className="absolute right-[5%] top-40 h-96 w-96 rounded-full bg-emerald-200/30 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-amber-100/40 blur-[120px]" />
      </div>
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Start your journey
          </p>
          <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl">
            Your nutrition playbook begins here.
          </h1>
          <p className="max-w-2xl text-base text-slate-600">
            GoodFork blends live inventory, your stated goals, and AI rationales to curate every
            menu.
          </p>
        </div>

        <OnboardingFlow />
      </div>
    </div>
  );
}

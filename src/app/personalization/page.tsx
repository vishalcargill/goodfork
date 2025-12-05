import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PersonalizationSettingsForm } from "@/components/profile/personalization-settings-form";
import { ADMIN_EMAIL } from "@/constants/app.constants";

export const metadata: Metadata = {
  title: "GoodFork | Personalization Settings",
  description: "Fine-tune your goals, allergen shields, and password for personalized menus.",
};

export default async function PersonalizationPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/onboarding?next=/personalization");
  }

  if (user.email.toLowerCase() === ADMIN_EMAIL) {
    redirect("/admin");
  }

  const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });

  return (
    <div className="relative min-h-screen bg-[#f6fff4] text-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-70">
        <div className="absolute left-[10%] top-12 h-64 w-64 rounded-full bg-emerald-100 blur-[160px]" />
        <div className="absolute right-[5%] top-0 h-80 w-80 rounded-full bg-lime-200 blur-[180px]" />
        <div className="absolute bottom-0 left-[35%] h-72 w-72 rounded-full bg-cyan-100 blur-[150px]" />
      </div>

      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-12 sm:px-6">
        <header className="space-y-4 rounded-[28px] border border-emerald-100 bg-white/95 p-6 shadow-[0_20px_60px_rgba(16,185,129,0.12)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Personalization</p>
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Update your nutrition shields.</h1>
          <p className="text-sm text-slate-600 sm:text-base">
            Refresh your goals, allergen shields, or password anytime—menus update instantly for logged-in devices.
          </p>
        </header>

        <PersonalizationSettingsForm
          user={{ id: user.id, name: user.name, email: user.email }}
          profile={profile}
        />
      </div>
    </div>
  );
}

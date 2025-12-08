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
    <div className='space-y-8 pb-8'>
      <header className='space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm'>
        <p className='text-xs font-bold uppercase tracking-wider text-primary'>Personalization</p>
        <h1 className='text-3xl font-bold text-foreground sm:text-4xl'>Update your nutrition shields.</h1>
        <p className='text-sm text-muted-foreground sm:text-base'>
          Refresh your goals, allergen shields, or password anytime—menus update instantly for logged-in devices.
        </p>
      </header>

      <PersonalizationSettingsForm
        user={{ id: user.id, name: user.name, email: user.email }}
        profile={profile}
      />
    </div>
  );
}



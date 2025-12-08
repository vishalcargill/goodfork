import { cookies } from "next/headers";

import { AppShell } from "@/components/navigation/app-shell";
import { Header } from "@/components/navigation/header.component";
import { Footer } from "@/components/navigation/footer.component";
import { getAuthenticatedUser } from "@/lib/auth";
import { ADMIN_EMAIL } from "@/constants/app.constants";
import { ONBOARDING_PROFILE_COOKIE, parseOnboardingCookie } from "@/constants/cookies";

type FallbackUser = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
};

async function getOnboardingFallbackUser(): Promise<FallbackUser | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(ONBOARDING_PROFILE_COOKIE);
  const payload = parseOnboardingCookie(cookie?.value ?? null);

  if (!payload) {
    return null;
  }

  return {
    id: payload.id,
    name: payload.name,
    email: payload.email,
    isAdmin: false,
  };
}

export default async function AuthedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getAuthenticatedUser();
  const fallbackUser = await getOnboardingFallbackUser();

  const headerUser =
    currentUser != null
      ? {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          isAdmin: currentUser.email.toLowerCase() === ADMIN_EMAIL,
        }
      : fallbackUser;

  return (
    <AppShell user={headerUser} header={<Header currentUser={headerUser} />} footer={<Footer />}>
      {children}
    </AppShell>
  );
}




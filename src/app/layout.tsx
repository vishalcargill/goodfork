import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { Header } from "@/components/navigation/header.component";
import { Footer } from "@/components/navigation/footer.component";
import { AppProviders } from "@/components/providers/app-providers";
import { getAuthenticatedUser } from "@/lib/auth";
import { ADMIN_EMAIL } from "@/constants/app.constants";
import { ONBOARDING_PROFILE_COOKIE, parseOnboardingCookie } from "@/constants/cookies";

export const metadata: Metadata = {
  title: "GoodFork | AI Menu Personalization",
  description:
    "GoodFork pairs inventory signals, preferences, and AI insights to deliver beautiful, personalized menus.",
};

export default async function RootLayout({
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
    <html lang="en">
      <body className="font-sans antialiased">
        <AppProviders>
          <div className="flex min-h-screen flex-col">
            <Header currentUser={headerUser} />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}

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

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/navigation/header.component";
import { Footer } from "@/components/navigation/footer.component";
import { AppProviders } from "@/components/providers/app-providers";
import { getAuthenticatedUser } from "@/lib/auth";
import { ADMIN_EMAIL } from "@/constants/app.constants";
import { ONBOARDING_PROFILE_COOKIE, parseOnboardingCookie } from "@/constants/cookies";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
  const fallbackUser = getOnboardingFallbackUser();
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
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

function getOnboardingFallbackUser(): FallbackUser | null {
  const cookieStore = cookies();
  const cookie = cookieStore.get?.(ONBOARDING_PROFILE_COOKIE);
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

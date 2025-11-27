import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/navigation/header.component";
import { Footer } from "@/components/navigation/footer.component";
import { AppProviders } from "@/components/providers/app-providers";
import { getAuthenticatedUser } from "@/lib/auth";
import { ADMIN_EMAIL } from "@/constants/app.constants";

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
  const headerUser = currentUser
    ? {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        isAdmin: currentUser.email.toLowerCase() === ADMIN_EMAIL,
      }
    : null;

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

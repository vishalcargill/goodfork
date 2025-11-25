import Link from "next/link";

import { Logo } from "@/components/common/logo.component";
import { SmoothScrollLink } from "@/components/common/smooth-scroll-link";

const navLinks = [
  { label: "Product", href: "#product" },
  { label: "Recommendations", href: "#recommendations" },
  { label: "Onboarding", href: "/onboarding" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-emerald-100/60 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="GoodFork home"
          className="inline-flex items-center"
        >
          <Logo tagline="Nourish smarter" />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
          {navLinks.map((link) =>
            link.href.startsWith("#") ? (
              <SmoothScrollLink
                key={link.href}
                targetId={link.href.replace("#", "")}
                className="cursor-pointer transition hover:text-emerald-700"
              >
                {link.label}
              </SmoothScrollLink>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="transition hover:text-emerald-700"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>
        <div className="flex items-center gap-3">
          <SmoothScrollLink
            targetId="login"
            className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm transition hover:shadow-[0_10px_30px_rgba(16,185,129,0.25)]"
          >
            Log in
          </SmoothScrollLink>
          <Link
            href="/onboarding"
            className="hidden rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(16,185,129,0.35)] transition hover:-translate-y-0.5 md:inline-flex"
          >
            Start personalization
          </Link>
        </div>
      </div>
    </header>
  );
}

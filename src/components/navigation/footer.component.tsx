import Link from "next/link";

import { Logo } from "@/components/common/logo.component";
import { SmoothScrollLink } from "@/components/common/smooth-scroll-link";

const navLinks = [
  { label: "Product", href: "#product" },
  { label: "Recommendations", href: "#recommendations" },
  { label: "Onboarding", href: "/onboarding" },
  { label: "Login", href: "#login" },
];

export function Footer() {
  return (
    <footer className="border-t border-emerald-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
        <Link
          href="/"
          aria-label="GoodFork home"
          className="inline-flex items-center"
        >
          <Logo tagline="AI-powered nutrition" />
        </Link>
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-700">
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
        </div>
        <p className="text-xs text-slate-500">
          Crafted for the Hackathon · Nutrition-first, inventory-aware menus
        </p>
      </div>
    </footer>
  );
}

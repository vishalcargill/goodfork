import Link from "next/link";

import { Logo } from "@/components/common/logo.component";
import { SmoothScrollLink } from "@/components/common/smooth-scroll-link";

const navLinks = [
  { label: "Hero", href: "#product" },
  { label: "Story", href: "#story" },
  { label: "Healthy swaps", href: "#swaps" },
  { label: "Operator tools", href: "#operators" },
  { label: "Menus", href: "/menus" },
  { label: "Onboarding", href: "/onboarding" },
  { label: "Login", href: "#login" },
];

export function Footer() {
  return (
    <footer className='border-t border-emerald-100 bg-white/90 backdrop-blur'>
      <div className='mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between'>
        <Link href='/' aria-label='GoodFork home' className='inline-flex items-center'>
          <Logo />
        </Link>
        <div className='flex flex-wrap items-center gap-4 text-sm font-medium text-slate-700'>
          {navLinks.map((link) =>
            link.href.startsWith("#") ? (
              <SmoothScrollLink
                key={link.href}
                targetId={link.href.replace("#", "")}
                className='cursor-pointer transition hover:text-emerald-700'
              >
                {link.label}
              </SmoothScrollLink>
            ) : (
              <Link key={link.href} href={link.href} className='transition hover:text-emerald-700'>
                {link.label}
              </Link>
            )
          )}
        </div>
        <Link
          href='/onboarding'
          className='inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(16,185,129,0.25)] transition hover:-translate-y-0.5'
        >
          Start personalization
        </Link>
        <p className='text-xs text-slate-500'>Crafted for the Hackathon · Nutrition-first, inventory-aware menus</p>
      </div>
    </footer>
  );
}

import Link from "next/link";

import { Logo } from "@/components/common/logo.component";
import { SmoothScrollLink } from "@/components/common/smooth-scroll-link";

export function Header() {
  return (
    <header className='sticky top-0 z-20 border-b border-emerald-100/60 bg-white/90 backdrop-blur'>
      <div className='mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8'>
        <Link href='/' aria-label='GoodFork home' className='inline-flex items-center'>
          <Logo />
        </Link>
        <div className='flex items-center gap-3'>
          <Link
            href='/menus'
            title='Requires completed onboarding'
            className='rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(16,185,129,0.2)]'
          >
            View menus
          </Link>
          <Link
            href='/onboarding'
            className='rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(16,185,129,0.35)] transition hover:-translate-y-0.5'
          >
            Start personalization
          </Link>
          <SmoothScrollLink
            targetId='login'
            className='rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(16,185,129,0.25)]'
          >
            Log in
          </SmoothScrollLink>
        </div>
      </div>
    </header>
  );
}

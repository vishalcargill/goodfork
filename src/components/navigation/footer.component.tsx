"use client";

import Link from "next/link";
import { Logo } from "@/components/common/logo.component";

export function Footer() {
  return (
    <footer className='border-t border-emerald-900/10 bg-emerald-950 py-8 text-emerald-50'>
      <div className='mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row lg:px-8'>
        <div className='flex items-center gap-2 brightness-0 invert filter'>
          <Link href='/' className='flex items-center gap-2 transition-opacity hover:opacity-80'>
            <Logo />
          </Link>
        </div>

        <p className='flex items-center gap-1.5 text-sm font-medium text-emerald-200/80'>
          Made with love <span className='text-red-400'>❤️</span> in Cargill
        </p>
      </div>
    </footer>
  );
}

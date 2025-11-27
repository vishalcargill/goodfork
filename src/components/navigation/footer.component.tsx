import Link from "next/link";

import { Logo } from "@/components/common/logo.component";

export function Footer() {
  return (
    <footer className='border-t border-emerald-100 bg-white/90 backdrop-blur'>
      <div className='mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-sm font-semibold text-slate-700 sm:px-6 lg:flex-row lg:items-center lg:justify-between'>
        <Link href='/' aria-label='GoodFork home' className='inline-flex items-center'>
          <Logo />
        </Link>
        <p className='text-center text-base text-slate-800 lg:text-right'>Made with love ❤️ in Cargill</p>
      </div>
    </footer>
  );
}

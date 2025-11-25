import Link from "next/link";

import { requireAdminUser } from "@/lib/auth";

const adminCards = [
  {
    title: "Recipes",
    description: "Create, edit, or retire hero dishes and preview the consumer card instantly.",
    href: "/admin/recipes",
    badge: "Live",
  },
  {
    title: "Inventory",
    description: "Update quantities, restock windows, and ingredient status to keep menus grounded.",
    href: "/admin/inventory",
    badge: "Coming soon",
  },
];

export default async function AdminLandingPage() {
  await requireAdminUser();

  return (
    <div className='mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8'>
      <div className='space-y-3 pb-10'>
        <p className='text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600'>Admin</p>
        <h1 className='text-3xl font-semibold text-slate-900'>Operator console</h1>
        <p className='max-w-3xl text-sm text-slate-600'>
          Choose a workspace to curate recipes or manage live inventory. These tools map directly to the
          Prisma schema powering recommendations, so every edit reflects instantly for consumers.
        </p>
      </div>
      <div className='grid gap-6 md:grid-cols-2'>
        {adminCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className='group relative flex h-full flex-col rounded-3xl border border-emerald-100 bg-white p-6 shadow-[0_18px_45px_rgba(16,185,129,0.12)] transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[0_24px_60px_rgba(16,185,129,0.22)]'
          >
            <span className='absolute right-6 top-6 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500'>
              {card.badge}
            </span>
            <h2 className='text-2xl font-semibold text-slate-900'>{card.title}</h2>
            <p className='mt-3 flex-1 text-sm text-slate-600'>{card.description}</p>
            <span className='mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700'>
              Open {card.title}
              <span aria-hidden='true' className='transition group-hover:translate-x-1'>→</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

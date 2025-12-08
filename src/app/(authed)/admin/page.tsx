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
    badge: "Live",
  },
];

export default async function AdminLandingPage() {
  await requireAdminUser();

  return (
    <div className='space-y-8 pb-8'>
      <header className='space-y-2'>
        <h1 className='text-3xl font-bold text-foreground'>Operator Console</h1>
        <p className='max-w-3xl text-muted-foreground'>
          Curate recipes or manage live inventory. These tools map directly to the Prisma schema powering recommendations.
        </p>
      </header>

      <div className='grid gap-6 md:grid-cols-2'>
        {adminCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className='group relative flex h-full flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md'
          >
            <span className='absolute right-6 top-6 rounded-full border border-border bg-surface-subtle px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              {card.badge}
            </span>
            <h2 className='text-xl font-semibold text-foreground'>{card.title}</h2>
            <p className='mt-3 flex-1 text-sm text-muted-foreground'>{card.description}</p>
            <span className='mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary'>
              Open {card.title}
              <span aria-hidden='true' className='transition group-hover:translate-x-1'>→</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}



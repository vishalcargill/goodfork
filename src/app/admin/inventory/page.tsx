import { requireAdminUser } from "@/lib/auth";

export default async function AdminInventoryPage() {
  await requireAdminUser();

  return (
    <div className='mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8'>
      <div className='rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-[0_18px_45px_rgba(16,185,129,0.12)]'>
        <p className='text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600'>Inventory</p>
        <h1 className='mt-2 text-3xl font-semibold text-slate-900'>Coming soon</h1>
        <p className='mx-auto mt-4 max-w-2xl text-sm text-slate-600'>
          The inventory management surface is on deck. In the meantime, use the Recipes console to adjust
          quantities or restock dates for each dish. This page will evolve to provide bulk edits, CSV import,
          and low-stock alerts.
        </p>
      </div>
    </div>
  );
}

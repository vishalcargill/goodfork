import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth";
import { AdminInventoryManager } from "@/components/admin/admin-inventory-manager";
import { AdminNavigation } from "@/components/admin/admin-navigation";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  await requireAdminUser();

  const inventory = await prisma.inventoryItem.findMany({
    include: {
      recipe: {
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          imageUrl: true,
          priceCents: true,
          calories: true,
          proteinGrams: true,
          carbsGrams: true,
          fatGrams: true,
          healthyHighlights: true,
          tags: true,
          allergens: true,
          ratingCount: true,
          difficulty: true,
          serves: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className='mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8'>
      <AdminNavigation active='inventory' />
      <div className='space-y-2 pb-8'>
        <p className='text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600'>
          Admin · Inventory
        </p>
        <h1 className='text-3xl font-semibold text-slate-900'>Inventory control center</h1>
        <p className='max-w-3xl text-slate-600'>
          Monitor live availability, bulk-edit quantities, log restocks, and preview how inventory
          state feeds the consumer recommendation cards. All edits are secured to your admin session.
        </p>
      </div>
      <AdminInventoryManager initialItems={inventory} />
    </div>
  );
}

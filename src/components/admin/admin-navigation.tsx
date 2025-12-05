import Link from "next/link";

import { cn } from "@/lib/utils";

type AdminNavItem = {
  key: "home" | "recipes" | "inventory";
  label: string;
  href: string;
};

const adminNavItems: AdminNavItem[] = [
  { key: "home", label: "Back to admin home", href: "/admin" },
  { key: "recipes", label: "Recipes workspace", href: "/admin/recipes" },
  { key: "inventory", label: "Inventory workspace", href: "/admin/inventory" },
];

interface AdminNavigationProps {
  active: AdminNavItem["key"];
}

export function AdminNavigation({ active }: AdminNavigationProps) {
  return (
    <nav
      aria-label='Admin navigation'
      className='mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-100 bg-white/70 p-2'
    >
      {adminNavItems.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={active === item.key ? "page" : undefined}
          className={cn(
            "inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold transition",
            active === item.key
              ? "bg-white text-emerald-700 shadow-[0_6px_16px_rgba(16,185,129,0.18)]"
              : "text-slate-600 hover:text-emerald-700"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

"use client";

import { useState } from "react";

import { PantryManager } from "@/components/pantry/pantry-manager";
import type { PantryItemView } from "@/services/shared/pantry.types";
import { cn } from "@/lib/utils";

import { AdminInventoryManager, type InventoryRecord } from "./admin-inventory-manager";

type IngredientOption = {
  slug: string;
  name: string;
  defaultUnit: string;
};

type AdminStockWorkspaceProps = {
  inventoryItems: InventoryRecord[];
  pantryItems: PantryItemView[];
  ingredientOptions: IngredientOption[];
};

type WorkspaceTab = "recipes" | "pantry";

export function AdminStockWorkspace({ inventoryItems, pantryItems, ingredientOptions }: AdminStockWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("recipes");

  return (
    <section className='rounded-[32px] border border-emerald-100 bg-white/70 p-4 shadow-[0_30px_90px_rgba(16,185,129,0.12)]'>
      <div className='mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-100 bg-white/80 p-1 text-sm font-semibold text-slate-700'>
        <TabButton label='Recipe inventory' active={activeTab === "recipes"} onClick={() => setActiveTab("recipes")} />
        <TabButton label='Ingredient pantry' active={activeTab === "pantry"} onClick={() => setActiveTab("pantry")} />
      </div>
      {activeTab === "recipes" ? (
        <AdminInventoryManager initialItems={inventoryItems} />
      ) : (
        <PantryManager initialItems={pantryItems} ingredientOptions={ingredientOptions} variant='global' />
      )}
    </section>
  );
}

type TabButtonProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

function TabButton({ label, active, onClick }: TabButtonProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        "inline-flex flex-1 items-center justify-center rounded-2xl px-4 py-2 transition",
        active
          ? "bg-emerald-500 text-white shadow-[0_12px_30px_rgba(16,185,129,0.25)]"
          : "text-slate-500 hover:text-emerald-700"
      )}
    >
      {label}
    </button>
  );
}

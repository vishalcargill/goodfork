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
    <section className='rounded-xl border border-border bg-card p-4 shadow-sm'>
      <div className='mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface p-1 text-sm font-semibold text-muted-foreground'>
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
        "inline-flex flex-1 items-center justify-center rounded-md px-4 py-2 transition",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "hover:bg-surface-subtle hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}

'use client';

import { useMemo, useState } from "react";
import type { InventoryItem, InventoryStatus, Recipe } from "@/generated/prisma/client";
import { Warning, CircleNotch, ArrowsClockwise, MagnifyingGlass, Truck } from "@phosphor-icons/react";
import { toast } from "sonner";

import { apiClient } from "@/config/axios.config";
import { RecommendationCard } from "@/components/recommendations/recommendation-card";
import type { RecommendationCard as RecommendationCardType } from "@/services/shared/recommendations.types";
import { cn } from "@/lib/utils";

type RecipePreviewFields = Pick<
  Recipe,
  | "id"
  | "slug"
  | "title"
  | "description"
  | "imageUrl"
  | "calories"
  | "proteinGrams"
  | "carbsGrams"
  | "fatGrams"
  | "healthyHighlights"
  | "tags"
  | "allergens"
  | "ratingCount"
  | "difficulty"
  | "serves"
>;

export type InventoryRecord = InventoryItem & {
  recipe: RecipePreviewFields;
};

type AdminInventoryManagerProps = {
  initialItems: InventoryRecord[];
};

const inventoryStatuses: InventoryStatus[] = ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"];

const statusMeta: Record<
  InventoryStatus,
  { label: string; pill: string; badge: string; copy: string; delta: number }
> = {
  IN_STOCK: {
    label: "Ready now",
    pill: "bg-success/10 text-success border-success/20",
    badge: "bg-success/10 text-success border-success/20",
    copy: "Inventory looks healthy. Recommendations will prioritize this recipe.",
    delta: 8,
  },
  LOW_STOCK: {
    label: "Low stock",
    pill: "bg-warning/10 text-warning-foreground border-warning/20",
    badge: "bg-warning/10 text-warning-foreground border-warning/20",
    copy: "Inventory is tightening. Consumers will see urgency copy.",
    delta: -4,
  },
  OUT_OF_STOCK: {
    label: "Out of stock",
    pill: "bg-destructive/10 text-destructive border-destructive/20",
    badge: "bg-destructive/10 text-destructive border-destructive/20",
    copy: "Recipe is hidden from personalization until restocked.",
    delta: -12,
  },
};

type DrawerState = {
  open: boolean;
  recipeId: string | null;
  quantityDelta: string;
  restockDate: string;
  status: InventoryStatus;
};

const initialDrawerState: DrawerState = {
  open: false,
  recipeId: null,
  quantityDelta: "12",
  restockDate: "",
  status: "IN_STOCK",
};

export function AdminInventoryManager({ initialItems }: AdminInventoryManagerProps) {
  const [items, setItems] = useState<InventoryRecord[]>(initialItems);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<InventoryStatus | "ALL">("ALL");
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(
    initialItems[0]?.recipeId ?? null
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [restockState, setRestockState] = useState<DrawerState>(initialDrawerState);
  const [restockPending, setRestockPending] = useState(false);

  const lowStockItems = useMemo(
    () => items.filter((item) => item.status !== "IN_STOCK"),
    [items]
  );
  const criticalLowStock = useMemo(
    () => lowStockItems.filter((item) => item.quantity <= 4),
    [lowStockItems]
  );

  const statusCounts = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc[item.status] += 1;
        acc.totalQuantity += item.quantity;
        return acc;
      },
      {
        IN_STOCK: 0,
        LOW_STOCK: 0,
        OUT_OF_STOCK: 0,
        totalQuantity: 0,
      }
    );
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesStatus =
        statusFilter === "ALL" ? true : item.status === statusFilter;
      const haystack = `${item.recipe.title} ${item.recipe.slug}`.toLowerCase();
      const matchesSearch = haystack.includes(searchTerm.trim().toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [items, searchTerm, statusFilter]);

  const activeRecipe =
    items.find((item) => item.recipeId === selectedRecipeId) ?? items[0] ?? null;

  const previewCard = useMemo(() => {
    return activeRecipe ? buildPreviewCard(activeRecipe) : null;
  }, [activeRecipe]);

  const handleItemChange = (
    recipeId: string,
    updater: (item: InventoryRecord) => InventoryRecord
  ) => {
    setItems((current) =>
      current.map((entry) => (entry.recipeId === recipeId ? updater(entry) : entry))
    );
  };

  const handleQuantityChange = (recipeId: string, value: string) => {
    const quantity = Number(value);

    if (Number.isNaN(quantity) || quantity < 0) {
      return;
    }

    handleItemChange(recipeId, (entry) => ({ ...entry, quantity }));
  };

  const handleUnitLabelChange = (recipeId: string, value: string) => {
    handleItemChange(recipeId, (entry) => ({ ...entry, unitLabel: value || "unit" }));
  };

  const handleStatusChange = (recipeId: string, value: InventoryStatus) => {
    handleItemChange(recipeId, (entry) => ({ ...entry, status: value }));
  };

  const handleRestockDateChange = (recipeId: string, value: string) => {
    let restockDate: Date | null = null;
    if (value) {
      const parsed = new Date(value);
      restockDate = Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    handleItemChange(recipeId, (entry) => ({ ...entry, restockDate }));
  };

  const handleSaveRow = async (recipeId: string) => {
    const record = items.find((item) => item.recipeId === recipeId);
    if (!record) {
      return;
    }

    setSavingId(recipeId);
    try {
      const response = await apiClient.patch<{ success: boolean; items: InventoryRecord[] }>(
        "/admin/inventory",
        {
          items: [
            {
              recipeId,
              quantity: record.quantity,
              unitLabel: record.unitLabel,
              status: record.status,
              restockDate: record.restockDate
                ? formatDateInput(record.restockDate)
                : null,
            },
          ],
        }
      );

      if (response.data.success && response.data.items?.length) {
        const updated = response.data.items[0];
        setItems((current) =>
          current.map((entry) => (entry.recipeId === recipeId ? updated : entry))
        );
        toast.success("Inventory updated", {
          description: `${record.recipe.title} now shows ${record.quantity} ${record.unitLabel}.`,
        });
      } else {
        toast.error("Unable to update inventory");
      }
    } catch (error) {
      console.error("inventory save failed", error);
      toast.error("Inventory update failed", {
        description: "Check your connection and try again.",
      });
    } finally {
      setSavingId(null);
    }
  };

  const openRestockDrawer = (record: InventoryRecord) => {
    setRestockState({
      open: true,
      recipeId: record.recipeId,
      quantityDelta: "12",
      restockDate: formatDateInput(record.restockDate ?? new Date()),
      status: "IN_STOCK",
    });
  };

  const closeRestockDrawer = () => {
    setRestockState(initialDrawerState);
  };

  const handleRestockSubmit = async () => {
    if (!restockState.recipeId) {
      return;
    }

    const quantityDelta = Number(restockState.quantityDelta);
    if (Number.isNaN(quantityDelta) || quantityDelta <= 0) {
      toast.error("Restock quantity must be at least 1.");
      return;
    }

    setRestockPending(true);
    try {
      const response = await apiClient.post<{
        success: boolean;
        item?: InventoryRecord;
      }>("/admin/inventory", {
        recipeId: restockState.recipeId,
        quantityDelta,
        restockDate: restockState.restockDate || null,
        status: restockState.status,
      });

      if (response.data.success && response.data.item) {
        const updated = response.data.item;
        setItems((current) =>
          current.map((entry) =>
            entry.recipeId === updated.recipeId ? updated : entry
          )
        );
        setSelectedRecipeId(updated.recipeId);
        toast.success("Restock recorded", {
          description: `${updated.recipe.title} now has ${updated.quantity} ${updated.unitLabel}.`,
        });
        closeRestockDrawer();
      } else {
        toast.error("Unable to restock this recipe.");
      }
    } catch (error) {
      console.error("inventory restock failed", error);
      toast.error("Restock failed", {
        description: "Please try again once the network stabilizes.",
      });
    } finally {
      setRestockPending(false);
    }
  };

  return (
    <div className='grid gap-8 lg:grid-cols-[2fr_minmax(320px,1fr)]'>
      <section className='space-y-6'>
        {lowStockItems.length ? (
          <InventoryAlerts
            lowCount={lowStockItems.length}
            criticalCount={criticalLowStock.length}
            onFocusLow={() => setStatusFilter("LOW_STOCK")}
          />
        ) : null}
        <InventoryFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          statusCounts={statusCounts}
        />

        <div className='space-y-4'>
          {filteredItems.length ? (
            filteredItems.map((item) => (
              <InventoryRow
                key={item.id}
                item={item}
                selected={item.recipeId === selectedRecipeId}
                onSelect={() => setSelectedRecipeId(item.recipeId)}
                onQuantityChange={handleQuantityChange}
                onUnitLabelChange={handleUnitLabelChange}
                onStatusChange={handleStatusChange}
                onRestockDateChange={handleRestockDateChange}
                onSave={handleSaveRow}
                onRestock={openRestockDrawer}
                saving={savingId === item.recipeId}
              />
            ))
          ) : (
            <div className='rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground'>
              <p className='text-lg font-semibold text-foreground'>No inventory matches</p>
              <p className='mt-2'>
                Adjust filters or search terms to see relevant recipes. All inventory edits
                and restocks flow through the list above.
              </p>
            </div>
          )}
        </div>
      </section>

      <aside className='space-y-4'>
        <div className='rounded-xl border border-border bg-card p-6 shadow-sm'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs font-bold uppercase tracking-wider text-primary'>
                Live preview
              </p>
              <h3 className='text-2xl font-semibold text-foreground'>Consumer card</h3>
            </div>
            <span className='rounded-full border border-border bg-surface-subtle px-2.5 py-0.5 text-xs font-semibold text-muted-foreground'>
              Read only
            </span>
          </div>
          <p className='mt-2 text-sm text-muted-foreground'>
            Select an inventory row to see how availability copy maps into the consumer
            recommendation card.
          </p>
          <div className='mt-4'>
            {previewCard ? (
              <RecommendationCard card={previewCard} userId='inventory-preview' readOnly />
            ) : (
              <div className='rounded-lg border border-dashed border-border bg-surface-subtle p-6 text-sm text-muted-foreground'>
                Pick an item to preview the consumer experience.
              </div>
            )}
          </div>
        </div>
      </aside>

      {restockState.open && restockState.recipeId ? (
        <RestockDrawer
          item={items.find((entry) => entry.recipeId === restockState.recipeId) ?? null}
          state={restockState}
          onClose={closeRestockDrawer}
          onStateChange={setRestockState}
          onSubmit={handleRestockSubmit}
          pending={restockPending}
        />
      ) : null}
    </div>
  );
}

type InventoryFiltersProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: InventoryStatus | "ALL";
  onStatusChange: (value: InventoryStatus | "ALL") => void;
  statusCounts: {
    IN_STOCK: number;
    LOW_STOCK: number;
    OUT_OF_STOCK: number;
    totalQuantity: number;
  };
};

function InventoryFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  statusCounts,
}: InventoryFiltersProps) {
  return (
    <div className='space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm'>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-center'>
        <label className='flex-1 rounded-lg border border-border bg-surface px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary'>
          <span className='flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary'>
            <MagnifyingGlass className='h-3.5 w-3.5' />
            Search recipes
          </span>
          <input
            type='search'
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder='Title or slug'
            className='mt-1 w-full border-none bg-transparent text-sm text-foreground outline-none'
          />
        </label>
        <div className='flex gap-3 text-sm'>
          <div>
            <p className='text-xs font-bold uppercase tracking-wider text-primary'>
              Total portions
            </p>
            <p className='text-2xl font-semibold text-foreground'>
              {statusCounts.totalQuantity.toLocaleString()}
            </p>
          </div>
          <div>
            <p className='text-xs font-bold uppercase tracking-wider text-primary'>
              Recipes
            </p>
            <p className='text-2xl font-semibold text-foreground'>
              {statusCounts.IN_STOCK + statusCounts.LOW_STOCK + statusCounts.OUT_OF_STOCK}
            </p>
          </div>
        </div>
      </div>

      <div className='flex flex-wrap gap-2'>
        {[
          { label: "All statuses", value: "ALL" as const },
          ...inventoryStatuses.map((status) => ({
            label: `${statusMeta[status].label} (${statusCounts[status]})`,
            value: status,
          })),
        ].map((option) => (
          <button
            key={`status-filter-${option.value}`}
            type='button'
            onClick={() => onStatusChange(option.value)}
            className={cn(
              "rounded-full border px-4 py-2 text-xs font-semibold transition",
              statusFilter === option.value
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-surface text-foreground hover:bg-surface-subtle"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

type InventoryAlertsProps = {
  lowCount: number;
  criticalCount: number;
  onFocusLow: () => void;
};

function InventoryAlerts({ lowCount, criticalCount, onFocusLow }: InventoryAlertsProps) {
  return (
    <div className='rounded-xl border border-warning/30 bg-warning/10 p-5 text-sm text-warning-foreground shadow-sm'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-start gap-3'>
          <span className='rounded-lg bg-surface p-2 text-warning shadow-sm'>
            <Warning className='h-5 w-5' />
          </span>
          <div>
            <p className='text-xs font-bold uppercase tracking-wider'>Attention</p>
            <p className='text-base font-semibold'>
              {criticalCount ? `${criticalCount} recipes` : "Recipes"} nearly out of stock
            </p>
            <p className='text-sm opacity-90'>
              {criticalCount
                ? `${criticalCount} items have <=4 portions left.`
                : "Inventory is dipping across several recipes."}{" "}
              {lowCount} total recipes are marked as low stock.
            </p>
          </div>
        </div>
        <button
          type='button'
          onClick={onFocusLow}
          className='inline-flex items-center justify-center rounded-full border border-warning/30 bg-surface px-4 py-2 text-xs font-bold uppercase tracking-wider text-warning-foreground transition hover:-translate-y-0.5'
        >
          Focus low stock
        </button>
      </div>
    </div>
  );
}

type InventoryRowProps = {
  item: InventoryRecord;
  selected: boolean;
  onSelect: () => void;
  onQuantityChange: (recipeId: string, value: string) => void;
  onUnitLabelChange: (recipeId: string, value: string) => void;
  onStatusChange: (recipeId: string, value: InventoryStatus) => void;
  onRestockDateChange: (recipeId: string, value: string) => void;
  onSave: (recipeId: string) => void;
  onRestock: (item: InventoryRecord) => void;
  saving: boolean;
};

function InventoryRow({
  item,
  selected,
  onSelect,
  onQuantityChange,
  onUnitLabelChange,
  onStatusChange,
  onRestockDateChange,
  onSave,
  onRestock,
  saving,
}: InventoryRowProps) {
  const statusTheme = statusMeta[item.status];
  const restockLabel = item.restockDate
    ? new Date(item.restockDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "Not scheduled";

  return (
    <article
      className={cn(
        "rounded-xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        selected ? "border-primary ring-1 ring-primary" : "border-border"
      )}
      onClick={onSelect}
    >
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <p className='text-xs font-bold uppercase tracking-wider text-primary'>
            #{item.recipe.slug}
          </p>
          <h3 className='text-xl font-semibold text-foreground'>{item.recipe.title}</h3>
          <p className='text-sm text-muted-foreground'>
            {item.recipe.healthyHighlights?.slice(0, 2).join(" · ") || "Fresh ingredients"}
          </p>
        </div>
        <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", statusTheme.pill)}>
          {statusTheme.label}
        </span>
      </div>

      <p className='mt-3 text-sm text-muted-foreground'>{statusTheme.copy}</p>

      <div className='mt-4 grid gap-4 lg:grid-cols-4'>
        <label className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
          Quantity · Unit
          <div className='mt-2 grid gap-2 sm:grid-cols-2'>
            <input
              type='number'
              min={0}
              value={item.quantity}
              onChange={(event) => onQuantityChange(item.recipeId, event.target.value)}
              className='w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary'
            />
            <input
              type='text'
              value={item.unitLabel}
              onChange={(event) => onUnitLabelChange(item.recipeId, event.target.value)}
              className='w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary'
            />
          </div>
        </label>

        <label className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
          Status
          <select
            value={item.status}
            onChange={(event) => onStatusChange(item.recipeId, event.target.value as InventoryStatus)}
            className='mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary'
          >
            {inventoryStatuses.map((status) => (
              <option key={`${item.recipeId}-${status}`} value={status}>
                {statusMeta[status].label}
              </option>
            ))}
          </select>
        </label>

        <label className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
          Restock date
          <input
            type='date'
            value={formatDateInput(item.restockDate)}
            onChange={(event) => onRestockDateChange(item.recipeId, event.target.value)}
            className='mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary'
          />
        </label>

        <div className='flex items-end gap-2'>
          <button
            type='button'
            onClick={(event) => {
              event.stopPropagation();
              onSave(item.recipeId);
            }}
            disabled={saving}
            className='flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {saving ? (
              <span className='flex items-center justify-center gap-2'>
                <CircleNotch className='h-4 w-4 animate-spin' />
                Saving
              </span>
            ) : (
              "Save row"
            )}
          </button>
          <button
            type='button'
            onClick={(event) => {
              event.stopPropagation();
              onRestock(item);
            }}
            className='rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-subtle'
          >
            Restock
          </button>
        </div>
      </div>

      <div className='mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground'>
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 font-semibold",
            statusTheme.badge
          )}
        >
          <Truck className='h-3.5 w-3.5' />
          Next restock: {restockLabel}
        </span>
        <span className='inline-flex items-center gap-1 rounded-full bg-surface-subtle border border-border px-2.5 py-0.5 font-semibold text-muted-foreground'>
          Score impact:{" "}
          <span className='text-foreground'>{statusTheme.delta > 0 ? `+${statusTheme.delta}` : statusTheme.delta}</span>
        </span>
      </div>
    </article>
  );
}

type RestockDrawerProps = {
  item: InventoryRecord | null;
  state: DrawerState;
  onStateChange: (next: DrawerState) => void;
  onClose: () => void;
  onSubmit: () => void;
  pending: boolean;
};

function RestockDrawer({
  item,
  state,
  onStateChange,
  onClose,
  onSubmit,
  pending,
}: RestockDrawerProps) {
  if (!item) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-40 flex'>
      <div className='hidden flex-1 bg-black/20 backdrop-blur-sm sm:block' onClick={onClose} />
      <div className='relative ml-auto flex h-full w-full max-w-md flex-col bg-card p-6 shadow-2xl border-l border-border'>
        <button
          type='button'
          className='absolute right-4 top-4 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground'
          onClick={onClose}
        >
          Close
        </button>
        <div className='mt-6 space-y-4'>
          <p className='text-xs font-bold uppercase tracking-wider text-primary'>
            Restock
          </p>
          <h3 className='text-2xl font-semibold text-foreground'>{item.recipe.title}</h3>
          <p className='text-sm text-muted-foreground'>
            Add fresh portions, override status, and log the expected arrival date. This
            updates the personalization engine immediately.
          </p>
        </div>

        <div className='mt-6 space-y-4'>
          <label className='block text-xs font-bold uppercase tracking-wider text-muted-foreground'>
            Add quantity
            <input
              type='number'
              min={1}
              value={state.quantityDelta}
              onChange={(event) =>
                onStateChange({ ...state, quantityDelta: event.target.value })
              }
              className='mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary'
            />
          </label>
          <label className='block text-xs font-bold uppercase tracking-wider text-muted-foreground'>
            Expected restock date
            <input
              type='date'
              value={state.restockDate}
              onChange={(event) =>
                onStateChange({ ...state, restockDate: event.target.value })
              }
              className='mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary'
            />
          </label>
          <label className='block text-xs font-bold uppercase tracking-wider text-muted-foreground'>
            Post-restock status
            <select
              value={state.status}
              onChange={(event) =>
                onStateChange({ ...state, status: event.target.value as InventoryStatus })
              }
              className='mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary'
            >
              {inventoryStatuses.map((status) => (
                <option key={`drawer-status-${status}`} value={status}>
                  {statusMeta[status].label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className='mt-auto space-y-4 pt-6'>
          <button
            type='button'
            disabled={pending}
            onClick={onSubmit}
            className='flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {pending ? (
              <>
                <CircleNotch className='h-4 w-4 animate-spin' />
                Recording…
              </>
            ) : (
              <>
                <ArrowsClockwise className='h-4 w-4' />
                Save restock
              </>
            )}
          </button>
          <button
            type='button'
            className='w-full rounded-lg border border-border px-4 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-subtle'
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function buildPreviewCard(item: InventoryRecord): RecommendationCardType {
  const macros: string[] = [];
  if (item.recipe.proteinGrams != null) {
    macros.push(`${item.recipe.proteinGrams}g protein`);
  }
  if (item.recipe.carbsGrams != null) {
    macros.push(`${item.recipe.carbsGrams}g carbs`);
  }
  if (item.recipe.fatGrams != null) {
    macros.push(`${item.recipe.fatGrams}g fat`);
  }

  const macrosLabel = macros.join(" · ");
  const statusTheme = statusMeta[item.status];

  const adjustments = [
    { reason: `Inventory ${statusTheme.label.toLowerCase()}`, delta: statusTheme.delta },
    { reason: "Operator priority window", delta: 4 },
    {
      reason: "Macro balance",
      delta: macros.length >= 2 ? 3 : 0,
    },
  ].filter((entry) => entry.delta !== 0);

  return {
    recommendationId: `inventory-preview-${item.recipeId}`,
    recipeId: item.recipeId,
    slug: item.recipe.slug,
    title: item.recipe.title,
    description: item.recipe.description,
    imageUrl: item.recipe.imageUrl,
    calories: item.recipe.calories,
    proteinGrams: item.recipe.proteinGrams,
    carbsGrams: item.recipe.carbsGrams,
    fatGrams: item.recipe.fatGrams,
    macrosLabel,
    tags: item.recipe.tags ?? [],
    healthyHighlights: item.recipe.healthyHighlights ?? [],
    allergens: item.recipe.allergens ?? [],
    pantry: buildInventoryPreviewPantry(item.status, item.quantity, item.unitLabel),
    rationale:
      item.status === "OUT_OF_STOCK"
        ? "Currently hidden while operators replenish ingredients."
        : item.status === "LOW_STOCK"
          ? "Grab it soon—inventory is trending low, so swaps may appear."
          : "Ready to plate now. Inventory buffer keeps your order safe.",
    healthySwapCopy:
      item.status === "LOW_STOCK"
        ? "Offer a lighter bowl swap if this goes fast today."
        : null,
    swapRecipe: null,
    metadata: {
      rankingSource: "deterministic",
      baseScore: 64,
      adjustments,
    },
  };
}

function buildInventoryPreviewPantry(
  status: InventoryStatus,
  quantity: number,
  unitLabel: string
): RecommendationCardType["pantry"] {
  const safeQuantity = Math.max(0, quantity);
  const safeStatus = status as RecommendationCardType["pantry"]["status"];
  const cookableServings =
    safeStatus === "OUT_OF_STOCK" ? 0 : Math.max(1, Math.min(3, safeQuantity || 1));
  const placeholder = {
    ingredient: "Pantry staple",
    unitLabel,
    requiredQuantity: 1,
    availableQuantity: safeQuantity,
  };
  const missingIngredients = safeStatus === "OUT_OF_STOCK" ? [placeholder] : [];
  const lowStockIngredients = safeStatus === "LOW_STOCK" ? [placeholder] : [];

  return {
    status: safeStatus,
    cookableServings,
    missingIngredients,
    lowStockIngredients,
    operatorStatus: safeStatus,
    operatorMissingIngredients: missingIngredients,
    operatorLowStockIngredients: lowStockIngredients,
  };
}

function formatDateInput(value: string | Date | null | undefined) {
  if (!value) {
    return "";
  }

  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().split("T")[0];
}

'use client';

import { useMemo, useState } from "react";
import type { InventoryItem, InventoryStatus, Recipe } from "@/generated/prisma/client";
import { AlertTriangle, Loader2, RefreshCcw, Search, Truck } from "lucide-react";
import { toast } from "sonner";

import { apiClient } from "@/config/axios.config";
import { RecommendationCard } from "@/components/recommendations/recommendations-demo";
import type { RecommendationCard as RecommendationCardType } from "@/services/shared/recommendations.types";
import { cn } from "@/lib/utils";

type RecipePreviewFields = Pick<
  Recipe,
  | "id"
  | "slug"
  | "title"
  | "description"
  | "imageUrl"
  | "priceCents"
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
    pill: "bg-emerald-100 text-emerald-900 border-emerald-200",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    copy: "Inventory looks healthy. Recommendations will prioritize this recipe.",
    delta: 8,
  },
  LOW_STOCK: {
    label: "Low stock",
    pill: "bg-amber-100 text-amber-900 border-amber-200",
    badge: "bg-amber-50 text-amber-900 border-amber-200",
    copy: "Inventory is tightening. Consumers will see urgency copy.",
    delta: -4,
  },
  OUT_OF_STOCK: {
    label: "Out of stock",
    pill: "bg-rose-100 text-rose-800 border-rose-200",
    badge: "bg-rose-50 text-rose-800 border-rose-200",
    copy: "Recipe is hidden from personalization until restocked.",
    delta: -12,
  },
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

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
            <div className='rounded-3xl border border-dashed border-emerald-200 bg-white p-8 text-center text-sm text-slate-600'>
              <p className='text-lg font-semibold text-slate-900'>No inventory matches</p>
              <p className='mt-2'>
                Adjust filters or search terms to see relevant recipes. All inventory edits
                and restocks flow through the list above.
              </p>
            </div>
          )}
        </div>
      </section>

      <aside className='space-y-4'>
        <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-emerald-50/50'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600'>
                Live preview
              </p>
              <h3 className='text-2xl font-semibold text-slate-900'>Consumer card</h3>
            </div>
            <span className='rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800'>
              Read only
            </span>
          </div>
          <p className='mt-2 text-sm text-slate-600'>
            Select an inventory row to see how availability copy maps into the consumer
            recommendation card.
          </p>
          <div className='mt-4'>
            {previewCard ? (
              <RecommendationCard card={previewCard} userId='inventory-preview' readOnly />
            ) : (
              <div className='rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-600'>
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
    <div className='space-y-4 rounded-3xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-inner'>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-center'>
        <label className='flex-1 rounded-2xl border border-emerald-100 bg-white px-3 py-2 shadow-sm focus-within:border-emerald-400'>
          <span className='flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700'>
            <Search className='h-3.5 w-3.5' />
            Search recipes
          </span>
          <input
            type='search'
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder='Title or slug'
            className='mt-1 w-full border-none bg-transparent text-sm text-slate-900 outline-none'
          />
        </label>
        <div className='flex gap-3 text-sm'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700'>
              Total portions
            </p>
            <p className='text-2xl font-semibold text-slate-900'>
              {statusCounts.totalQuantity.toLocaleString()}
            </p>
          </div>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700'>
              Recipes
            </p>
            <p className='text-2xl font-semibold text-slate-900'>
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
                ? "border-emerald-500 bg-emerald-600 text-white shadow-[0_12px_30px_rgba(16,185,129,0.25)]"
                : "border-emerald-200 bg-white text-emerald-700 hover:border-emerald-400"
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
    <div className='rounded-3xl border border-amber-200 bg-amber-50/70 p-5 text-sm text-amber-900 shadow-inner'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-start gap-3'>
          <span className='rounded-2xl bg-white/80 p-2 text-amber-500 shadow-sm'>
            <AlertTriangle className='h-5 w-5' />
          </span>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.2em]'>Attention</p>
            <p className='text-base font-semibold'>
              {criticalCount ? `${criticalCount} recipes` : "Recipes"} nearly out of stock
            </p>
            <p className='text-sm text-amber-800'>
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
          className='inline-flex items-center justify-center rounded-full border border-amber-300 bg-amber-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-900 transition hover:-translate-y-0.5'
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
        "rounded-3xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl",
        selected ? "border-emerald-300 shadow-lg" : "border-slate-200"
      )}
      onClick={onSelect}
    >
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.16em] text-slate-500'>
            #{item.recipe.slug}
          </p>
          <h3 className='text-xl font-semibold text-slate-900'>{item.recipe.title}</h3>
          <p className='text-sm text-slate-500'>
            {item.recipe.healthyHighlights?.slice(0, 2).join(" · ") || "Fresh ingredients"}
          </p>
        </div>
        <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", statusTheme.pill)}>
          {statusTheme.label}
        </span>
      </div>

      <p className='mt-3 text-sm text-slate-600'>{statusTheme.copy}</p>

      <div className='mt-4 grid gap-3 lg:grid-cols-4'>
        <label className='text-xs font-semibold uppercase tracking-[0.14em] text-slate-500'>
          Quantity · Unit
          <div className='mt-2 flex gap-2'>
            <input
              type='number'
              min={0}
              value={item.quantity}
              onChange={(event) => onQuantityChange(item.recipeId, event.target.value)}
              className='w-24 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-400'
            />
            <input
              type='text'
              value={item.unitLabel}
              onChange={(event) => onUnitLabelChange(item.recipeId, event.target.value)}
              className='flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-400'
            />
          </div>
        </label>

        <label className='text-xs font-semibold uppercase tracking-[0.14em] text-slate-500'>
          Status
          <select
            value={item.status}
            onChange={(event) => onStatusChange(item.recipeId, event.target.value as InventoryStatus)}
            className='mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-400'
          >
            {inventoryStatuses.map((status) => (
              <option key={`${item.recipeId}-${status}`} value={status}>
                {statusMeta[status].label}
              </option>
            ))}
          </select>
        </label>

        <label className='text-xs font-semibold uppercase tracking-[0.14em] text-slate-500'>
          Restock date
          <input
            type='date'
            value={formatDateInput(item.restockDate)}
            onChange={(event) => onRestockDateChange(item.recipeId, event.target.value)}
            className='mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-400'
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
            className='flex-1 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(16,185,129,0.25)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {saving ? (
              <span className='flex items-center justify-center gap-2'>
                <Loader2 className='h-4 w-4 animate-spin' />
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
            className='rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700'
          >
            Restock
          </button>
        </div>
      </div>

      <div className='mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500'>
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-semibold",
            statusTheme.badge
          )}
        >
          <Truck className='h-3.5 w-3.5' />
          Next restock: {restockLabel}
        </span>
        <span className='inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600'>
          Score impact:{" "}
          <span className='text-slate-900'>{statusTheme.delta > 0 ? `+${statusTheme.delta}` : statusTheme.delta}</span>
        </span>
        <span className='inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600'>
          Portion value: {currencyFormatter.format(item.recipe.priceCents / 100)}
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
      <div className='hidden flex-1 bg-slate-900/30 sm:block' onClick={onClose} />
      <div className='relative ml-auto flex h-full w-full max-w-md flex-col bg-white p-6 shadow-2xl'>
        <button
          type='button'
          className='absolute right-4 top-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500'
          onClick={onClose}
        >
          Close
        </button>
        <div className='mt-6 space-y-4'>
          <p className='text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700'>
            Restock
          </p>
          <h3 className='text-2xl font-semibold text-slate-900'>{item.recipe.title}</h3>
          <p className='text-sm text-slate-600'>
            Add fresh portions, override status, and log the expected arrival date. This
            updates the personalization engine immediately.
          </p>
        </div>

        <div className='mt-6 space-y-4'>
          <label className='block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500'>
            Add quantity
            <input
              type='number'
              min={1}
              value={state.quantityDelta}
              onChange={(event) =>
                onStateChange({ ...state, quantityDelta: event.target.value })
              }
              className='mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-400'
            />
          </label>
          <label className='block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500'>
            Expected restock date
            <input
              type='date'
              value={state.restockDate}
              onChange={(event) =>
                onStateChange({ ...state, restockDate: event.target.value })
              }
              className='mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-400'
            />
          </label>
          <label className='block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500'>
            Post-restock status
            <select
              value={state.status}
              onChange={(event) =>
                onStateChange({ ...state, status: event.target.value as InventoryStatus })
              }
              className='mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-400'
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
            className='flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_36px_rgba(16,185,129,0.25)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {pending ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin' />
                Recording…
              </>
            ) : (
              <>
                <RefreshCcw className='h-4 w-4' />
                Save restock
              </>
            )}
          </button>
          <button
            type='button'
            className='w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600'
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
    priceCents: item.recipe.priceCents,
    priceDisplay: currencyFormatter.format(item.recipe.priceCents / 100),
    calories: item.recipe.calories,
    proteinGrams: item.recipe.proteinGrams,
    carbsGrams: item.recipe.carbsGrams,
    fatGrams: item.recipe.fatGrams,
    macrosLabel,
    tags: item.recipe.tags ?? [],
    healthyHighlights: item.recipe.healthyHighlights ?? [],
    allergens: item.recipe.allergens ?? [],
    inventory: {
      status: item.status,
      quantity: item.quantity,
      unitLabel: item.unitLabel,
    },
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

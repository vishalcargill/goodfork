"use client";

import { useId, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import type { PantryItemView, PantryStatus } from "@/services/shared/pantry.types";
import type { PantryIngredientOption } from "@/types/pantry";
import { cn } from "@/lib/utils";

const fallbackEmojiRules: Array<{ pattern: RegExp; emoji: string }> = [
  { pattern: /(salmon|tuna|trout|fish|shrimp|prawn)/, emoji: "🐟" },
  { pattern: /(broccoli|broccolini|greens|kale|lettuce|spinach)/, emoji: "🥦" },
  { pattern: /(quinoa|farro|grain|rice|oat|seed)/, emoji: "🌾" },
  { pattern: /(citrus|lime|lemon|orange)/, emoji: "🍋" },
  { pattern: /(veggie|veg|salad)/, emoji: "🥗" },
  { pattern: /(tahini|dressing|sauce)/, emoji: "🥄" },
  { pattern: /(tofu|soy)/, emoji: "🧊" },
  { pattern: /(avocado)/, emoji: "🥑" },
  { pattern: /(chia)/, emoji: "🌱" },
  { pattern: /(chickpea|bean|lentil)/, emoji: "🫘" },
  { pattern: /(sweet-potato|yam)/, emoji: "🍠" },
  { pattern: /(berry|blueberry|strawberry)/, emoji: "🫐" },
];
const DEFAULT_INGREDIENT_EMOJI = "🧂";

type PantryManagerProps = {
  initialItems: PantryItemView[];
  ingredientOptions?: PantryIngredientOption[];
  variant?: "personal" | "global";
};

type PantryMutationResponse = {
  success: boolean;
  pantry: PantryItemView[];
  message?: string;
};

type ExpiryMeta = {
  copy: string;
  tone: "muted" | "warning" | "danger";
};

export function PantryManager({ initialItems, ingredientOptions = [], variant = "personal" }: PantryManagerProps) {
  const [items, setItems] = useState<PantryItemView[]>(initialItems);
  const [newItemSlug, setNewItemSlug] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState("unit");
  const [filterTerm, setFilterTerm] = useState("");
  const datalistId = useId();

  const emojiLookup = useMemo(() => {
    const map: Record<string, string> = {};
    ingredientOptions.forEach((option) => {
      if (option.emoji) {
        map[option.slug] = option.emoji;
        map[option.slug.toLowerCase()] = option.emoji;
      }
    });
    return map;
  }, [ingredientOptions]);

  const successCopy = variant === "global" ? "Operator pantry updated" : "Pantry updated";
  const scopeQuery = variant === "global" ? "?scope=global" : "";
  const restockMutation = useInventoryMutation(
    `/api/pantry/restock${scopeQuery}`,
    setItems,
    "POST",
    successCopy
  );
  const consumeMutation = useInventoryMutation(
    `/api/pantry/consume${scopeQuery}`,
    setItems,
    "POST",
    successCopy
  );
  const upsertMutation = useInventoryMutation(`/api/pantry${scopeQuery}`, setItems, "PATCH", successCopy);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.ingredientName.localeCompare(b.ingredientName)),
    [items]
  );

  const visibleItems = useMemo(() => {
    if (!filterTerm.trim()) {
      return sortedItems;
    }

    const haystack = filterTerm.trim().toLowerCase();
    return sortedItems.filter((item) =>
      `${item.ingredientName} ${item.ingredientSlug}`.toLowerCase().includes(haystack)
    );
  }, [filterTerm, sortedItems]);

  const statusThemes: Record<PantryStatus, string> = {
    IN_STOCK: "border-emerald-200 bg-emerald-50 text-emerald-800",
    LOW_STOCK: "border-amber-200 bg-amber-50 text-amber-900",
    OUT_OF_STOCK: "border-rose-200 bg-rose-50 text-rose-700",
  };

  const restockPresets = variant === "global" ? [1, 5, 12] : [1];
  const consumePresets = variant === "global" ? [1, 4] : [1];
  const headerCopy =
    variant === "global"
      ? {
          title: "Operator pantry",
          description: "Adjust ingredient availability powering every demo card.",
        }
      : {
          title: "Pantry items",
          description: "Restock, consume, or add ingredients to sync with your recommendations.",
        };

  const handleRestock = (slug: string, amount = 1) => {
    restockMutation.mutate({ items: [{ ingredientSlug: slug, amount }] });
  };

  const handleConsume = (slug: string, amount = 1) => {
    consumeMutation.mutate({ items: [{ ingredientSlug: slug, amount }] });
  };

  const handleSlugChange = (value: string) => {
    if (!value) {
      setNewItemSlug("");
      setNewItemUnit("unit");
      return;
    }
    setNewItemSlug(value);
    const matched = ingredientOptions.find((option) => option.slug === value);
    if (matched) {
      setNewItemUnit(matched.defaultUnit);
    }
  };

  const handleAddItem = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newItemSlug.trim()) {
      toast.error("Add an ingredient slug before saving.");
      return;
    }

    const matchedIngredient = ingredientOptions.find((option) => option.slug === newItemSlug.trim());

    upsertMutation.mutate({
      items: [
        {
          ingredientSlug: newItemSlug.trim(),
          quantity: newItemQuantity,
          unitLabel: newItemUnit.trim() || matchedIngredient?.defaultUnit || "unit",
          status: newItemQuantity > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
        },
      ],
    });

    setNewItemSlug("");
    setNewItemQuantity(1);
    setNewItemUnit("unit");
  };

  const ingredientPlaceholder = ingredientOptions.length ? "Search or type ingredient slug" : "e.g., salmon-fillet";
  const emojiFor = (slug: string) => resolveIngredientEmoji(slug, emojiLookup);

  return (
    <section className='space-y-6 rounded-[28px] border border-emerald-100 bg-white/90 p-6 shadow-[0_20px_60px_rgba(16,185,129,0.12)]'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div className='space-y-3'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700'>Pantry</p>
            <h2 className='text-xl font-semibold text-slate-900'>{headerCopy.title}</h2>
          </div>
          <p className='text-sm text-slate-600'>{headerCopy.description}</p>
          <label className='flex flex-col text-xs font-semibold text-slate-600 sm:max-w-xs'>
            Search pantry
            <input
              type='search'
              value={filterTerm}
              onChange={(event) => setFilterTerm(event.target.value)}
              className='mt-1 rounded-xl border border-emerald-100 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:outline-none'
              placeholder='Filter by name or slug'
            />
          </label>
        </div>
        <form className='flex flex-col gap-2 rounded-2xl border border-emerald-100 bg-white/80 p-4 sm:w-1/2' onSubmit={handleAddItem}>
          <label className='flex flex-col text-xs font-semibold text-slate-600'>
            Ingredient
            <input
              type='text'
              value={newItemSlug}
              onChange={(event) => handleSlugChange(event.target.value)}
              list={ingredientOptions.length ? datalistId : undefined}
              className='mt-1 rounded-xl border border-emerald-100 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:outline-none'
              placeholder={ingredientPlaceholder}
            />
          </label>
          {ingredientOptions.length ? (
            <label className='flex flex-col text-xs font-semibold text-slate-600'>
              Quick select
              <select
                value={newItemSlug ? newItemSlug : ""}
                onChange={(event) => handleSlugChange(event.target.value)}
                className='mt-1 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:outline-none'
              >
                <option value=''>Pick an ingredient</option>
                {ingredientOptions.map((option) => (
                  <option key={`select-${option.slug}`} value={option.slug}>
                    {emojiFor(option.slug)} {option.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {ingredientOptions.length ? (
            <datalist id={datalistId}>
              {ingredientOptions.map((option) => (
                <option key={option.slug} value={option.slug}>
                  {emojiFor(option.slug)} {option.name}
                </option>
              ))}
            </datalist>
          ) : null}
          <label className='flex flex-col text-xs font-semibold text-slate-600'>
            Quantity
            <input
              type='number'
              min={0}
              step={0.25}
              value={newItemQuantity}
              onChange={(event) => setNewItemQuantity(Number(event.target.value))}
              className='mt-1 rounded-xl border border-emerald-100 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:outline-none'
            />
          </label>
          <label className='flex flex-col text-xs font-semibold text-slate-600'>
            Unit
            <input
              type='text'
              value={newItemUnit}
              onChange={(event) => setNewItemUnit(event.target.value)}
              className='mt-1 rounded-xl border border-emerald-100 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:outline-none'
            />
          </label>
          <button
            type='submit'
            className='rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-[0_12px_32px_rgba(16,185,129,0.25)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60'
            disabled={upsertMutation.isPending}
          >
            {upsertMutation.isPending ? "Saving..." : "Save item"}
          </button>
        </form>
      </div>

      <div className='space-y-4'>
        {visibleItems.map((item) => {
          const expiryMeta = buildExpiryMeta(item.expiresOn);
          return (
            <div
              key={item.id}
              className='flex flex-col gap-4 rounded-3xl border border-emerald-100 bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between'
            >
              <div>
                <p className='text-sm font-semibold text-slate-900'>
                  <span className='mr-1 text-lg'>{emojiFor(item.ingredientSlug)}</span>
                  {item.ingredientName}
                </p>
                <p className='text-xs text-slate-500'>Slug: {item.ingredientSlug}</p>
                <span
                  className={cn(
                    "mt-2 inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold",
                    statusThemes[item.status]
                  )}
                >
                  {item.status === "IN_STOCK"
                    ? "Ready"
                    : item.status === "LOW_STOCK"
                    ? "Low stock"
                    : "Out of stock"}
                </span>
              </div>
              <div className='grid gap-2 text-sm text-slate-700 sm:grid-cols-3 sm:items-center'>
                <p>
                  Qty:{" "}
                  <span className='font-semibold text-slate-900'>
                    {item.quantity} {item.unitLabel}
                  </span>
                </p>
                <div className='flex flex-wrap gap-2'>
                  {consumePresets.map((amount) => (
                    <button
                      key={`${item.id}-consume-${amount}`}
                      type='button'
                      onClick={() => handleConsume(item.ingredientSlug, amount)}
                      disabled={consumeMutation.isPending}
                      className='inline-flex flex-1 items-center justify-center rounded-full border border-rose-100 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-200 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60'
                    >
                      Consume {amount}
                    </button>
                  ))}
                  {restockPresets.map((amount) => (
                    <button
                      key={`${item.id}-restock-${amount}`}
                      type='button'
                      onClick={() => handleRestock(item.ingredientSlug, amount)}
                      disabled={restockMutation.isPending}
                      className='inline-flex flex-1 items-center justify-center rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60'
                    >
                      Restock {amount}
                    </button>
                  ))}
                </div>
                <p
                  className={cn(
                    "text-xs",
                    expiryMeta.tone === "danger" && "text-rose-700",
                    expiryMeta.tone === "warning" && "text-amber-700",
                    expiryMeta.tone === "muted" && "text-slate-500"
                  )}
                >
                  {expiryMeta.copy}
                </p>
              </div>
            </div>
          );
        })}

        {!visibleItems.length && filterTerm.trim() && (
          <div className='rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/40 p-6 text-sm text-slate-600'>
            No matches for <span className='font-semibold text-slate-900'>{filterTerm}</span>. Try another ingredient name or clear search.
          </div>
        )}

        {!sortedItems.length && !filterTerm.trim() && (
          <div className='rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/40 p-6 text-sm text-slate-600'>
            No pantry items yet. Add ingredients above to unlock pantry-aware menus.
          </div>
        )}
      </div>
    </section>
  );
}

function buildExpiryMeta(expiresOn: string | null): ExpiryMeta {
  if (!expiresOn) {
    return { copy: "No expiry set", tone: "muted" };
  }

  const date = new Date(expiresOn);
  if (Number.isNaN(date.getTime())) {
    return { copy: "Expiry unknown", tone: "muted" };
  }

  const diffDays = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { copy: `Expired ${Math.abs(diffDays)}d ago`, tone: "danger" };
  }

  if (diffDays <= 3) {
    return { copy: `Expires in ${diffDays}d`, tone: "warning" };
  }

  return { copy: `Expires ${date.toLocaleDateString()}`, tone: "muted" };
}

function useInventoryMutation(
  url: string,
  setItems: (items: PantryItemView[]) => void,
  method: "POST" | "PATCH" = "POST",
  successMessage = "Pantry updated"
) {
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as PantryMutationResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message ?? "Pantry update failed");
      }

      return data.pantry;
    },
    onSuccess: (pantry) => {
      setItems(pantry);
      toast.success(successMessage);
    },
    onError: (error) => {
      console.error("Pantry mutation failed", error);
      toast.error("Unable to update pantry right now.");
    },
  });
}

function resolveIngredientEmoji(slug: string, emojiLookup: Record<string, string>) {
  if (!slug) {
    return DEFAULT_INGREDIENT_EMOJI;
  }

  const normalized = slug.toLowerCase();
  if (emojiLookup[normalized]) {
    return emojiLookup[normalized];
  }

  if (emojiLookup[slug]) {
    return emojiLookup[slug];
  }

  const rule = fallbackEmojiRules.find((candidate) => candidate.pattern.test(normalized));
  return rule?.emoji ?? DEFAULT_INGREDIENT_EMOJI;
}

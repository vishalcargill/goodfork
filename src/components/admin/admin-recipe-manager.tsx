"use client";

import { useMemo, useState } from "react";
import type { InventoryItem, InventoryStatus, Recipe } from "@/generated/prisma/client";

import { apiClient } from "@/config/axios.config";
import type { AdminRecipeInput } from "@/schema/admin-recipe.schema";
import type { RecommendationCard as RecommendationCardType } from "@/services/shared/recommendations.types";
import { RecommendationCard } from "@/components/recommendations/recommendations-demo";

const inventoryStatuses: InventoryStatus[] = ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"];

type RecipeWithInventory = Recipe & { inventory: InventoryItem | null };

type AdminRecipeManagerProps = {
  initialRecipes: RecipeWithInventory[];
};

type RecipeFormState = {
  id: string | null;
  slug: string;
  sourceId: string;
  sourceUrl: string;
  author: string;
  title: string;
  description: string;
  cuisine: string;
  calories: string;
  proteinGrams: string;
  carbsGrams: string;
  fatGrams: string;
  tags: string;
  allergens: string;
  healthyHighlights: string;
  ingredients: string;
  instructions: string;
  imageUrl: string;
  serves: string;
  difficulty: string;
  prepTimeMinutes: string;
  cookTimeMinutes: string;
  averageRating: string;
  ratingCount: string;
  dishType: string;
  mainCategory: string;
  subCategory: string;
  nutrients: string;
  timers: string;
  inventoryQuantity: string;
  inventoryUnitLabel: string;
  inventoryStatus: InventoryStatus;
  inventoryRestockDate: string;
};

const INITIAL_FORM: RecipeFormState = {
  id: null,
  slug: "",
  sourceId: "",
  sourceUrl: "",
  author: "",
  title: "",
  description: "",
  cuisine: "",
  calories: "",
  proteinGrams: "",
  carbsGrams: "",
  fatGrams: "",
  tags: "",
  allergens: "",
  healthyHighlights: "",
  ingredients: "",
  instructions: "",
  imageUrl: "",
  serves: "",
  difficulty: "",
  prepTimeMinutes: "",
  cookTimeMinutes: "",
  averageRating: "",
  ratingCount: "",
  dishType: "",
  mainCategory: "",
  subCategory: "",
  nutrients: "",
  timers: "",
  inventoryQuantity: "",
  inventoryUnitLabel: "servings",
  inventoryStatus: "IN_STOCK",
  inventoryRestockDate: "",
};

const listFormat = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
});

function createEmptyForm(): RecipeFormState {
  return { ...INITIAL_FORM };
}

function joinList(values?: string[] | null) {
  return values?.length ? values.join("\n") : "";
}

function joinLines(values?: string[] | null) {
  return values?.length ? values.join("\n") : "";
}

function formatRestockDate(raw?: Date | string | null) {
  if (!raw) {
    return "";
  }
  const date = typeof raw === "string" ? new Date(raw) : raw;
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const iso = date.toISOString().split("T")[0];
  return iso;
}

function mapRecipeToForm(recipe: RecipeWithInventory): RecipeFormState {
  return {
    id: recipe.id,
    slug: recipe.slug,
    sourceId: recipe.sourceId ?? "",
    sourceUrl: recipe.sourceUrl ?? "",
    author: recipe.author ?? "",
    title: recipe.title,
    description: recipe.description ?? "",
    cuisine: recipe.cuisine ?? "",
    calories: recipe.calories?.toString() ?? "",
    proteinGrams: recipe.proteinGrams?.toString() ?? "",
    carbsGrams: recipe.carbsGrams?.toString() ?? "",
    fatGrams: recipe.fatGrams?.toString() ?? "",
    tags: joinList(recipe.tags),
    allergens: joinList(recipe.allergens),
    healthyHighlights: joinList(recipe.healthyHighlights),
    ingredients: joinLines(recipe.ingredients),
    instructions: joinLines(recipe.instructions),
    imageUrl: recipe.imageUrl ?? "",
    serves: recipe.serves?.toString() ?? "",
    difficulty: recipe.difficulty ?? "",
    prepTimeMinutes: recipe.prepTimeMinutes?.toString() ?? "",
    cookTimeMinutes: recipe.cookTimeMinutes?.toString() ?? "",
    averageRating: recipe.averageRating?.toString() ?? "",
    ratingCount: recipe.ratingCount?.toString() ?? "",
    dishType: recipe.dishType ?? "",
    mainCategory: recipe.mainCategory ?? "",
    subCategory: recipe.subCategory ?? "",
    nutrients: recipe.nutrients ? JSON.stringify(recipe.nutrients, null, 2) : "",
    timers: recipe.timers ? JSON.stringify(recipe.timers, null, 2) : "",
    inventoryQuantity: recipe.inventory?.quantity?.toString() ?? "",
    inventoryUnitLabel: recipe.inventory?.unitLabel ?? "servings",
    inventoryStatus: recipe.inventory?.status ?? "IN_STOCK",
    inventoryRestockDate: formatRestockDate(recipe.inventory?.restockDate ?? null),
  };
}

function splitList(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseOptionalInt(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

function parseOptionalFloat(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildPayload(form: RecipeFormState): AdminRecipeInput {
  const quantity = parseOptionalInt(form.inventoryQuantity);
  if (quantity === null || quantity < 0) {
    throw new Error("Inventory quantity must be a non-negative number.");
  }

  let nutrients: AdminRecipeInput["nutrients"] = null;
  if (form.nutrients.trim()) {
    try {
      nutrients = JSON.parse(form.nutrients) as AdminRecipeInput["nutrients"];
    } catch {
      throw new Error("Nutrients JSON is invalid.");
    }
  }

  let timers: AdminRecipeInput["timers"] = null;
  if (form.timers.trim()) {
    try {
      timers = JSON.parse(form.timers) as AdminRecipeInput["timers"];
    } catch {
      throw new Error("Timers JSON is invalid.");
    }
  }

  return {
    slug: form.slug.trim(),
    sourceId: form.sourceId.trim() || null,
    sourceUrl: form.sourceUrl.trim() || null,
    author: form.author.trim() || null,
    title: form.title.trim(),
    description: form.description.trim() || null,
    cuisine: form.cuisine.trim() || null,
    calories: parseOptionalInt(form.calories),
    proteinGrams: parseOptionalInt(form.proteinGrams),
    carbsGrams: parseOptionalInt(form.carbsGrams),
    fatGrams: parseOptionalInt(form.fatGrams),
    tags: splitList(form.tags),
    allergens: splitList(form.allergens),
    healthyHighlights: splitList(form.healthyHighlights),
    ingredients: splitLines(form.ingredients),
    instructions: splitLines(form.instructions),
    imageUrl: form.imageUrl.trim() || null,
    serves: parseOptionalInt(form.serves),
    difficulty: form.difficulty.trim() || null,
    prepTimeMinutes: parseOptionalInt(form.prepTimeMinutes),
    cookTimeMinutes: parseOptionalInt(form.cookTimeMinutes),
    averageRating: parseOptionalFloat(form.averageRating),
    ratingCount: parseOptionalInt(form.ratingCount),
    dishType: form.dishType.trim() || null,
    mainCategory: form.mainCategory.trim() || null,
    subCategory: form.subCategory.trim() || null,
    nutrients,
    timers,
    inventory: {
      quantity,
      unitLabel: form.inventoryUnitLabel.trim() || "unit",
      status: form.inventoryStatus,
      restockDate: form.inventoryRestockDate.trim() || null,
    },
  };
}

function buildPreviewCard(form: RecipeFormState): RecommendationCardType {
  const quantity = parseOptionalInt(form.inventoryQuantity) ?? 0;
  const calories = parseOptionalInt(form.calories);
  const protein = parseOptionalInt(form.proteinGrams);
  const carbs = parseOptionalInt(form.carbsGrams);
  const fat = parseOptionalInt(form.fatGrams);
  const unitLabel = form.inventoryUnitLabel || "unit";

  return {
    recommendationId: "preview",
    recipeId: form.id ?? "preview",
    slug: form.slug || "preview-recipe",
    title: form.title || "Recipe preview",
    description: form.description || null,
    imageUrl: form.imageUrl.trim() || null,
    calories,
    proteinGrams: protein,
    carbsGrams: carbs,
    fatGrams: fat,
    macrosLabel: deriveMacrosLabel({ calories, protein, carbs, fat }),
    tags: splitList(form.tags),
    healthyHighlights: splitList(form.healthyHighlights),
    allergens: splitList(form.allergens),
    pantry: buildPreviewPantry(form.inventoryStatus, quantity, unitLabel),
    rationale:
      form.description.trim() ||
      "Preview how AI rationale will render here once the recommendation service ranks this recipe.",
    healthySwapCopy: null,
    swapRecipe: null,
    metadata: {
      rankingSource: "deterministic",
      baseScore: 80,
      adjustments: [],
    },
  };
}

function buildPreviewPantry(
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

  return {
    status: safeStatus,
    cookableServings,
    missingIngredients: safeStatus === "OUT_OF_STOCK" ? [placeholder] : [],
    lowStockIngredients: safeStatus === "LOW_STOCK" ? [placeholder] : [],
    operatorStatus: safeStatus,
    operatorMissingIngredients: safeStatus === "OUT_OF_STOCK" ? [placeholder] : [],
    operatorLowStockIngredients: safeStatus === "LOW_STOCK" ? [placeholder] : [],
  };
}

function deriveMacrosLabel({
  calories,
  protein,
  carbs,
  fat,
}: {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}) {
  if (protein && protein >= 30) {
    return "Fuel forward";
  }
  if (calories && calories <= 450) {
    return "Lighter choice";
  }
  if (carbs && carbs >= 60) {
    return "Energy boost";
  }
  if (fat && fat >= 25) {
    return "Comforting";
  }
  return "Balanced macros";
}

export function AdminRecipeManager({ initialRecipes }: AdminRecipeManagerProps) {
  const [recipes, setRecipes] = useState<RecipeWithInventory[]>(initialRecipes);
  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(
    initialRecipes[0]?.id ?? null
  );
  const [formState, setFormState] = useState<RecipeFormState>(() =>
    initialRecipes[0] ? mapRecipeToForm(initialRecipes[0]) : createEmptyForm()
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewCard = useMemo(() => buildPreviewCard(formState), [formState]);
  const isEditing = Boolean(activeRecipeId);

  const handleSelect = (recipe: RecipeWithInventory) => {
    setError(null);
    setMessage(null);
    setActiveRecipeId(recipe.id);
    setFormState(mapRecipeToForm(recipe));
  };

  const handleCreateNew = () => {
    setError(null);
    setMessage(null);
    setActiveRecipeId(null);
    setFormState(createEmptyForm());
  };

  const handleFieldChange = <K extends keyof RecipeFormState>(field: K, value: RecipeFormState[K]) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const persistRecipe = async () => {
    setError(null);
    setMessage(null);

    try {
      setIsSaving(true);
      const payload = buildPayload(formState);
      const response = activeRecipeId
        ? await apiClient.put(`/admin/recipes/${activeRecipeId}`, payload)
        : await apiClient.post("/admin/recipes", payload);
      const { data } = response;

      if (!data.success) {
        throw new Error(data.message ?? "Unable to save recipe.");
      }

      const saved: RecipeWithInventory = data.recipe;
      setRecipes((prev) => {
        const copy = [...prev.filter((entry) => entry.id !== saved.id), saved];
        return copy.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
      setActiveRecipeId(saved.id);
      setFormState(mapRecipeToForm(saved));
      setMessage(activeRecipeId ? "Recipe updated." : "Recipe created.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save recipe.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRecipe = async () => {
    if (!activeRecipeId) {
      return;
    }

    const confirmed = window.confirm("Delete this recipe? This action cannot be undone.");
    if (!confirmed) {
      return;
    }

    setError(null);
    setMessage(null);

    try {
      setIsDeleting(true);
      const { data } = await apiClient.delete(`/admin/recipes/${activeRecipeId}`);
      if (!data.success) {
        throw new Error(data.message ?? "Unable to delete recipe.");
      }

      const remaining = recipes.filter((recipe) => recipe.id !== activeRecipeId);
      setRecipes(remaining);
      if (remaining.length) {
        const nextRecipe = remaining[0];
        setActiveRecipeId(nextRecipe.id);
        setFormState(mapRecipeToForm(nextRecipe));
      } else {
        setActiveRecipeId(null);
        setFormState(createEmptyForm());
      }
      setMessage("Recipe deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete recipe.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className='grid gap-6 lg:grid-cols-[40%_60%] lg:items-start'>
      <aside className='rounded-xl border border-border bg-card p-4 shadow-sm lg:sticky lg:top-24'>
        <div className='flex items-center justify-between gap-3 pb-4'>
          <h2 className='text-xs font-bold uppercase tracking-wider text-primary'>Recipe List</h2>
          <button
            type='button'
            onClick={handleCreateNew}
            className='rounded-full bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-sm hover:bg-primary/90'
          >
            New
          </button>
        </div>
        <div className='h-[55vh] space-y-2 overflow-y-auto pr-2 lg:h-[72vh]'>
          {recipes.length === 0 ? (
            <p className='text-sm text-muted-foreground'>No recipes yet — add your first one.</p>
          ) : (
            recipes.map((recipe) => (
              <button
                key={recipe.id}
                type='button'
                onClick={() => handleSelect(recipe)}
                className={`w-full rounded-lg border px-3 py-3 text-left shadow-sm transition ${
                  activeRecipeId === recipe.id
                    ? "border-primary bg-surface ring-1 ring-primary"
                    : "border-transparent bg-surface-subtle hover:border-border"
                }`}
              >
                <p className='text-sm font-semibold text-foreground'>{recipe.title}</p>
                <p className='text-xs text-muted-foreground'>
                  {recipe.cuisine ?? "No cuisine"} · Updated {listFormat.format(new Date(recipe.updatedAt))}
                </p>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className='space-y-6'>
        <div className='rounded-xl border border-border bg-card p-6 shadow-sm'>
          <div className='flex flex-wrap items-center justify-between gap-3 pb-4'>
            <div>
              <h3 className='text-lg font-semibold text-foreground'>Recipe details</h3>
              <p className='text-sm text-muted-foreground'>Every field maps to the Prisma model.</p>
            </div>
            <div className='flex gap-3'>
              {isEditing ? (
                <button
                  type='button'
                  onClick={deleteRecipe}
                  disabled={isDeleting}
                  className='rounded-full border border-destructive/30 px-4 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/10 disabled:opacity-50'
                >
                  {isDeleting ? "Deleting…" : "Delete"}
                </button>
              ) : null}
              <button
                type='button'
                onClick={persistRecipe}
                disabled={isSaving}
                className='rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50'
              >
                {isSaving ? "Saving…" : isEditing ? "Update" : "Create"}
              </button>
            </div>
          </div>

          {error ? (
            <p className='rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive'>{error}</p>
          ) : null}
          {message ? (
            <p className='rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm text-success'>
              {message}
            </p>
          ) : null}

          <div className='grid gap-6 lg:grid-cols-2 lg:max-h-[62vh] lg:overflow-y-auto lg:pr-2'>
            <div className='space-y-4'>
              <TextField label='Title' value={formState.title} onChange={(value) => handleFieldChange("title", value)} required />
              <TextField label='Slug' value={formState.slug} onChange={(value) => handleFieldChange("slug", value)} helper='Must be unique.' />
              <TextField label='Source ID' value={formState.sourceId} onChange={(value) => handleFieldChange("sourceId", value)} helper='Optional external identifier.' />
              <TextField label='Source URL' value={formState.sourceUrl} onChange={(value) => handleFieldChange("sourceUrl", value)} />
              <TextField label='Author' value={formState.author} onChange={(value) => handleFieldChange("author", value)} />
              <TextField label='Image URL' value={formState.imageUrl} onChange={(value) => handleFieldChange("imageUrl", value)} />
              <TextareaField label='Description' value={formState.description} onChange={(value) => handleFieldChange("description", value)} rows={4} />
              <TextField label='Cuisine' value={formState.cuisine} onChange={(value) => handleFieldChange("cuisine", value)} />
              <TextField label='Serves' value={formState.serves} onChange={(value) => handleFieldChange("serves", value)} />
              <div className='grid grid-cols-2 gap-3'>
                <TextField label='Difficulty' value={formState.difficulty} onChange={(value) => handleFieldChange("difficulty", value)} />
                <TextField label='Dish Type' value={formState.dishType} onChange={(value) => handleFieldChange("dishType", value)} />
              </div>
              <TextField label='Main Category' value={formState.mainCategory} onChange={(value) => handleFieldChange("mainCategory", value)} />
              <TextField label='Sub Category' value={formState.subCategory} onChange={(value) => handleFieldChange("subCategory", value)} />
              <div className='grid grid-cols-2 gap-3'>
                <TextField label='Prep Time (min)' value={formState.prepTimeMinutes} onChange={(value) => handleFieldChange("prepTimeMinutes", value)} />
                <TextField label='Cook Time (min)' value={formState.cookTimeMinutes} onChange={(value) => handleFieldChange("cookTimeMinutes", value)} />
              </div>
            </div>

            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-3'>
                <TextField label='Calories' value={formState.calories} onChange={(value) => handleFieldChange("calories", value)} />
                <TextField label='Protein (g)' value={formState.proteinGrams} onChange={(value) => handleFieldChange("proteinGrams", value)} />
              </div>
              <div className='grid grid-cols-2 gap-3'>
                <TextField label='Carbs (g)' value={formState.carbsGrams} onChange={(value) => handleFieldChange("carbsGrams", value)} />
                <TextField label='Fat (g)' value={formState.fatGrams} onChange={(value) => handleFieldChange("fatGrams", value)} />
              </div>
              <div className='grid grid-cols-2 gap-3'>
                <TextField label='Average Rating' value={formState.averageRating} onChange={(value) => handleFieldChange("averageRating", value)} />
                <TextField label='Rating Count' value={formState.ratingCount} onChange={(value) => handleFieldChange("ratingCount", value)} />
              </div>
              <TextareaField label='Tags (one per line or comma separated)' value={formState.tags} onChange={(value) => handleFieldChange("tags", value)} rows={3} />
              <TextareaField label='Healthy Highlights' value={formState.healthyHighlights} onChange={(value) => handleFieldChange("healthyHighlights", value)} rows={3} />
              <TextareaField label='Allergens' value={formState.allergens} onChange={(value) => handleFieldChange("allergens", value)} rows={3} />
              <TextareaField label='Ingredients (one per line)' value={formState.ingredients} onChange={(value) => handleFieldChange("ingredients", value)} rows={4} />
              <TextareaField label='Instructions (step per line)' value={formState.instructions} onChange={(value) => handleFieldChange("instructions", value)} rows={4} />
              <TextareaField label='Nutrients JSON' value={formState.nutrients} onChange={(value) => handleFieldChange("nutrients", value)} rows={3} helper='Optional. Provide JSON object of nutrient values.' />
              <TextareaField label='Timers JSON' value={formState.timers} onChange={(value) => handleFieldChange("timers", value)} rows={3} helper='Optional. Provide JSON object of prep/cook timers.' />
              <div className='rounded-xl border border-border p-4 bg-surface-subtle'>
                <p className='text-sm font-semibold text-foreground'>Inventory</p>
                <div className='mt-3 grid grid-cols-2 gap-3'>
                  <TextField label='Quantity' value={formState.inventoryQuantity} onChange={(value) => handleFieldChange("inventoryQuantity", value)} required />
                  <TextField label='Unit Label' value={formState.inventoryUnitLabel} onChange={(value) => handleFieldChange("inventoryUnitLabel", value)} />
                </div>
                <div className='mt-3 grid grid-cols-2 gap-3'>
                  <label className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                    Status
                    <select
                      value={formState.inventoryStatus}
                      onChange={(event) =>
                        handleFieldChange("inventoryStatus", event.target.value as InventoryStatus)
                      }
                      className='mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground shadow-sm outline-none focus:ring-2 focus:ring-primary'
                    >
                      {inventoryStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </label>
                  <TextField
                    label='Restock Date'
                    type='date'
                    value={formState.inventoryRestockDate}
                    onChange={(value) => handleFieldChange("inventoryRestockDate", value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='rounded-xl border border-border bg-card p-6 shadow-sm'>
          <div className='flex items-center justify-between pb-4'>
            <div>
              <h3 className='text-lg font-semibold text-foreground'>Preview</h3>
              <p className='text-sm text-muted-foreground'>Live render of the recommendation card.</p>
            </div>
          </div>
          <RecommendationCard card={previewCard} userId='preview-user' readOnly />
        </div>
      </section>
    </div>
  );
}

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  helper?: string;
};

function TextField({ label, value, onChange, required, type = "text", helper }: TextFieldProps) {
  return (
    <label className='block text-xs font-bold uppercase tracking-wider text-muted-foreground'>
      {label}
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className='mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground shadow-sm outline-none focus:ring-2 focus:ring-primary'
      />
      {helper ? <span className='mt-1 block text-[11px] text-muted-foreground'>{helper}</span> : null}
    </label>
  );
}

type TextareaFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  helper?: string;
};

function TextareaField({ label, value, onChange, rows = 4, helper }: TextareaFieldProps) {
  return (
    <label className='block text-xs font-bold uppercase tracking-wider text-muted-foreground'>
      {label}
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className='mt-2 w-full resize-y rounded-lg border border-border px-3 py-2 text-sm text-foreground shadow-sm outline-none focus:ring-2 focus:ring-primary'
      />
      {helper ? <span className='mt-1 block text-[11px] text-muted-foreground'>{helper}</span> : null}
    </label>
  );
}

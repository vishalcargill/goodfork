import type { PantryIngredientOption } from "@/types/pantry";

export type IngredientCatalogEntry = PantryIngredientOption;

export const CURATED_INGREDIENTS: IngredientCatalogEntry[] = [
  { slug: "salmon-fillet", name: "Salmon fillet", defaultUnit: "fillet", emoji: "🐟" },
  { slug: "broccolini", name: "Broccolini", defaultUnit: "cup", emoji: "🥦" },
  { slug: "quinoa", name: "Tri-color quinoa", defaultUnit: "cup", emoji: "🌾" },
  { slug: "citrus-glaze", name: "Citrus herb glaze", defaultUnit: "oz", emoji: "🍋" },
  { slug: "rainbow-veggies", name: "Rainbow veggies", defaultUnit: "cup", emoji: "🥗" },
  { slug: "farro", name: "Farro", defaultUnit: "cup", emoji: "🌾" },
  { slug: "baby-kale", name: "Baby kale", defaultUnit: "cup", emoji: "🥬" },
  { slug: "tahini", name: "Tahini dressing", defaultUnit: "oz", emoji: "🥄" },
  { slug: "tofu", name: "Crispy tofu", defaultUnit: "block", emoji: "🧊" },
  { slug: "butter-lettuce", name: "Butter lettuce", defaultUnit: "cup", emoji: "🥬" },
  { slug: "lime-vinaigrette", name: "Lime vinaigrette", defaultUnit: "oz", emoji: "🍈" },
  { slug: "veggie-crunch", name: "Veggie crunch mix", defaultUnit: "cup", emoji: "🥕" },
  { slug: "avocado", name: "Avocado", defaultUnit: "whole", emoji: "🥑" },
  { slug: "chia-seeds", name: "Chia seeds", defaultUnit: "tbsp", emoji: "🌱" },
  { slug: "rolled-oats", name: "Rolled oats", defaultUnit: "cup", emoji: "🥣" },
  { slug: "almond-milk", name: "Almond milk", defaultUnit: "cup", emoji: "🥛" },
  { slug: "blueberries", name: "Blueberries", defaultUnit: "cup", emoji: "🫐" },
  { slug: "spinach", name: "Baby spinach", defaultUnit: "cup", emoji: "🌿" },
  { slug: "chickpeas", name: "Chickpeas", defaultUnit: "cup", emoji: "🫘" },
  { slug: "sweet-potato", name: "Sweet potato", defaultUnit: "whole", emoji: "🍠" },
];

export function mergeIngredientOptions(
  dbIngredients: Array<{ slug: string; name: string; defaultUnit: string | null }> = []
): PantryIngredientOption[] {
  const map = new Map<string, PantryIngredientOption>();

  dbIngredients.forEach((ingredient) => {
    map.set(ingredient.slug, {
      slug: ingredient.slug,
      name: ingredient.name,
      defaultUnit: ingredient.defaultUnit ?? "unit",
    });
  });

  CURATED_INGREDIENTS.forEach((entry) => {
    const existing = map.get(entry.slug);
    if (existing) {
      map.set(entry.slug, {
        ...existing,
        emoji: entry.emoji ?? existing.emoji,
        defaultUnit: existing.defaultUnit || entry.defaultUnit,
      });
    } else {
      map.set(entry.slug, entry);
    }
  });

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export type PantryStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export type PantryItemView = {
  id: string;
  ingredientSlug: string;
  ingredientName: string;
  unitLabel: string;
  quantity: number;
  status: PantryStatus;
  expiresOn: string | null;
};

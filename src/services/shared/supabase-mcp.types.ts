export type SupabaseUserRow = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
};

export type SupabaseUserProfileRow = {
  id: string;
  userId: string;
  dietaryGoals: string[];
  allergens: string[];
  dietaryPreferences: string[];
  tastePreferences: string[];
  lifestyleNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SupabaseRecipeRow = {
  id: string;
  slug: string;
  sourceId: string | null;
  sourceUrl: string | null;
  author: string | null;
  title: string;
  description: string | null;
  cuisine: string | null;
  calories: number | null;
  proteinGrams: number | null;
  carbsGrams: number | null;
  fatGrams: number | null;
  priceCents: number;
  tags: string[];
  allergens: string[];
  ingredients: string[];
  instructions: string[];
  imageUrl: string | null;
  healthyHighlights: string[];
  serves: number | null;
  difficulty: string | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  averageRating: number | null;
  ratingCount: number | null;
  dishType: string | null;
  mainCategory: string | null;
  subCategory: string | null;
  nutrients: unknown;
  timers: unknown;
  createdAt: string;
  updatedAt: string;
};

export type SupabaseInventoryRow = {
  id: string;
  recipeId: string;
  quantity: number;
  unitLabel: string;
  restockDate: string | null;
  status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  createdAt: string;
  updatedAt: string;
};

export type SupabaseRecommendationRow = {
  id: string;
  userId: string;
  recipeId: string;
  healthySwapRecipeId: string | null;
  rationale: string;
  healthySwapRationale: string | null;
  status: "SHOWN" | "SAVED" | "ACCEPTED" | "DECLINED" | "SWAPPED";
  sessionId: string | null;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
};

export type SupabaseFeedbackRow = {
  id: string;
  recommendationId: string;
  userId: string;
  action: "ACCEPT" | "SAVE" | "SWAP";
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  notes: string | null;
  createdAt: string;
};

export type SupabaseBulkImportPayload = {
  users: SupabaseUserRow[];
  profiles: SupabaseUserProfileRow[];
  recipes: SupabaseRecipeRow[];
  inventory: SupabaseInventoryRow[];
  recommendations: SupabaseRecommendationRow[];
  feedback: SupabaseFeedbackRow[];
};

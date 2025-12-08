export const GOAL_OPTIONS = [
  {
    value: "LEAN_MUSCLE",
    label: "Lean muscle",
    helper: "High-protein focus",
  },
  {
    value: "ENERGY",
    label: "Sustained energy",
    helper: "Balanced macros",
  },
  {
    value: "RESET",
    label: "Metabolic reset",
    helper: "Lower sugar & refined carbs",
  },
  {
    value: "BRAINCARE",
    label: "Brain care",
    helper: "Omega-3 + micronutrient dense",
  },
] as const;

export const ALLERGEN_OPTIONS = [
  { value: "DAIRY", label: "Dairy" },
  { value: "EGGS", label: "Eggs" },
  { value: "FISH", label: "Fish" },
  { value: "SHELLFISH", label: "Shellfish" },
  { value: "SOY", label: "Soy" },
  { value: "TREE_NUTS", label: "Tree nuts" },
  { value: "PEANUTS", label: "Peanuts" },
  { value: "GLUTEN", label: "Gluten" },
  { value: "SESAME", label: "Sesame" },
] as const;

export const DIET_OPTIONS = [
  { value: "VEGETARIAN", label: "Vegetarian" },
  { value: "VEGAN", label: "Vegan" },
  { value: "PESCATARIAN", label: "Pescatarian" },
  { value: "MEDITERRANEAN", label: "Mediterranean" },
  { value: "LOW_CARB", label: "Lower carb" },
] as const;

export const TASTE_OPTIONS = [
  { value: "SPICY", label: "Spicy kick" },
  { value: "COMFORT", label: "Comforting" },
  { value: "BRIGHT", label: "Bright & citrusy" },
  { value: "UMAMI", label: "Umami-rich" },
  { value: "EXPLORER", label: "Adventurous" },
] as const;

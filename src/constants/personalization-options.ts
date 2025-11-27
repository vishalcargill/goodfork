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

export const BUDGET_OPTIONS = [
  { value: 1200, label: "Under $12", helper: "Light lunch range" },
  { value: 1500, label: "$12 – $15", helper: "Balanced splurge" },
  { value: 1800, label: "$15 – $18", helper: "Chef-driven picks" },
] as const;

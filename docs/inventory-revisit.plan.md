# Ingredient-Level Inventory Revisit (Personal Pantry)

## Context
- Current model tracks inventory per recipe, which fits a restaurant but not an individual user.
- For a personal healthy-eating assistant, inventory should mirror the user’s pantry/fridge, with recipes consuming ingredient stocks to determine cookability and gaps.
- Seed data lives in `data/recipes.json` and needs normalization into structured ingredients with per-serving quantities/units.

## Objectives
- Represent pantry at the ingredient level (quantity, unit, freshness) and link recipes to required ingredients/quantities.
- Drive recommendations by pantry availability, highlighting what’s cookable now, what needs a quick add, and healthy swaps that use on-hand items.
- Provide simple pantry management (add/edit items, restock, decrement after cooking) plus optional grocery gap hints.

## Proposed Data Model (Prisma)
- `Ingredient`: id, slug, name, defaultUnit, allergens[], tags[].
- `RecipeIngredient`: recipeId, ingredientId, quantityPerServing (decimal), unitOverride?, notes?.
- `PantryItem`: ingredientId, quantity, unitLabel, status (`IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`), expiresOn?, createdAt/updatedAt.
- Deprecate `InventoryItem` once migration is done; keep a compatibility view/transition if needed during rollout.

## Migration Plan
1) Add new models and regenerate client (`npm run prisma:generate` after migration).  
2) Migration script:  
   - Parse `Recipe.ingredients` strings into structured Ingredient + RecipeIngredient rows (best-effort mapping, log unparsed items).  
   - Seed PantryItem per Ingredient with default quantities (e.g., common pantry staples) or mark `LOW_STOCK` if unknown.  
   - Backfill a derived “cookableServings” per recipe for validation.  
3) Remove/ignore `InventoryItem` usages after feature parity; mark deprecated in code until fully removed.

## Recommendation Logic Changes
- Load recipes with `recipeIngredients` + user `pantryItems`.
- Compute `cookableServings = min(floor(pantry.qty / recipeIngredient.qtyPerServing))`.
- Filtering: show cookable recipes first; include “needs X” recipes with shortfall messaging; exclude when pantry empty or user opts to hide unavailable.
- Scoring: penalize low servings (<2), boost soon-to-expire ingredients, suggest swaps that are fully available.
- Rationale copy: “Ready now (3 servings; plenty of oats)” or “Missing 1 egg—try chia oatmeal instead.”

## API & Validation Updates
- Replace admin inventory API with user-scoped pantry API:  
  - `GET /api/pantry` (list items, filters by status/expiring).  
  - `PATCH /api/pantry` (bulk edits quantities/status/unit/expiry).  
  - `POST /api/pantry/restock` (increment).  
  - `POST /api/pantry/consume` (decrement after cooking).
- Update recommendation service to read pantry availability and expose shortfalls in the response payload.
- Update schemas (Zod) for ingredient payloads and pantry edits; remove recipe-level inventory fields from recipe schemas.

## UI/UX Updates
- Pantry screen (new or adapted from admin inventory): search, add ingredient, set quantity/unit, expiry, mark low/out, quick restock, and “consume” actions.
- Menus page: badges for cookable vs needs-X, shortfall chips per recipe, and CTA to add missing items to a grocery list.
- Recipe editor (if kept): structured ingredient picker with quantity/unit per serving.
- Healthy swap suggestions should prioritize on-hand ingredients and soon-to-expire items.

## Seed & Import
- Normalize `data/recipes.json` to include ingredient objects `{ ingredientSlug, quantityPerServing, unit }`.
- Update `prisma/seed.ts` to insert ingredients, recipe-ingredient joins, and pantry items with realistic home quantities.
- If needed, add a lightweight import format for pantry CSV/JSON: `{ ingredientSlug, quantity, unitLabel, status, expiresOn }`.

## Telemetry & Safety
- Track pantry edits, consumption events, and “blocked by missing ingredient” occurrences to refine defaults.
- Surface expiry warnings and suggest recipes that use soon-to-expire items.

## Task List
- [x] Schema: add Ingredient, RecipeIngredient, PantryItem; generate migration; run `npm run prisma:generate`.
- [x] Seed: normalize `prisma/seed.ts` with structured ingredients + pantry demo user.
- [x] Services: update recommendation service for ingredient availability and shortfall scoring.
- [x] APIs: add user-scoped pantry routes with validation (`/api/pantry`, `/restock`, `/consume`).
- [x] UI: build pantry manager UI; update menus/recommendations to show cookable/needs-X state and swaps.
- [x] Telemetry: log pantry restock/consume/missing events and add expiry-based nudges in UI.
- [x] Docs: update `docs/PRD.md`/`docs/work-items.md` to reflect personal pantry model and new feed format.

# Ingredient-Level Pantry Plan — GoodFork

This document captures the next iteration of our inventory architecture: a unified ingredient pantry powering both operator workflows and user-level personalization. The goal is to unlock cookable recommendations that reflect whatever ingredients are on hand (eggs, oats, greens) while giving admins a clean way to restock and forecast demand.

## Objectives
- Model every recipe in terms of ingredient requirements so the recommendation engine can compute cookable servings directly from a pantry.
- Share the same ingredient catalog between operators and consumers: admins adjust global stock; users track home pantries using the identical taxonomy.
- Ensure recommendations only surface recipes that are cookable now (or highlight precise shortfalls) by combining operator availability and user pantry status.
- Provide UI + API affordances for restocking, consuming, and bulk adjustments to both the global pantry (admin) and personal pantry (consumer).

## Implementation Status — March 2025
- Dedicated system pantry owner seeded via Prisma now mirrors ingredient inventory for operators, and the shared `/api/pantry` endpoints accept a `scope=global` flag (admin-only) so both contexts reuse a single contract with telemetry on every restock/consume/missing event.
- Recommendation scoring merges operator + personal coverage, filtering out globally out-of-stock recipes, boosting ready-to-cook dishes, and surfacing kitchen shortfalls/low-stock badges directly on consumer cards and rationale copy.
- `/admin/inventory` now includes an Ingredient Pantry tab (reusing the enhanced PantryManager with search/typeahead/expiry nudges) while the profile menu’s pantry link points to the same experience for consumers.

## Data Model
### Core Tables
| Table | Purpose | Key Fields |
| --- | --- | --- |
| `Ingredient` | Canonical list of items (e.g., eggs, kale) shared across operator + consumer pantries. | `slug`, `name`, `defaultUnit`, `allergens`, `tags`. |
| `RecipeIngredient` | Structured join linking recipes to required ingredients per serving. | `recipeId`, `ingredientId`, `quantityPerServing`, `unitLabel`. |
| `PantryItem` | User-scoped ingredient stock (works for consumers and admins). | `userId` (admin user ID reserved for “global” pantry), `ingredientId`, `quantity`, `unitLabel`, `status`, `expiresOn`. |

### Global vs Personal Pantry
- Introduce a dedicated `SYSTEM_USER_ID` (seeded admin account) that owns the operator pantry rows. This keeps schema identical between admins and consumers.
- Admin UI manipulates rows where `userId = SYSTEM_USER_ID`. Consumer UI continues to scope queries to the authenticating user.
- Recommendations read both:
  1. Operator pantry → acts as “availability safety rail” (recipe hidden if globally out of stock).
  2. Personal pantry → determines cookable servings/missing ingredients for that user.

## Recommendation Logic
1. Fetch recipes with `recipeIngredients`.
2. Load operator pantry map (by ingredient id). Filter out recipes with zero global stock for any required ingredient.
3. Load user pantry map. Compute:
   - `cookableServings = min(floor(userQty / recipeQtyPerServing))`.
   - `missingIngredients`: structured list when quantity is zero.
   - `lowStockIngredients`: when servings < 2 or status ≠ `IN_STOCK`.
4. Score candidates with pantry heuristics:
   - Boost when `cookableServings >= 2`.
   - Penalize when user missing ingredients or operator stock is low.
5. Return cards containing both operator and consumer pantry signals, enabling UI hints (“Missing eggs — add 2”).

## APIs
### Shared Endpoints
| Route | Method | Purpose | Notes |
| --- | --- | --- | --- |
| `/api/pantry` | `GET`, `PATCH` | Personal pantry listing + bulk edits. | Already exists; extend auth to allow admin/system user toggling via query param or server action. |
| `/api/pantry/restock` | `POST` | Increment counts by ingredient slug. | Accepts `{ ingredientSlug, amount }[]`. |
| `/api/pantry/consume` | `POST` | Decrement counts after cooking. | Same payload shape. |

### Operator Enhancements
- Add `/api/admin/pantry/import` to ingest CSV/JSON feeds mapping ingredient slug → quantity/unit/status (mirrors current recipe inventory importer).
- Extend `/admin/inventory` UI with a tab switcher:
  - **Recipes tab** (existing behavior for metadata edits).
  - **Pantry tab** listing ingredient rows (search, restock drawer, low-stock filters).
- Seed script should insert baseline quantities for the system pantry and a few demo shortfalls.

## UI & Experience
### Consumer
- `/pantry` (shipped) continues to let users manage home stock. Add ingredient search + typeahead from `Ingredient` table to reduce slug friction.
- Recommendation cards already show “Pantry readiness”; enhance copy to differentiate between “global out of stock” vs “you’re missing eggs”.

### Operator
- New Pantry tab surfaces:
  - Ingredient cards (name, current quantity/unit, status pill, restock date).
  - Inline restock/consume buttons similar to user UI but with bulk actions and CSV import prompts.
- Provide a “global shortfalls” view that the admin can monitor before a demo.

## Telemetry & Safety
- Emit events on pantry changes: `pantry.restocked`, `pantry.consumed`, `pantry.missing`.
- Log when recommendation requests fail due to ingredient shortages to inform seeding decisions.
- Optional: add expiry reminders by comparing `expiresOn` with the current date and bubbling up in both the pantry UI and recommendation rationale.

## Implementation Phases
1. **Schema Finalization:** Already modeled, but convert existing admin inventory rows to ingredient records (migration + data backfill).
2. **Admin Pantry UI:** Build `/admin/pantry` tab, wire to shared pantry APIs, add CSV import/seed improvements.
3. **Recommendation Fusion:** Merge operator pantry into the scoring/filtering path, unify copy, and add telemetry.
4. **Consumer Enhancements:** Add ingredient search/typeahead, expiry nudges, and optional “add to grocery list” export.
5. **Docs & Seeds:** Update PRD/work-items, provide updated seed instructions, and include a demo script referencing pantry scenarios.

With this plan, operators and consumers work against the same ingredient source of truth, and recommendations become truly inventory-aware down to the egg. Let me know if you’d like me to start implementing Phase 1 (admin pantry migration + UI). 

## Ingredient Catalog Seed (data/recipes.json)
- Script: `scripts/generated/ingredient-pantry-seed.sql` (auto-generated from `data/recipes.json`) upserts 754 normalized `Ingredient` rows and seeds a pantry entry for each ingredient tied to the `system+pantry@goodfork.com` user.
- Prereqs: run `npm run db:seed` (or otherwise ensure the `system+pantry@goodfork.com` user exists) before applying the SQL so the pantry insert succeeds; the script no-ops on the pantry step if that user is missing.
- Usage: `psql "$DATABASE_URL" -f scripts/generated/ingredient-pantry-seed.sql` (requires the `pgcrypto` extension—`CREATE EXTENSION IF NOT EXISTS "pgcrypto";` is included at the top of the script).
- Customization: change the email inside the SQL script (search for `system+pantry@goodfork.com`) if you’d rather pre-seed a different account; rerun `npx tsx scripts/generate-ingredient-pantry-sql.ts` whenever `data/recipes.json` changes to regenerate the SQL payload with fresh ingredients.

## GoodFork Engineering Guide

### Introduction & Scope

- Engineering source of truth for architecture, data models, and feature flows.
- Product requirements and deep scope live in `specs/prd.md`; update that file for any product changes.
- Use this guide for implementation decisions, patterns, and pointers to code.

### Product & Requirements Snapshot

- Goals: AI-personalized menus (3–5 cards) blending inventory, user goals/allergens/preferences, and healthy-eating guardrails with optional healthy swaps.
- Personas: consumers (menus, swaps, pantry), operators/admins (recipes, inventory), analysts (telemetry/insights, post-MVP).
- Core flows: onboarding → recommendations → feedback; operator console for recipes/inventory; pantry-aware scoring; marketing landing funnels to `/menus`.
- Success signals: fast (<3s p95) responses, ≥95% request success, inventory accuracy (~98%), clear nutrition/rationale copy, mobile-first experience.
- Phase overview (high level): Foundations → Personalized Recommendations → Insights/Operator Tools → Polish & Launch. Detailed tasks stay in `docs/work-items.md`.

### Architecture Overview

- Frontend: Next.js App Router (SSR-first), Shadcn + Tailwind, TanStack Query + Axios. Primary routes: landing `/`, onboarding `/onboarding`, menus `/menus`, pantry `/pantry`, admin console `/admin` + `/admin/recipes` + `/admin/inventory`, recipe details `/recipes/[slug]`.
- Backend: Route Handlers + Server Actions with Zod validation. Services under `src/services/server|client`, shared env constants in `src/constants/app.constants.ts`, Prisma via `src/lib/prisma.ts`.
- Data layer: PostgreSQL via Prisma; models cover users/profiles, recipes + ingredients + recipeIngredients, pantry items, inventory history, recommendations, feedback. Local dev keeps `DATABASE_URL` pointed at `goodfork_dev`; Netlify/production sets `DATABASE_URL` to the Supabase Postgres connection string so the same Prisma client talks to Supabase.
- AI layer: embeddings for retrieval, reranker + generator for rationales/healthy swaps; deterministic fallback keeps responses safe when AI fails.
- Constraints & NFRs: SSR for perf, accessibility (WCAG 2.1 AA intent), hashed credentials, feature-flagged risky features, graceful degradation on AI/network failures.
- Diagram reference (from ADR): logical flow from users → UI → services (profiles, recommendations, inventory, feedback) → data layer → AI (embed/rerank/generate). Keep mermaid diagram in git history; update here if architecture meaningfully shifts.

### Data, Inventory, and Pantry Model

- Ingredient-centric model (current/shipped): `Ingredient`, `RecipeIngredient`, `PantryItem`. Recommendations filter out globally out-of-stock items, compute cookable servings, and surface missing/low-stock items per user.
- Operator pantry vs personal pantry: dedicated `SYSTEM_USER_ID` rows represent the global/operator pantry; personal pantry rows share the same schema.
- APIs: `/api/pantry` (GET/PATCH), `/api/pantry/restock`, `/api/pantry/consume`; admin imports use `/api/admin/inventory/import` plus `npm run inventory:import`.
- Recommendation logic highlights: load recipe ingredients + operator pantry + user pantry; filter hard fails (global out of stock); compute servings, missing ingredients, low stock; boost ready-to-cook, penalize shortfalls/low stock, surface expiry/shortfall hints in rationale.
- Historical recipe-level inventory is considered deprecated; keep only for compatibility in older migrations.
- Seeds/importers: `prisma/seed.ts` seeds recipes + pantry demo data; `scripts/generated/ingredient-pantry-seed.sql` bulk seeds the ingredient catalog; inventory importer supports CSV/JSON feeds.

### Core Flows & Features

- Onboarding & Recommendations: multi-step onboarding persists profile (goals, allergens, prefs); `/api/recommendations` merges deterministic filters with AI rerank; UI shows nutrition badges, rationale, healthy swap CTA, telemetry events, and feedback capture.
- Admin Tools & Inventory Console: `/admin` guarded by `requireAdminUser`; `/admin/recipes` manages full recipe + inventory metadata with live consumer preview; `/admin/inventory` offers search/filter, inline edits, restock drawer, low-stock alerts, telemetry events, and cron/CSV import path.
- Pantry Experience: `/pantry` reuses ingredient model for consumers; recommendation cards reflect pantry readiness, cookable servings, and missing items.
- MCP / External Data Source: Supabase MCP connector planned for alternate data source. Toggle via `source=backend|supabase` query param (SSR-prop to client). MCP mirrors Prisma DTOs (recipes, inventory, profiles, feedback) and should fall back to backend on failure. Types live in `src/services/shared/supabase-mcp.types.ts`; exporter/verify scripts live in `scripts/export-to-supabase.ts` and `scripts/verify-supabase-sync.ts`.

### Deployment & Environments

- Local dev: keep `.env.local` `DATABASE_URL` pointing to `postgresql://postgres:postgres@localhost:5432/goodfork_dev?schema=public`; run `npm run prisma:migrate` + `npm run prisma:generate` after schema changes.
- Netlify/production: set `DATABASE_URL` to the Supabase Postgres (pooled) connection string; Prisma in `src/lib/prisma.ts` will automatically use it via `@prisma/adapter-pg`.
- Prisma migrations to Supabase: temporarily set `DATABASE_URL` to the Supabase URL and run `npx prisma migrate deploy` (or `prisma db push` if you accept drift); regenerate client afterward.
- Supabase bootstrap: if the project is empty, run `supabase-init.sql` in the Supabase SQL Editor (or `npx prisma migrate deploy` against Supabase) then seed via either `npm run db:seed` with `DATABASE_URL` pointed to Supabase or `npm run supabase:export -- --truncate` (exports from local Prisma into Supabase REST using service key).
- Supabase sync/health: `npm run supabase:verify` compares Prisma vs Supabase counts/checksums; `npm run supabase:export` replays current Prisma rows into Supabase. Both require `SUPABASE_URL` (or `SUPABASE_PROJECT_URL`), `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SERVICE_KEY`), and optional `SUPABASE_SCHEMA` envs to be set alongside `DATABASE_URL`.
- Required production envs to mirror into Netlify: `DATABASE_URL`, `OPENAI_API_KEY`, `OPENAI_BASE_URL` (if overridden), `JWT_SECRET`, `ADMIN_EMAIL`, `SYSTEM_PANTRY_EMAIL`, `RECIPE_EMBEDDING_MODEL`, `RECIPE_EMBEDDING_PROVIDER`, `RECIPE_EMBEDDING_VERSION`, `INVENTORY_SYNC_SECRET`, `SUPABASE_URL`/`SUPABASE_PROJECT_URL`, `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SERVICE_KEY`), `SUPABASE_SCHEMA`, and `SUPABASE_MCP_URL`/`SUPABASE_MCP_API_KEY` when the MCP path is enabled.

### Feature Plans & ADR Notes (Active)

- Recipe Detail & Insights: `/recipes/[slug]` shows full recipe metadata, inventory badge, nutrition grid, instructions, highlights, and a deterministic AI insights tab (see `src/app/recipes/[slug]/page.tsx` + `src/components/recipes/recipe-insights-tabs.tsx`). Future AI hooks can replace deterministic copy.
- Insights & Operator Tools (Phase 2 themes): maintain inventory console, telemetry (`inventory.low_stock`, `inventory.restocked`, `inventory.sync_failed`), and nightly import route guarded by `INVENTORY_SYNC_SECRET`. Any new automation/analytics should extend these paths rather than creating new ones.
- MCP follow-ups: build Supabase MCP server connector with read endpoints + bulk import guarded by service key; ensure inventory/allergen filters remain deterministic before AI steps; add smoke tests for backend vs MCP paths.

### Conventions & Updates

- Source of truth docs: product scope in `specs/prd.md`; engineering architecture/decisions here; task tracking in `docs/work-items.md`.
- Service naming: `src/services/server/<name>.server.ts` for trusted code, `src/services/client/<name>.client.ts` for browser-safe calls.
- Env/config: constants in `src/constants/app.constants.ts`; keep `.env.local` out of source; update docs when adding envs.
- UI patterns: Shadcn + Tailwind utilities; mobile-first; prefer SSR with client components only where needed.
- When adding new architectural decisions, append to this guide; avoid scattering new `.plan.md` files in `docs/`.

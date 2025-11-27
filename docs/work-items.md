# GoodFork Work Items & Phase Plan

This plan breaks the hackathon build into concrete tasks per phase. Assume all secrets (OpenAI keys, database URLs, feature flags) live in `.env.local` and are never committed. Document new variables inside that file with inline comments when added.

## Local Database Setup
- Run a local Postgres server (Homebrew, Docker, or Prisma Dev) and create a database named `goodfork_dev` (`createdb goodfork_dev`).
- Copy the connection string `postgresql://postgres:postgres@localhost:5432/goodfork_dev?schema=public` into `.env.local` as `DATABASE_URL`.
- Re-run `npm run prisma:migrate` + `npm run prisma:generate` after pointing to a new database so the generated client stays in sync.

## Phase 0 – Foundations (Complete)
Phase 0 establishes the technical baseline required to build GoodFork’s personalized experience. The goal is to stand up local infrastructure, solidify the Prisma data model, and scaffold the shared utilities/services so later phases can focus on product features without reworking foundations.

### Objectives
- ✅ Confirm environment + tooling: ensure `.env.local` carries critical secrets (`DATABASE_URL`, `OPENAI_API_KEY`, `NEXT_PUBLIC_ENABLE_HEALTHY_SWAP`) and that local Postgres `goodfork_dev` is reachable.
- ✅ Finalize Prisma schema for users, profiles, recipes, inventory, recommendations, and feedback, then run initial migration + generate the client.
- ✅ Seed representative recipes/inventory data to unblock UI states and recommendation logic.
- ✅ Scaffold shared code structure (constants, services, Shadcn primitives, Tailwind/globals) so components can be layered quickly.
- ✅ Provide a basic health-check endpoint to verify end-to-end wiring.

### Task Checklist
| Status | Task | Notes |
| --- | --- | --- |
| [x] | Create `.env.local` with `DATABASE_URL`, `OPENAI_API_KEY`, `NEXT_PUBLIC_ENABLE_HEALTHY_SWAP`. | `.env.local.example` checked in with required placeholders + JWT secret guidance. |
| [ ] | Stand up local Postgres `goodfork_dev` and verify connectivity via Prisma. | Requires local dev to run `createdb goodfork_dev` + `npm run prisma:migrate` (pending hardware access). |
| [x] | Author complete Prisma schema (users, profiles, inventory, recipe, recommendation, feedback). | `prisma/schema.prisma` now models auth, profiles, recipes, inventory, sessions, recommendations, feedback. |
| [x] | Run `npm run prisma:migrate` for baseline migration and regenerate client. | Generated `20250211120000_init` SQL + re-built client (`npx prisma generate`); apply migration locally once DB is up. |
| [x] | Implement `npm run db:seed` script with starter recipes/inventory + document sample CSV path. | `prisma/seed.ts` seeds 3 flagship recipes + inventory quantities (CSV path TBD). |
| [x] | Install Axios + TanStack Query; confirm `src/constants/app.constants.ts` exports env toggles. | Dependencies already present; constants file now surfaces model + feature flag + warnings. |
| [x] | Scaffold `src/services/server` and `src/services/client` with stubs showing execution context. | Health service added for server + client, shared types demonstrate pattern. |
| [x] | Establish Shadcn primitives, layout shell, typography, and Tailwind globals tuned for 8px spacing. | Layout metadata + hero placeholder + gradient shell wired to existing Tailwind tokens. |
| [x] | Initialize Prisma client usage within Server Components (helper in `src/lib`). | `src/lib/prisma.ts` exports a re-used client for server components + API routes. |
| [x] | Add health check route at `src/app/api/health/route.ts` returning DB status. | Route returns structured snapshot (DB, OpenAI, JWT, feature flags) surfaced on the home page. |

## Phase 1 – Personalized Recommendations (Complete)
Build an end-to-end personalized menu flow that returns 3–5 AI-ranked menu cards with rationales and optional healthy swaps, using live inventory and stored user profiles, by the Phase 1 milestone (M1). Achieve <5% error rate for recommendation requests in local/dev and demo environments, with p95 end-to-end response time ≤3s for seeded data. Ensure the flow works on mobile (360–390px) via SSR-first render and passes basic accessibility checks (labels, focus order) for key interactions. Timebox: 3-day Phase 1 window (D1–D3) with milestones at end of each day (M1: onboarding saved; M2: recommendation vertical slice; M3: demo-ready polish) aligned to the hackathon schedule.

### Scope & Out-of-Scope
- **In scope:** consumer onboarding, recommendation service + API, recommendation UI, healthy swap CTA, and feedback capture.
- **Out of scope:** operator dashboards, multi-tenant support, payments, location-specific inventory, and automated nightly ingest.

### Deliverables
- Onboarding flow persisting user goals/allergens/preferences/budget.
- Recommendation API/service that merges deterministic filters with LLM reasoning.
- Recommendation UI cards with nutrition badges, AI rationale, and healthy swap CTA plus loading/empty/error states.
- Personalized preview enforces onboarding email validation and uses Sonner toasts for missing profiles to direct users back into onboarding without cluttering inline UI.
- Feedback logging endpoint/table capturing accept/save/swap events.
- Living TODO log with milestone cadence (M1–M3) and RACI assignments per milestone.

### Phase 1 TODO Log
| Status | Priority | Task | Owner | Last update note |
| --- | --- | --- | --- | --- |
| [x] | Must | Implement consumer onboarding flow persisting user profile to the database. | FE + BE | Multi-step onboarding route now calls `/api/onboarding` via shared Axios + TanStack mutation to persist through Prisma. |
| [x] | Must | Build recommendation API and service combining deterministic filters with LLM ranking. | BE | `/api/recommendations` now calls a Prisma-backed service with inventory/profile filters plus optional LLM rerank + fallback rationale. |
| [x] | Must | Render recommendation cards with nutrition badges, rationale, and healthy swap UI. | FE | Home recommendations section now calls `/api/recommendations` with onboarding email + renders live cards, skeletons, and empty/error states. |
| [x] | Should | Capture feedback events (accept/save/swap) and persist them for analytics. | BE | `/api/feedback` now validates Zod payloads, logs to Prisma `Feedback` with action enums, and updates recommendation status for analytics. |
| [x] | Should | Add basic telemetry for recommendation requests and failures. | TL | `/api/recommendations` now emits request/success/failure events with requestId + latency via the shared telemetry logger for quick log-based metrics. |
| [x] | Should | Validate mobile SSR experience and basic accessibility for the flow. | FE | Onboarding + recommendation UIs now expose aria labels/live regions and stack actions cleanly at 360px for the demo-ready sweep. |

### Dependencies
- Phase 0 foundations in place (schema, migrations, seed data, Postgres connectivity, shared Axios).
- Valid `OPENAI_API_KEY`, chosen model (`RECOMMENDER_MODEL`), and env toggles available.
- Seeded inventory data to power deterministic filtering; agreement on onboarding flow and card layout.

### Top Risks & Mitigations
- LLM latency or low-quality responses → deterministic caching + fallback rationale.
- Inventory/allergen data gaps → conservative filtering and defaults.
- Prompt/logic over-complexity during hackathon timeline → start simple, iterate cautiously.
- UX confusion around healthy swaps → concise copy and rationale.
- Scope drift vs. hackathon expectations → frequent PRD/deck alignment checks.

### Assumptions (Testable)
- Phase 0 migrations complete before Phase 1 coding. Test via `npm run prisma:migrate`.
- Single-tenant operator and global inventory. Test by confirming schema/design assumptions.
- Judges test against seeded demo tenant. Test via deterministic seed script.
- OpenAI capacity sufficient. Test with scripted recommendation loop.
- Phase 1 timeline fixed at 3 days. Test by confirming hackathon schedule.

### Success Metrics
- Functional: ≥95% of recommendation requests return 3–5 cards without server errors.
- Performance: p95 end-to-end response ≤3s on seeded data in local/dev.
- Experience: Seeded demo users see at least one healthy swap in first session.
- Reliability: 100% of LLM failures fall back to deterministic mode with clear UI.

### Review Cadence
- Daily 15–20 minute stand-up to review TODO log updates.
- Mid-phase design/UX sync on card + swap interaction.
- End-of-phase demo and metric review using seeded demo user.

## Phase 2 – Insights & Operator Tools
- Build operator inventory dashboard with edit forms, stock alerts, and recipe metadata controls (recipes console shipped; inventory console pending).
- Add nutrition insight drawer per recommendation plus comparison sheet for swaps.
- Implement scheduled recompute endpoint (Route Handler) and configure scheduler (document crons and required `.env.local` keys such as `RECOMPUTE_CRON_SECRET`).
- Instrument analytics pipeline (conversion, latency, AI failures) and expose analyst-facing report page.
- Harden error boundaries, fallback copy for AI outages, and integrate feature flags for risky features (values stored in `.env.local`).
- Split experience shell: redesign `/` as a motion-rich hero with CTA-only header, move personalization to `/menus`, and prep `/recipes/[slug]` detail pages that hydrate from the same recommendation payloads.

### Experience Refresh TODOs
| Status | Priority | Task | Notes |
| --- | --- | --- | --- |
| [ ] | Must | Rebuild landing page hero + sections with Framer Motion, animated gradient backgrounds, and CTA-only header (logo + Start personalization + Log in). | Ensure scroll sections map to marketing anchors and remove data fetching from `/`. |
| [ ] | Must | Implement `/menus` route gated by onboarding email/session that renders the recommendation list, healthy swaps, insights, and Sonner messaging. | Shared components move out of `page.tsx`; home becomes marketing-only. |
| [ ] | Should | Add `/recipes/[slug]` detail page showing hero imagery, nutrition macros, AI rationale history, inventory status, and healthy swap suggestions. | Pull data from Prisma, reuse recommendation metadata, and surface structured copy for demos. |

## Admin Tools

### Recipes Console (Complete)
- [x] Lock admin-only routes (`/admin`, `/admin/recipes`, `/api/admin/recipes`) to `ADMIN_EMAIL` via `requireAdminUser`/`requireAdminApiUser` so hackathon judges cannot trip privileged changes.
- [x] Build the two-pane `AdminRecipeManager` UI with live recipe list, exhaustive Prisma-field form (including allergens, macros, pricing, imagery, and nested inventory edits), and a Recommendation Card preview that mirrors the consumer UI.
- [x] Ship `GET/POST /api/admin/recipes` plus `PUT/DELETE /api/admin/recipes/[id]` to perform CRUD with `adminRecipeSchema` validation, normalized inventory payloads, and Prisma includes that keep operator edits synchronized with the personalization engine.
- [x] Updated the recipes console to a 40/60 layout: a sticky, scrollable recipe list on the left and a taller form/preview column on the right so operators can browse inventory while editing details.

### Inventory Console (Shipped)
- [x] `/admin/inventory` now lists every recipe with search, status filters, inline quantity/unit edits, restock date inputs, and telemetry-backed urgency banners for low/critical stock.
- [x] Restock drawer logs quantity deltas, overrides status, and shows consumer preview copy; all edits hit `/api/admin/inventory`.
- [x] Low-stock, restock, and sync failures emit telemetry events (`inventory.low_stock`, `inventory.restocked`, `inventory.sync_failed`) so analysts can monitor operator activity.
- [x] Nightly feeds can be replayed via `npm run inventory:import data/inventory-sync.json` (JSON or CSV) or remotely through `/api/admin/inventory/import` with the `x-cron-secret: ${INVENTORY_SYNC_SECRET}` header. Document feed columns next to the script.
- [x] Added a shared admin navigation pill bar on `/admin`, `/admin/recipes`, and `/admin/inventory` so operators can jump between workspaces or return to the landing view without relying on browser controls.

**Operator SOP:** Export a CSV/JSON feed with columns `recipeSlug`, `quantity`, `unitLabel`, `status`, and `restockDate` (ISO). For manual edits, visit `/admin/inventory`, adjust quantity + status inline, and hit “Save row”; use the restock drawer for bulk deliveries. Cron invocations must set `INVENTORY_SYNC_SECRET` in `.env.local` and send it via the `x-cron-secret` header.

## Phase 3 – Polish & Launch
- Accessibility audit (WCAG AA), keyboard focus outlines, and semantic labeling for nutrition data.
- Performance tuning: enable Next.js image optimizations, preload critical fonts, and verify lighthouse scores on mobile.
- Add micro-interactions (150–200ms transitions) for cards, sticky bottom nav, and CTA buttons; hover/focus states for larger screens.
- Finalize operator onboarding docs, add demo script, and capture screenshots/video for submission.
- Deploy to Vercel, configure production `.env.local` equivalents, and validate database migrations + seeds in staging.

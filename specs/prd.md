## GoodFork Product Requirements Document (Canonical)

### 1. Overview
GoodFork targets the **AI-Driven Menu Personalization and Nutrition Insights** theme. The experience tailors nutritionally balanced meal recommendations by blending live inventory, user preferences, historical behavior, and healthy-eating guardrails. Each session serves 3–5 menu cards with AI context and an optional healthy swap. The experience must be mobile-first and demo-ready.

### 2. Goals & Non-Goals
- Goals: personalize menus in real time, surface nutrition + cost context, enable operators to curate inventory, and capture insights for analysts.
- Non-Goals: marketplace ordering, payments, deep dietician workflows, or heavy ML training beyond reranking/rules during the hackathon.

### 3. Personas
- Consumers: complete onboarding, view recommendations, request swaps, and log choices.
- Operators/Admins: manage inventory, recipe metadata, allergens, and pricing.
- Analysts (stretch): monitor performance metrics and AI quality post-MVP.

### 4. Core Use Cases
1) Consumer completes onboarding (goals, allergens, taste profile) and receives a tailored menu with nutrition badges, costs, and quick actions (save, swap, share).  
2) Operator updates ingredient stock or recipe macros; recommendations instantly respect availability.  
3) Analyst (future) reviews conversion funnel and AI quality metrics.  
4) Visitor lands on the marketing landing page, taps “Start personalization” or “Log in,” and funnels into onboarding or `/menus`.  
5) Returning user opens `/menus` for recommendations, swaps, and recipe deep-dives.

### 5. Functional Requirements
- Data ingestion: nightly sync of inventory/macros; admin CRUD for emergency edits.
- Inventory feeds: `npm run inventory:import path/to/feed.(json|csv)` and `/api/admin/inventory/import` with `INVENTORY_SYNC_SECRET`.
- Personal pantry: `/pantry` lets authenticated users restock/consume ingredients using the structured ingredient + recipeIngredient model; recommendations compute cookable servings and shortfalls.
- Recommendation engine: deterministic filters (allergens, availability) plus AI rerank and rules for macros/cost targets; healthy swap suggestions on every card.
- Nutrition insights: calorie/macro badges, allergen flags, and short AI explanation (<200 chars) on every recommendation.
- User profile store: persist preferences, selections, and feedback for better personalization.
- Personalization settings: `/personalization` for goals/allergens/preferences; admin accounts remain scoped to `/admin`.
- Operator tools: `/admin`, `/admin/recipes`, `/admin/inventory` guarded by `ADMIN_EMAIL` with full CRUD, validation, and live consumer preview.
- Personalized preview safety rails: onboarding email validation and Sonner toasts when profiles are missing.
- Analytics hooks: events for recommendation shown/accepted, inventory breaches, and AI reasoning quality.

### 6. Non-Functional Requirements
- Performance: server-rendered responses in ~<2s p90; streaming AI copy allowed; target <3s p95 end-to-end for seeded data.
- Security & privacy: hashed credentials (bcrypt ≥8 chars), row-level scoping, and log redaction for allergens/PII.
- Accessibility: WCAG 2.1 AA intent, semantic HTML, keyboard navigation, readable contrast.
- Reliability: retries + graceful degradation if AI copy fails; deterministic fallback messaging.

### 7. Architecture Overview
- Frontend: Next.js App Router with Server Components, Shadcn UI, Tailwind CSS, TanStack Query + Axios for client data fetching.
- Backend: Route Handlers + Server Actions, Prisma ORM on PostgreSQL, background cron endpoint for periodic recompute, OpenAI LLM for ranking/explanations.
- Integrations: Webhook/CSV for inventory ingest, feature flags via env variables.
- Code organization: env constants in `src/constants/app.constants.ts`; services under `src/services/server/*.server.ts` and `src/services/client/*.client.ts`; shared Axios config in `src/config/axios.config.ts`.

### 8. Phase Plan (High Level)
- Phase 0 – Foundations: confirm requirements, set up repo, configure Prisma schema (users, recipes, inventory, recommendations), seed starter data, scaffold UI shell/layout.
- Phase 1 – MVP Recommendations: onboarding flow, profile persistence, inventory-aware recommendation service, AI explanation integration, 3–5 cards with healthy swap CTA.
- Phase 2 – Insights & Admin: nutrition detail drawer, operator inventory console, analytics logging, cron refresh hook, manual override tooling.
- Phase 3 – Polish & Launch: QA, states (empty/loading/error), performance tuning, accessibility sweep, demo script, and deploy to Vercel with seeds.

### 9. Success Metrics
- ≥90% of recommendation requests return within SLA; inventory sync accuracy ≥98%.
- ≥60% of consumers interact with at least one recommendation per session.
- Positive qualitative feedback on nutrition clarity and UI polish.

### 10. Experience Principles
- Mobile-first, SSR-friendly UX with Tailwind + Shadcn; 8px spacing grid, high contrast, readable typography.
- Motion: Framer Motion for hero/section transitions and micro-interactions (~150–250ms).
- Theme palette: emerald/lime nutrition tones as defined in `src/app/globals.css` and Tailwind config.
- Components: responsive grids, meaningful iconography, skeleton/empty/error/success states; hydration-safe patterns for SSR + client components.

### 11. Admin Console Deliverable (Shipped)
- `/admin` locked to `requireAdminUser` with navigation into recipes/inventory.
- `/admin/recipes`: two-pane UI, exhaustive Prisma + inventory fields, live Recommendation Card preview.
- `/admin/inventory`: search/filter, inline edits, restock drawer, low-stock alerts, telemetry; cron import via `/api/admin/inventory/import` secured with `INVENTORY_SYNC_SECRET`.

### 12. Experience Architecture Refresh (Planned)
- Landing page: narrative hero with motion; header focused on logo + Start personalization + Log in.
- Menus page: authenticated home for recommendations, swaps, insights, telemetry; removes redundant header clutter.
- Recipe detail pages: `/recipes/[slug]` with nutrition breakdown, inventory status, swaps, and AI rationale history.
- Pantry manager: `/pantry` shows ingredient-level pantry with restock/consume shortcuts and ties into recommendation scoring.

### 13. Open Questions
- Inventory dimension: ingredient-level vs. recipe-level buffering for multi-location readiness.
- Auth edges: password reset, email verification, and session strategy beyond the hackathon.
- Historical meal tracking depth vs. inferred transient signals.
- Pricing depth required (single price vs. variants/discounts/taxes) to keep menu context accurate.
- Stretch analytics & accessibility expectations for hackathon vs. post-hackathon.




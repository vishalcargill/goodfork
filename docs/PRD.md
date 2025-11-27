# GoodFork Product Requirements Document

## 1. Overview
GoodFork is our hackathon submission for the **AI-Driven Menu Personalization and Nutrition Insights** theme (see `Hackathon 2025 - Kick Off.pdf`). The experience tailors nutritionally balanced meal recommendations by blending live inventory, user preferences, historical consumption, and healthy-eating guardrails. The system must serve 3–5 menu cards per session, each with AI-generated context and an optional "healthy swap". UI should be aesthetically pleasing, mobile-first, and production-ready so judges can feel a polished consumer journey.

## 2. Goals & Non-Goals
- **Goals:** personalize menus in real time, surface nutrition + cost context, enable operators to curate inventory, and capture insights for analysts.
- **Non-Goals:** marketplace ordering, payments, or full dietician certification during hackathon; deep ML training pipelines beyond reranking/rules.

## 3. Personas
- **Consumers:** set goals, view recommendations, request swaps, and log choices.
- **Operators/Admins:** manage inventory, recipe metadata, allergens, and pricing.
- **Analysts (stretch):** monitor performance dashboards, flag anomalies, export insights.

## 4. Core Use Cases
1. Consumer completes onboarding (goals, allergens, taste profile) and receives a tailored menu with nutrition badges, costs, and quick actions (save, swap, share).
2. Operator updates ingredient stock or recipe macros; recommendations instantly respect availability.
3. Analyst reviews conversion funnel and AI quality metrics to suggest iteration.
4. Visitor lands on the marketing-focused home page, experiences animated storytelling, and taps “Start personalization” to enter onboarding or “Log in” to resume saved menus.
5. A returning user opens the dedicated `/menus` experience to review recommendations, request swaps, and jump into a deep-dive recipe detail page for nutrition storytelling and inventory notes.

## 5. Functional Requirements
- **Data ingestion:** nightly sync of inventory and macros; admin CRUD for emergency edits.
- **Inventory feeds:** `npm run inventory:import path/to/feed.(json|csv)` supports manual replays, while `/api/admin/inventory/import` ingests cron-delivered payloads signed with `INVENTORY_SYNC_SECRET`.
- **Recommendation engine:** combine deterministic filters (allergens, availability) with LLM re-ranking and rules for macros/cost targets.
- **Healthy swap module:** for each card, propose an alternate meal that nudges toward goals (e.g., lower sodium) while noting trade-offs.
- **Nutrition insights:** render calorie/macro badges, allergen flags, and short AI explanation (<200 chars) on every recommendation.
- **User profile store:** persist preferences, recent selections, and feedback for better personalization.
- **Personalization settings:** authenticated non-admin users can visit `/personalization` (linked through the profile icon in the header) to adjust goals, allergen shields, budget guardrails, and reset their password; operator/admin accounts stay scoped to `/admin`.
- **Operator tools:** `/admin` landing locked to `ADMIN_EMAIL` plus the `/admin/recipes` console that surfaces full CRUD for recipes + inventory with schema validation, live consumer card previewing, and immediate propagation to the recommendation engine; future iterations add stock warnings and analytics.
- **Experience shell:** marketing landing page with high polish/animation that funnels to onboarding, a dedicated `/menus` route for personalized recommendations, and `/recipes/[slug]` deep-dive pages that reuse AI rationale + macros for individual dishes.
- **Personalized preview safety rails:** the recommendation preview form must validate onboarding emails and surface Sonner toasts (instead of inline banners) whenever a non-existent profile or profile-less user submits a request so consumers immediately know to rerun onboarding.
- **Analytics hooks:** event stream for recommendation shown/accepted, inventory breaches, and AI reasoning quality.

## 6. Non-Functional Requirements
- **Performance:** server-rendered responses in <2s for 90th percentile; streaming AI copy permitted.
- **Security & privacy:** store PII securely in PostgreSQL with row-level scoping per tenant; redact allergens in logs.
- **Auth security:** hash every password (bcrypt, min 8 chars) server-side before storing; never log or persist plaintext credentials.
- **Accessibility:** minimum WCAG 2.1 AA, semantic HTML, keyboard navigation, and readable contrast ratios.
- **Reliability:** retries + graceful degradation if AI copy fails (fallback to deterministic messaging).

## 7. Architecture Overview
- **Frontend:** Next.js App Router with Server Components, Shadcn UI component library, `@phosphor-icons/react` for icons, Tailwind CSS for styling, and React Query (TanStack Query) + Axios for client data fetching.
- **Backend:** Route Handlers + Server Actions, Prisma ORM on PostgreSQL, background cron endpoint for periodic recompute, OpenAI LLM for ranking/explanations.
- **Integrations:** Webhook/CSV for inventory ingest, feature flag toggles through environment variables.
- **Code organization:** shared env constants reside in `src/constants/app.constants.ts`; service modules live in `src/services/server/*.server.ts` (trusted execution) and `src/services/client/*.client.ts` (browser-safe calls) for clarity.
- **HTTP client:** use the shared Axios instance exported from `src/config/axios.config.ts` for every browser/server request to internal APIs to ensure consistent headers, base URLs, and interceptors.

## 8. Phase Plan
- **Phase 0 – Foundations (Day 0-0.5):** confirm requirements, set up repo, configure Prisma schema (users, recipes, inventory, recommendations), seed starter data, and scaffold UI shell/layout primitives.
- **Phase 1 – MVP Recommendations (Day 0.5-1.5):** build onboarding flow, profile persistence, inventory-aware recommendation service, AI explanation integration, and render 3–5 cards with healthy swap CTA.
- **Phase 2 – Insights & Admin (Day 1.5-2.5):** add nutrition detail drawer, operator inventory console, analytics logging, cron refresh hook, and manual override tooling.
- **Phase 3 – Polish & Launch (Day 2.5-3):** implement QA, add empty/loading/error skeleton states, performance tuning, accessibility sweep, demo script, and deploy to Vercel with seed data.

## 9. Success Metrics
- 90% of recommendation requests return within SLA.
- 60% of consumers interact with at least one recommendation (save/swap/accept) per session.
- Inventory synchronization accuracy >= 98%.
- Positive qualitative feedback from judges regarding nutrition clarity and UI polish.

## 10. UI & Experience Principles
Design a mobile-first, beautiful interface optimized for 360–390px widths and progressively enhance at sm/md/lg breakpoints. Apply clean hierarchy, generous spacing, 8px spacing grid, high contrast, and readable typography. Rely on modern patterns (cards, sheets, sticky bottom nav, floating CTAs), subtle elevation, rounded corners, and breathable layouts. Include responsive grids, meaningful iconography, micro-interactions in the 150–200ms range, and concrete states (skeleton, empty, error, success). Prioritize SSR delivery for first paint, then hydrate interactions. Document component usage inside Shadcn primitives to keep consistency.
- Motion: animation-heavy by design—use `framer-motion` for page/section transitions, card hover/press states, and staggered reveals; keep durations ~150–250ms with easing that feels organic. Existing `tw-animate-css` utilities can supplement simple loops (pulses, fades) but default to `framer-motion` for anything interactive or choreographed. Avoid jarring/overlong sequences.
- Theme (canonical): CSS variables in `src/app/globals.css` + Tailwind tokens. Palette uses emerald/lime nutrition tones (`--primary #10b981`, `--accent #bef264`, `--secondary #ecfccb`, background `#f8fff4`, foreground `#0f172a`, border/input `#d1f0dd`, danger `#ef4444`). All surfaces now use solid fills—gradients have been removed per design feedback. Radii: xs 8, sm 12, md 16, lg 20, xl 28, pill full; shadows: soft/medium/strong emerald glows as per Tailwind config.

## 11. Open Questions & Grey Areas
- **Inventory model:** finalize whether inventory is tracked at ingredient, recipe, or menu-item level, and whether any location dimension is needed even in a single-tenant setup.
- **Auth edges:** decide on password reset flow, email verification requirements, and session strategy for the simple sign up / login experience.
- **Historical behavior tracking:** clarify how much of historical consumption patterns and feedback need to be persisted in early phases versus inferred on the fly.
- **Pricing depth:** confirm how detailed pricing must be (single price vs variants, discounts, taxes) to support “budget-friendly” recommendations.
- **Stretch analytics & accessibility:** confirm which analytics/observability hooks and accessibility investments, if any, are expected during the hackathon versus deferred post-hackathon.

## 12. Admin Console Deliverable (Shipped)
- `/admin` is server-guarded via `requireAdminUser` so only the configured operator email can load the console; this landing page provides quick launches into recipes (live) and inventory (coming soon) workspaces.
- `/admin/recipes` mounts `AdminRecipeManager`, a two-pane UX that lists all recipes, exposes every Prisma + inventory field, and renders a live Recommendation Card preview so operators immediately see consumer-facing impact.
- `/api/admin/recipes` and `/api/admin/recipes/[id]` share `adminRecipeSchema` validation, normalize nested inventory payloads, and persist through Prisma with an include shape that keeps recommendation queries and operator edits in lockstep.
- `/admin/inventory` now powers day-to-day stock management with search/filter chips, inline edits, restock drawer, low-stock alerts, and a live consumer preview that mirrors recommendation cards.
- `/api/admin/inventory` handles privileged GET/PATCH/POST calls, emitting telemetry events for `inventory.low_stock` and `inventory.restocked`, while `/api/admin/inventory/import` accepts cron-fed JSON/CSV payloads signed with `INVENTORY_SYNC_SECRET`.

## 13. Experience Architecture Refresh (Planned)
- **Landing page:** evolves into a purely narrative hero with rich motion (Framer Motion for hero, scroll-linked feature reveals, animated stats, and CTA micro-interactions). Header now only carries the GoodFork logo plus “Start personalization” and “Log in” buttons to keep the CTA focus clear.
- **Menus page:** `/menus` becomes the authenticated/home for recommendations, swaps, insights, and telemetry. It will hydrate from onboarding data (email or session) and support stateful UI without distracting marketing content. The redundant “Signed in as” card has been removed from the header so the layout focuses on actionable signals like Kitchen Pulse + recommendation controls while onboarding links live elsewhere.
- **Recipe detail pages:** `/recipes/[slug]` expand a single card into full nutrition breakdowns, inventory status, swap suggestions, and AI rationale history to deepen judge storytelling.

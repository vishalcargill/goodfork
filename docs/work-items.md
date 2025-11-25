# GoodFork Work Items & Phase Plan

This plan breaks the hackathon build into concrete tasks per phase. Assume all secrets (OpenAI keys, database URLs, feature flags) live in `.env.local` and are never committed. Document new variables inside that file with inline comments when added.

## Local Database Setup
- Run a local Postgres server (Homebrew, Docker, or Prisma Dev) and create a database named `goodfork_dev` (`createdb goodfork_dev`).
- Copy the connection string `postgresql://postgres:postgres@localhost:5432/goodfork_dev?schema=public` into `.env.local` as `DATABASE_URL`.
- Re-run `npm run prisma:migrate` + `npm run prisma:generate` after pointing to a new database so the generated client stays in sync.

## Phase 0 – Foundations
- Create `.env.local` with `DATABASE_URL`, `OPENAI_API_KEY`, and any feature toggles (`NEXT_PUBLIC_ENABLE_HEALTHY_SWAP`).
- Finalize Prisma schema (users, profiles, inventory, recipe, recommendation, feedback tables) and run `npm run prisma:migrate`.
- Seed baseline recipes/inventory using `npm run db:seed` and store sample CSV path in docs.
- Install Axios + TanStack Query, add `src/constants/app.constants.ts`, and scaffold `src/services/server/*.server.ts` plus `src/services/client/*.client.ts` directories to separate trusted vs browser logic.
- Scaffold Shadcn UI primitives, layout shell, typography, color tokens, and global Tailwind config tuned for 8px spacing.
- Boot Prisma client in Server Components and add basic health check route under `app/api/health/route.ts`.

## Phase 1 – Personalized Recommendations
- Build onboarding wizard (goals, allergens, diet type) with Server Actions persisting to PostgreSQL.
- Implement secure email/password login that validates stored hashes, mints short-lived sessions, and removes unused auth CTAs until providers exist.
- Implement recommendation service combining deterministic filters + OpenAI rerank; store service config in `.env.local` (e.g., `RECOMMENDER_MODEL`).
- Render recommendation cards with nutrition badges, AI rationale, and “Healthy Swap” CTA; include loading skeletons and empty/error views.
- Wire feedback events (save/swap/accept) to analytics table and expose route handler for frontend logging.
- Verify SSR-first rendering on mobile widths (360–390px) and add Playwright snapshot for home screen.

## Phase 2 – Insights & Operator Tools
- Build operator inventory dashboard with edit forms, stock alerts, and recipe metadata controls.
- Add nutrition insight drawer per recommendation plus comparison sheet for swaps.
- Implement scheduled recompute endpoint (Route Handler) and configure scheduler (document crons and required `.env.local` keys such as `RECOMPUTE_CRON_SECRET`).
- Instrument analytics pipeline (conversion, latency, AI failures) and expose analyst-facing report page.
- Harden error boundaries, fallback copy for AI outages, and integrate feature flags for risky features (values stored in `.env.local`).

## Phase 3 – Polish & Launch
- Accessibility audit (WCAG AA), keyboard focus outlines, and semantic labeling for nutrition data.
- Performance tuning: enable Next.js image optimizations, preload critical fonts, and verify lighthouse scores on mobile.
- Add micro-interactions (150–200ms transitions) for cards, sticky bottom nav, and CTA buttons; hover/focus states for larger screens.
- Finalize operator onboarding docs, add demo script, and capture screenshots/video for submission.
- Deploy to Vercel, configure production `.env.local` equivalents, and validate database migrations + seeds in staging.

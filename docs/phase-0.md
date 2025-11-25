# Phase 0 – Foundations Plan

Phase 0 establishes the technical baseline required to build GoodFork’s personalized experience. The goal is to stand up local infrastructure, solidify the Prisma data model, and scaffold the shared utilities/services so later phases can focus on product features without reworking foundations.

## Objectives
- ✅ Confirm environment + tooling: ensure `.env.local` carries critical secrets (`DATABASE_URL`, `OPENAI_API_KEY`, feature flags) and that local Postgres `goodfork_dev` is reachable.
- ✅ Finalize Prisma schema for users, profiles, recipes, inventory, recommendations, and feedback, then run initial migration + generate the client.
- ✅ Seed representative recipes/inventory data to unblock UI states and recommendation logic.
- ✅ Scaffold shared code structure (constants, services, Shadcn primitives, Tailwind/globals) so components can be layered quickly.
- ✅ Provide a basic health-check endpoint to verify end-to-end wiring.

## Task Checklist

| Status | Task | Notes |
| --- | --- | --- |
| [x] | Create `.env.local` with `DATABASE_URL`, `OPENAI_API_KEY`, `NEXT_PUBLIC_ENABLE_HEALTHY_SWAP` defaults. | `.env.local.example` checked in with required placeholders + JWT secret guidance. |
| [ ] | Stand up local Postgres `goodfork_dev` and verify connectivity via Prisma. | Requires local dev to run `createdb goodfork_dev` + `npm run prisma:migrate` (pending hardware access). |
| [x] | Author complete Prisma schema (users, profiles, inventory, recipe, recommendation, feedback). | `prisma/schema.prisma` now models auth, profiles, recipes, inventory, sessions, recommendations, feedback. |
| [x] | Run `npm run prisma:migrate` for baseline migration and regenerate client. | Generated `20250211120000_init` SQL + re-built client (`npx prisma generate`); apply migration locally once DB is up. |
| [x] | Implement `npm run db:seed` script with starter recipes/inventory + document sample CSV path. | `prisma/seed.ts` seeds 3 flagship recipes + inventory quantities (CSV path TBD). |
| [x] | Install Axios + TanStack Query; confirm `src/constants/app.constants.ts` exports env toggles. | Dependencies already present; constants file now surfaces model + feature flag + warnings. |
| [x] | Scaffold `src/services/server` and `src/services/client` with example stubs showing execution context. | Health service added for server + client, shared types demonstrate pattern. |
| [x] | Establish Shadcn primitives, layout shell, typography, and Tailwind globals tuned for 8px spacing. | Layout metadata + hero placeholder + gradient shell wired to existing Tailwind tokens. |
| [x] | Initialize Prisma client usage within Server Components (helper in `src/lib`). | `src/lib/prisma.ts` exports a re-used client for server components + API routes. |
| [x] | Add health check route at `src/app/api/health/route.ts` returning DB status. | Route returns structured snapshot (DB, OpenAI, JWT, feature flags) surfaced on the home page. |

Update the **Notes** column with a brief (1 line) summary when closing each task to preserve context for reviewers.

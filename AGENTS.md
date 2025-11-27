# Repository Guidelines

**Orientation:** Before starting any task, thoroughly review every file under the `docs/` directory so context and assumptions remain aligned with the latest documentation.

## Project Structure & Module Organization
Source code lives in `src` with the App Router interface under `src/app` (layout, `page.tsx`, and global styles) and shared helpers in `src/lib`. Centralized environment constants live in `src/constants/app.constants.ts`, and service logic belongs in `src/services` with `server/` and `client/` subdirectories. Static files go in `public`, while product notes and specs are kept in `specs/prd.md`—update that file when requirements shift. Database shape resides in `prisma/schema.prisma`, and the generated client is emitted to `src/generated/prisma`; regenerate it whenever you change the schema. Keep environment secrets in `.env`, and do not commit that file.

## Build, Test, and Development Commands
Use `npm run dev` for a hot-reloading Next.js server at `http://localhost:3000`. Ship-ready bundles come from `npm run build`, and you can verify production output through `npm run start`. Static analysis runs via `npm run lint`, which reads the project ESLint config. Database workflows rely on Prisma scripts: `npm run prisma:generate` to refresh the client, `npm run prisma:migrate` to apply dev migrations, `npm run prisma:studio` for the GUI inspector, and `npm run db:seed` after migrations when seed data exists.

## Coding Style & Naming Conventions
Write modern TypeScript with React Server Components where possible and keep indentation at two spaces (see `src/app/page.tsx` for reference). Favor small, pure components and colocate UI patterns near their route segments. Tailwind CSS utilities live directly in `className` strings—group structural classes before color or state classes to reduce churn. Follow ESLint recommendations plus Next.js best practices and run `npm run lint` before raising a PR. Name files and directories in kebab-case (`user-menu`), while exported components and hooks stay in PascalCase and camelCase respectively. Use Shadcn UI as the base component library, pull iconography from `@phosphor-icons/react`, and default to mobile-first responsive layouts rendered via SSR for best performance. Service files must follow `src/services/server/<name>.server.ts` and `src/services/client/<name>.client.ts` naming to make execution context explicit.

## Testing Guidelines
Automated tests have not been scaffolded yet, so new contributions should introduce coverage alongside features. Prefer React Testing Library with Vitest or Jest, placing specs near the unit (`component.test.tsx`) or under `src/__tests__`. Focus on exercising user-visible flows plus Prisma-backed data helpers; aim for >80% coverage on any new module. Until an e2e suite is added, manually vet database migrations by running `npm run prisma:migrate` against a disposable database before requesting review.

## Commit & Pull Request Guidelines
The snapshot provided here omits `.git`, so default to Conventional Commit subjects (`feat: add onboarding hero`, `fix: prune prisma schemas`) with concise, imperative bodies under 72 characters. Each PR should include a one-paragraph summary, screenshots or terminal output for UI or CLI changes, and a checklist of tests you ran (lint, dev smoke test, migrations). Link to related issues or spec sections (e.g., `specs/prd.md`) to give reviewers context and call out any TODOs that remain.

## Database & Environment Notes
Keep `DATABASE_URL` valid inside `.env`; never hard-code secrets in source. When schema updates demand destructive changes, stage them through `npm run prisma:migrate` so teammates can replay the same steps. Generated Prisma client files under `src/generated/prisma` should be committed to avoid mismatches in CI, but rerun `prisma:generate` after every pull to stay in sync. If you need temporary experimental flags, fork `prisma.config.ts` locally rather than editing the shared version.

Create a local Postgres database called `goodfork_dev` (e.g., `createdb goodfork_dev` once `postgres` is running) and store its connection string inside `.env.local`. The current convention is `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/goodfork_dev?schema=public"`. Update `.env.local` whenever credentials or port numbers change, and keep that file out of source control.

## High-Level Design (HLD) — GoodFork
### Objectives & Scope
Build an AI-powered menu personalization system that combines inventory availability, user goals/allergens/preferences, historical consumption patterns, healthy eating standards, and budget targets. Every request should return 3–5 menu recommendations, each with a concise AI rationale plus an optional "healthy swap" suggestion.

### Users & Personas
- **Consumers** receive personalized menus and contextual nutrition notes inside the UI.
- **Operators/Admins** maintain ingredient inventory and curate recipe metadata to keep suggestions actionable.
- **Analysts (optional)** audit engagement signals, conversion metrics, and recommendation quality for continuous improvement.

### Hackathon Theme Reference
Our track is **AI-Driven Menu Personalization and Nutrition Insights** from `Hackathon 2025 - Kick Off.pdf`. The goal is to deliver an AI experience that tailors nutritionally balanced menus from the live inventory while honoring historical preferences and healthy-eating guidelines. Use the PDF for any clarifications on scoring, scope boundaries, or required demo artifacts.

## Admin Console Expectations
- Admin access is locked to `ADMIN_EMAIL` (configured in `.env.local`) and enforced server-side through `requireAdminUser`/`requireAdminApiUser` in `src/lib/auth.ts`. Never expose admin entry points that skip those helpers.
- `/admin` renders the operator console cards, while `/admin/recipes` mounts `AdminRecipeManager` (see `src/components/admin/admin-recipe-manager.tsx`) for CRUD and inventory edits. Keep new admin pages colocated under `src/app/admin`.
- All recipe/inventory mutations must use the `/api/admin/recipes` and `/api/admin/recipes/[id]` handlers, which validate payloads with `adminRecipeSchema` and normalize nested inventory data before persisting through Prisma. Extend that schema before adding new fields.
- The recipe manager shows a live consumer card preview, so update `RecommendationCard` props alongside any schema changes to avoid drift between operator edits and the consumer experience.

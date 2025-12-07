## GoodFork - AI Menu Personalization

GoodFork is our Hackathon 2025 build for the **AI-Driven Menu Personalization and Nutrition Insights** track. The app collects consumer goals/allergens/preferences, scores live inventory with deterministic rules, optionally re-ranks via OpenAI, and returns 3-5 menu cards with AI rationales plus healthy swap hints.

### Repo Tour
- `docs/` - working plans + PRD (`phase-0.md`, `phase-1-plan.md`, `work-items.md`).
- `src/app/` - App Router routes (home, onboarding, API handlers, layout, global styles).
- `/menus` hosts the personalized dashboard (requires an onboarding email query param), while `/recipes/[slug]` will surface deep-dive nutrition details once that route ships; the landing page at `/` now stays marketing-heavy.
- `src/constants/` - centralized env + feature flag helpers.
- `src/services/` - `server/` Prisma + OpenAI logic, `client/` React Query hooks, `shared/` DTOs.
- `prisma/` - schema, migrations, and `seed.ts` for demo data.
- `public/` - static assets (logos, recipe imagery stubs).

### Prerequisites
1. **Node.js 20+** (Next.js 16 + React 19).
2. **PostgreSQL** with a database named `goodfork_dev`.
3. Copy `.env.local.example` -> `.env.local` and fill:
   ```bash
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/goodfork_dev?schema=public"
   OPENAI_API_KEY="sk-..."
   RECOMMENDER_MODEL="gpt-4o-mini" # defaults to gpt-4o-mini
   NEXT_PUBLIC_ENABLE_HEALTHY_SWAP=true
   JWT_SECRET="local-dev-secret"
   RECIPE_EMBEDDING_MODEL="text-embedding-3-large"
   RECIPE_EMBEDDING_PROVIDER="openai"
   RECIPE_EMBEDDING_VERSION="v1"
   OPENAI_BASE_URL="https://api.openai.com/v1" # override if using Azure/OpenAI proxy
   ADMIN_EMAIL="admin@cargill.com"
   ```

### Install & Database
```bash
npm install
npm run prisma:migrate
npm run prisma:generate
npm run db:seed
```

Seeds provision the `admin@cargill.com` account plus three flagship recipes + inventory states so the recommendation engine can hydrate.

### Docker Dev Stack
Run the entire stack with Docker if you can’t (or don’t want to) manage Postgres manually. This extends the "Local Database Setup" flow documented in `docs/work-items.md`.

1. Copy `.env.local.example` → `.env.local` and update secrets. For Docker Compose, set `DATABASE_URL="postgresql://postgres:postgres@postgres:5432/goodfork_dev?schema=public"`.
2. Build and start services:
   ```bash
   docker compose up -d postgres
   docker compose run --rm web npx prisma migrate deploy
   docker compose run --rm web npm run db:seed # optional
   docker compose up -d web
   ```
3. Visit `http://localhost:3000`. Logs stream via `docker compose logs -f web`.
4. Stop services with `docker compose down` (data persists because the Postgres container mounts the `goodfork_pgdata` volume). Run `docker compose down -v` only if you want to wipe the DB.

`docker/postgres/init.sql` installs the `pgvector` extension automatically, so embeddings work inside containers the same way they do locally. If you need a clean start, delete the named volume (`docker volume rm goodfork_pgdata`) and rerun the migration + seed commands.

### Core Scripts
| Script | Description |
| --- | --- |
| `npm run dev` | Next.js dev server at `http://localhost:3000`. |
| `npm run build` / `npm run start` | Production build + serve. |
| `npm run lint` | ESLint (TypeScript + Next.js config). |
| `npm run prisma:migrate` | Apply Prisma migrations (dev). |
| `npm run prisma:generate` | Rebuild Prisma client (`src/generated/prisma`). |
| `npm run db:seed` | Seed demo users + inventory. |
| `npm run admin:create -- admin@example.com "Admin Name"` | Upsert the admin account using the provided email/name (password defaults to `admin@123` unless `ADMIN_PASSWORD` is set). |
| `npm run recipes:import -- data/recipes.json` | Load the Kaggle dataset into the `Recipe` + `InventoryItem` tables. |
| `npm run recipes:embed -- 50` | Generate embeddings for up to 50 recipes missing the configured vector version. |

### Admin Recipes
- After logging in as `admin@cargill.com` you’ll be redirected to the `/admin` hub with entry cards for Recipes and Inventory management.
- Visit `/admin/recipes` to manage dishes; the route is server-guarded against non-admin sessions.
- The admin console exposes CRUD over every recipe + inventory column defined in Prisma along with a live Recommendation Card preview so operators can see consumer-facing output instantly.
- All actions flow through `/api/admin/recipes` (POST for create, PUT for update, DELETE for removal) and respect the `InventoryItem` relation. Inventory status + restock dates update the same row the recommendation engine uses.

### Recipe Dataset & Embeddings
1. Place the Kaggle payload at `data/recipes.json` (already checked in).
2. Run `npm run recipes:import -- data/recipes.json` to normalize slugs, macros, prep/cook times, and seed inventory placeholders. Re-running updates existing rows via `sourceId`.
3. Ensure `OPENAI_API_KEY`, `RECIPE_EMBEDDING_MODEL`, and `RECIPE_EMBEDDING_PROVIDER` are configured. Then run `npm run recipes:embed -- 25` (limit optional) to create semantic vectors in the new `RecipeEmbedding` table.
4. Recommendation services can now read both the enriched recipe metadata and embeddings to support semantic filtering, swaps, and similarity lookups.

### Phase 1 Flows
1. **Onboarding (`/onboarding`)**
   - Multi-step client flow posting to `POST /api/onboarding`.
   - Persists/updates `User` + `UserProfile` rows via `saveOnboardingProfile`.
   - Success banner links to `/menus?prefillEmail=<your-email>` so the dedicated menus route preloads the same user.
2. **Recommendations (`/api/recommendations`)**
   - Input: `{ userId?: string, email?: string, limit?: number (3-5), sessionId?: string }`.
   - Service filters allergen-safe, in-stock recipes, scores them, optionally re-ranks with OpenAI, and saves `Recommendation` rows (metadata stores scoring deltas + AI/deterministic provenance).
   - Response: `{ success, message, data: { userId, requested, delivered, source, recommendations[] } }`.
3. **Landing Experience (`src/app/page.tsx`)**
   - Rebuilt into a motion-friendly marketing hero plus story sections (Why GoodFork, Healthy swaps, Operator teaser, testimonials) so `/` stays focused on acquisition.
   - CTA buttons route to `/onboarding` and `/menus` (the latter redirects back to onboarding unless you carry a valid `prefillEmail`).
   - Login still lives in the final section, but the personalized recommendations UI has been moved entirely off the landing page.
4. **Recipe deep dive (planned `/recipes/[slug]`)**
   - Each recommendation will link to a standalone page with hero imagery, macros, AI rationale history, inventory notes, and swap suggestions for demo storytelling.

### Demo Workflow
1. Run onboarding with any email + profile inputs.
2. After success, click "Head to menus" (link carries `prefillEmail`).
3. Visit `/menus?prefillEmail=<your-email>` to auto-fetch your personalized menus (direct `/menus` visits redirect to onboarding until you have a profile).

### Testing & Linting
- `npm run lint` before submitting PRs.
- Snapshot + accessibility sweeps are tracked in `docs/phase-1-plan.md` (Phase 1) and upcoming work items.

### Reference Docs
- `docs/engineering-guide.md` - architecture, data models, and feature flows.
- `docs/work-items.md` - phase backlog and task tracking.
- `specs/prd.md` - canonical product requirements.
- `Hackathon 2025 - Kick Off.pdf` - judging rubric and scope clarifications.

Questions? Check the PRD (`specs/prd.md`) for requirements context before expanding scope. Happy hacking!

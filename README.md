## GoodFork - AI Menu Personalization

GoodFork is our Hackathon 2025 build for the **AI-Driven Menu Personalization and Nutrition Insights** track. The app collects consumer goals/allergens/preferences, scores live inventory with deterministic rules, optionally re-ranks via OpenAI, and returns 3-5 menu cards with AI rationales plus healthy swap hints.

### Repo Tour
- `docs/` - working plans + PRD (`phase-0.md`, `phase-1-plan.md`, `work-items.md`).
- `src/app/` - App Router routes (home, onboarding, API handlers, layout, global styles).
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
   ```

### Install & Database
```bash
npm install
npm run prisma:migrate
npm run prisma:generate
npm run db:seed
```

Seeds provision the `admin@cargill.com` account plus three flagship recipes + inventory states so the recommendation engine can hydrate.

### Core Scripts
| Script | Description |
| --- | --- |
| `npm run dev` | Next.js dev server at `http://localhost:3000`. |
| `npm run build` / `npm run start` | Production build + serve. |
| `npm run lint` | ESLint (TypeScript + Next.js config). |
| `npm run prisma:migrate` | Apply Prisma migrations (dev). |
| `npm run prisma:generate` | Rebuild Prisma client (`src/generated/prisma`). |
| `npm run db:seed` | Seed demo users + inventory. |

### Phase 1 Flows
1. **Onboarding (`/onboarding`)**
   - Multi-step client flow posting to `POST /api/onboarding`.
   - Persists/updates `User` + `UserProfile` rows via `saveOnboardingProfile`.
   - Success banner links back home with `/?prefillEmail=<your-email>` so the recommendation pane preloads the same user.
2. **Recommendations (`/api/recommendations`)**
   - Input: `{ userId?: string, email?: string, limit?: number (3-5), sessionId?: string }`.
   - Service filters allergen-safe, in-stock recipes, scores them, optionally re-ranks with OpenAI, and saves `Recommendation` rows (metadata stores scoring deltas + AI/deterministic provenance).
   - Response: `{ success, message, data: { userId, requested, delivered, source, recommendations[] } }`.
3. **Home Preview (`src/app/page.tsx`)**
   - The "Personalized menu cards" section uses React Query (`useRecommendationsMutation`) + Axios to call the API.
   - Displays skeletons while fetching, empty/validation states, and live cards with nutrition badges, rationale, and healthy swap copy. Inventory indicator switches colors for low/ready stock.

### Demo Workflow
1. Run onboarding with any email + profile inputs.
2. After success, click "Head to menus" (link carries `prefillEmail`).
3. On the home page, the recommendation panel auto-fetches your personalized menus. You can also enter the same email manually and hit **Personalize** to re-query.

### Testing & Linting
- `npm run lint` before submitting PRs.
- Snapshot + accessibility sweeps are tracked in `docs/phase-1-plan.md` (Phase 1) and upcoming work items.

### Reference Docs
- `docs/phase-0.md` - foundations checklist.
- `docs/phase-1-plan.md` - SMART goals, TODO log, risks/assumptions (update after each milestone).
- `docs/work-items.md` - multi-phase backlog.
- `Hackathon 2025 - Kick Off.pdf` - judging rubric and scope clarifications.

Questions? Check the PRD (`docs/PRD.md`) for requirements context before expanding scope. Happy hacking!

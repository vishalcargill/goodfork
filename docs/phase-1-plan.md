# Phase 1 – Personalized Recommendations Plan

## Objective (SMART)
- Deliver an end-to-end personalized menu flow that returns 3–5 AI-ranked menu cards with rationales and optional healthy swaps, using live inventory and stored user profiles, by the Phase 1 milestone (M1).
- Achieve < 5% error rate for recommendation requests in local/dev and demo environments, with p95 end-to-end response time ≤ 3s for seeded data.
- Ensure the flow works on mobile (360–390px) via SSR-first render and passes basic accessibility checks (labels, focus order) for key interactions.
- Timebox: 3-day Phase 1 window (D1–D3) with milestones at end of each day (M1: onboarding saved; M2: recommendation vertical slice; M3: demo-ready polish) aligned to the hackathon schedule.
- Quality check: Objective would be weak if it only described implementation tasks; mitigated by tying it to concrete UX outcomes, reliability, and performance thresholds.

## Scope & Out-of-Scope
- In scope:
  - Consumer onboarding (goals, allergens, dietary preferences, budget band) persisted to the database.
  - Recommendation service that combines deterministic filters (allergens, stock, price) with LLM re-ranking and rationale generation.
  - Recommendation UI cards with nutrition badges, cost, AI rationale, and “Healthy Swap” CTA, including loading, empty, and error states.
  - Minimal feedback capture (accept/save/swap) stored for later analytics and model tuning.
- Out of scope:
  - Full operator dashboard and analytics UI (Phase 2+).
  - Multi-tenant/location support, payments, or detailed pricing rules beyond a simple per-portion price.
  - Production-grade auth flows beyond the simple login pattern planned for the hackathon.
  - Automated scheduling of nightly inventory ingest; Phase 1 assumes manually seeded or stubbed inventory.
- Quality check: Scope would be weak if Phase 1 quietly absorbed operator tooling or production hardening; mitigated by explicitly deferring dashboards, multi-tenant support, and scheduled jobs.

## Deliverables
- Onboarding flow: multi-step form (or progressive sheet) that writes a user profile (goals, allergens, preferences, budget) to Postgres via Server Actions.
- Recommendation API: route handler (for example, `app/api/recommendations/route.ts`) that calls a server-side recommendation service and returns 3–5 ranked items with rationale and healthy swap suggestions.
- Recommendation service: module under `src/services/server` combining deterministic filters with an LLM-backed scorer, using env-configured model and safety guardrails.
- Recommendation UI: responsive recommendation list on the home screen (or `/menu`) with cards, skeletons, empty and error views, and simple telemetry hooks.
- Feedback logging: minimal table and endpoint for accept/save/swap events, wired from the UI.
- Phase 1 TODO log: living task list (below) updated after each completed task with a one-line note.
- Milestones & appetite (3 days, subject to hackathon schedule):
  - M1 – End of Day 1: Onboarding flow persists user profile to the database for a seeded demo user.
  - M2 – End of Day 2: Recommendation API + service integrated with UI, returning 3–5 cards for seeded profiles.
  - M3 – End of Day 3: Demo-ready flow with feedback logging, basic telemetry, and mobile SSR polish.
- RACI by milestone (roles: TL = Tech Lead, FE = Frontend, BE = Backend, PM = Product/Founder):
  - M1: R = FE, A = TL, C = PM, I = BE.
  - M2: R = BE, A = TL, C = FE, I = PM.
  - M3: R = TL, A = PM, C = FE, I = BE.
- Quality check: Deliverables would be weak if they were only code modules; mitigated by framing them as user-visible flows plus backing services, telemetry, and milestone/RACI ownership.

### Phase 1 TODO Log
| Status | Priority | Task | Owner | Last update note |
| --- | --- | --- | --- | --- |
| [x] | Must | Implement consumer onboarding flow persisting user profile to the database. | FE + BE | Multi-step onboarding route now calls `/api/onboarding` via shared Axios + TanStack mutation to persist through Prisma. |
| [x] | Must | Build recommendation API and service combining deterministic filters with LLM ranking. | BE | `/api/recommendations` now calls a Prisma-backed service with inventory/profile filters plus optional LLM rerank + fallback rationale. |
| [x] | Must | Render recommendation cards with nutrition badges, rationale, and healthy swap UI. | FE | Home recommendations section now calls `/api/recommendations` with onboarding email + renders live cards, skeletons, and empty/error states. |
| [x] | Should | Capture feedback events (accept/save/swap) and persist them for analytics. | BE | `/api/feedback` now validates Zod payloads, logs to Prisma `Feedback` with action enums, and updates recommendation status for analytics. |
| [x] | Should | Add basic telemetry for recommendation requests and failures. | TL | `/api/recommendations` now emits request/success/failure events with requestId + latency via the shared telemetry logger for quick log-based metrics. |
| [x] | Should | Validate mobile SSR experience and basic accessibility for the flow. | FE | Onboarding + recommendation UIs now expose aria labels/live regions and stack actions cleanly at 360px for the demo-ready sweep. |

## Dependencies
- Phase 0 foundations available:
  - Prisma schema covering users, profiles, recipes, inventory, recommendations, and feedback, with baseline migration applied to `goodfork_dev`.
  - Local Postgres `goodfork_dev` reachable via `DATABASE_URL` in `.env.local`.
  - Seeded inventory and recipe data representative enough to power recommendations.
- Platform and keys:
  - Valid `OPENAI_API_KEY` in `.env.local` and a chosen recommendation model optimized for quality (no practical rate limit constraints for the hackathon).
  - Working Next.js app shell with Shadcn UI primitives and Tailwind tokens.
  - Shared Axios instance now lives in `src/config/axios.config.ts`; route clients should import it instead of instantiating Axios ad hoc.
- Alignment and inputs:
  - Confirmed initial scoring guidelines and healthy-eating rules based on the PRD.
  - Agreement on card layout and onboarding steps (even as low-fidelity wireframes).
- Hackathon appetite and schedule for Phase 1 (3-day window, D1–D3) confirmed with the team.
- Quality check: Dependencies would be weak if they were implicit; mitigated by referencing specific env vars, schema pieces, and design alignment gates.

## Top Risks → Mitigations
- LLM latency or low-quality responses (even without hard rate limits) → cache deterministic recommendations where possible, support a “deterministic only” fallback mode, and log degraded responses.
- Inventory or allergen data gaps → add defensive checks and conservative defaults (hide items with missing allergens or macros).
- Overly complex prompt or logic during the hackathon timeline → start with a simple prompt plus rules and iterate only if time permits.
- UX confusion around “healthy swap” → provide concise copy and a clear “why this swap” rationale within the card or swap UI.
- Misalignment with hackathon judging criteria or PRD scope → review the PRD and Kick Off deck against Phase 1 deliverables at M1, and adjust backlog early if gaps appear.
- Quality check: Risks would be weak if they were generic engineering concerns; mitigated by focusing on LLM, data quality, and UX-specific issues plus concrete fallbacks.

## Assumptions (Testable)
- Phase 0 migrations complete and recommendation-related tables exist before Phase 1 coding starts.  
  - Test: run `npm run prisma:migrate` and hit the health-check route before starting Phase 1 work.
- Single-tenant operator and global inventory for Phase 1.  
  - Test: confirm PRD and avoid location-specific keys in schema or APIs.
- Hackathon judges will test on a seeded demo tenant, not live data.  
  - Test: create and use a deterministic seed script and demo account.
- OpenAI usage is allowed with sufficient capacity for the demo (no practical rate limit concerns).  
  - Test: run a small scripted loop against the recommendation endpoint to validate latency and error behavior.
- Phase 1 appetite is a 3-day window (D1–D3) with milestones as defined above.  
  - Test: confirm dates and appetite with the team or hackathon schedule, and update milestones if they change.
- Quality check: Assumptions would be weak if they were untestable; mitigated by attaching a concrete validation step to each assumption.

## Success Metrics
- Functional: ≥ 95% of recommendation requests return 3–5 cards without server error in local/dev.
- Performance: p95 end-to-end time from request to first paint ≤ 3s on seeded data in local/dev on a typical laptop.
- Experience: Seeded demo users can complete onboarding and see at least one healthy swap option in their first session.
- Reliability: 100% of LLM failures fall back to deterministic recommendations with clear UI messaging.
- Quality check: Metrics would be weak if they only tracked task completion; mitigated by tying them to runtime behavior and observable UX outcomes.

## Review Cadence
- Daily 15–20 minute check-in to review TODO log updates, unblock risks, and adjust scope.
- Mid-phase design/UX sync focusing on the recommendation card and healthy swap interaction.
- End-of-phase review against success metrics with a short demo using the seeded demo user.
- Update the Phase 1 TODO log after each completed task with a one-line note summarizing what changed and any follow-ups.
- Align D1/D2/D3 check-ins with M1/M2/M3 milestones and named RACI roles to keep ownership clear.
- Quality check: Cadence would be weak if it were ad hoc; mitigated by scheduling recurring check-ins and tying them to metric, milestone/RACI, and TODO updates.

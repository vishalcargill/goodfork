# Recipe Detail Page Plan

This plan captures the scope, design intentions, and implementation checklist for the new consumer recipe detail view and AI insights tab requested in the latest spec update.

## Objectives
- Surface every stored recipe attribute (imagery, macros, allergens, inventory state, instructions, nutrition object) on a dedicated `/recipes/[slug]` route.
- Provide an on-page “AI Insights” tab that narrates health benefits and contextualizes highlights without requiring a round-trip to OpenAI.
- Keep the experience aligned with the mobile-first visual system already used on `/menus`.

## Requirements & Data Needs
1. **Routing & Fetching**
   - Dynamic App Router segment at `src/app/recipes/[slug]/page.tsx`.
   - Prisma query by slug including `inventory`, `healthyHighlights`, `nutrients`, and `recommendations` metadata for context.
   - `notFound()` fallback when a slug is unknown.
2. **Hero & Metadata**
   - Prominent image, title, cuisine, dishType, and rating details.
   - Macro chips (calories, protein, carbs, fat) plus price and prep/cook time breakdown.
   - Inventory badge that mirrors the statuses used on recommendation cards.
3. **Content Sections**
   - Ingredient list (ordered by the stored array) and step-by-step instructions.
   - Nutrition grid that iterates `recipe.nutrients` entries.
   - Highlight chips for tags, allergens, and healthy highlights.
4. **AI Insights Tab**
   - Deterministic insight generator that inspects macros, calories, nutrients, and highlight enums to craft “health benefit” blurbs.
   - Client tab component with at least two triggers (`Nutrition snapshot`, `AI insights`) so the AI copy feels like an intentional tab destination.
   - Accessible keyboard / ARIA roles for the tablist and tabpanels.

## Implementation Checklist
| Status | Task | Notes |
| --- | --- | --- |
| ☐ | Create `RecipeDetailService` helper (`src/services/server/recipes.server.ts`) that loads the recipe + derived metadata (macros label, formatted timings, deterministic AI insight data). | Keeps retrieval logic out of the route. |
| ☐ | Build `RecipeInsightsTabs` client component for the tab UI plus any supporting formatting helpers (chips, lists, inventory badges). | Lives under `src/components/recipes`. |
| ☐ | Implement `src/app/recipes/[slug]/page.tsx` server component using the service + components, including metadata export + graceful not-found. | Layout mirrors `/menus` visual rhythm with hero + content stack. |
| ☐ | Add regression notes / follow-ups to PRD if the recipe view becomes part of the consumer journey (future). | Optional but recommended post-implementation. |

## Open Questions
1. Do we need to gate `/recipes/[slug]` behind auth/session awareness or can this be public like the landing page? (Assuming public for hackathon demo unless told otherwise.)
2. Should “AI Insights” eventually call out the real LLM output used in recommendations, or is the deterministic blurb sufficient for M1?
3. Are we linking to this page from recommendation cards / admin preview automatically, or will the entry point ship later?

Document owner: Codex agent — update after implementation to note any deviations or follow-on tasks.

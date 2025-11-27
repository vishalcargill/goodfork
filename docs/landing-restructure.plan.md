# Landing Page Restructure & Experience Split Plan

This document outlines the work required to separate the marketing landing page from the personalized experience, introduce a dedicated `/menus` route, and create recipe deep-dive pages. The steps below capture deliverables, dependencies, and sequencing so implementation can start once resourcing allows.

---

## Objectives
1. Rebuild `/` into an animation-rich marketing hero that tells the GoodFork story, highlights differentiators, and funnels visitors to onboarding or login.
2. Move the recommendation UI off the landing page and into a dedicated `/menus` route that hydrates from onboarding data and future authenticated sessions.
3. Add `/recipes/[slug]` detail pages that extend each recommendation card with imagery, nutrition, rationale history, and inventory/healthy swap context.
4. Update shared navigation (header/footer) to reinforce the new flow and respond to user auth state when wiring sessions later.

---

## Work Breakdown Structure

### 1. Landing Page Rebuild (`/`)
- **Hero Animation**
  - Use Framer Motion to animate hero typography, CTA buttons, and background gradients.
  - Add scroll-linked scenes: feature cards slide in, nutrition stats count up, AI copy stream animates.
  - Keep fetch logic out of this page; only static/marketing content.
- **Story Sections**
  - Why GoodFork (inventory + AI copy).
  - Healthy swaps highlight w/ micro-interactions.
  - Operator tooling teaser pointing to `/admin`.
  - Testimonials/metrics block.
- **CTA Layout**
  - Header: Logo + Start personalization + Log in.
  - Sticky bottom CTA on mobile for Start personalization.
  - “See menus” button that routes to `/menus` (gated by email) once implemented.
- **Accessibility & Performance**
  - Ensure motion respects reduced-motion preference.
  - Use CSS gradients + SVG for background art to avoid heavy assets.

### 2. Menus Page (`/menus`)
- **Routing**
  - Create a new App Router segment `src/app/menus/page.tsx`.
  - Require onboarding email query param (temporary) or session in future.
  - Redirect to onboarding if prerequisites missing.
- **Components**
  - Move `RecommendationsDemo` (and supporting components) from home page to `/menus`.
  - Replace preview hero with dashboard shell: profile summary, recommendations list, swap insights.
  - Keep Sonner toast + status chips.
- **Data Flow**
  - Accept `prefillEmail` from onboarding success link.
  - Later: hydrate from server session to bypass manual email entry.
- **Analytics**
  - Instrument page views and CTA interactions to monitor conversion from landing.

### 3. Recipe Detail Pages (`/recipes/[slug]`)
- **Route Setup**
  - Use dynamic route `src/app/recipes/[slug]/page.tsx`.
  - Server-fetch recipe + inventory + recent recommendation metadata from Prisma.
- **Page Sections**
  - Hero: large image (with fallback), macros badges, pricing, stock status.
  - AI rationale history: show deterministic + LLM copy, swap notes.
  - Ingredient/method breakdown.
  - Healthy swap module linking to alternative recipes.
  - CTA: “Add to plan”, “Request swap”, etc. (hook into feedback API later).
- **SEO/Sharing**
  - Add metadata per recipe (title, description, open graph image).
- **Navigation**
  - Provide back link to `/menus` with anchor to the originating recommendation.

### 4. Navigation Updates
- **Header**
  - Already simplified to Logo + Start personalization + Log in.
  - When auth wiring lands, conditionally show “View menus” or “Admin”.
- **Footer**
  - Update links to include Menus and Recipes once routes ship.
  - Add quick CTA repeating Start personalization.

---

## Sequencing & Dependencies
1. **Design polish**: finalize motion + content mocks for landing (Figma or similar). _Dependency:_ approvals on visual direction.
2. **Implement landing skeleton**: update `/`, strip data fetching, add hero sections with placeholder copy. _Dependency:_ none after mocks.
3. **Create `/menus` route**: move recommendation UI, update onboarding success link to `/menus?prefillEmail=...`. _Dependency:_ landing skeleton done so references updated.
4. **Adjust header/footer + docs**: once `/menus` exists, update navigation + README to point to new routes. _Dependency:_ route live.
5. **Build recipe detail route**: ingest data, design sections, connect from recommendation cards (“Learn more”). _Dependency:_ menus page stable to link back.
6. **Telemetry & QA**: track conversions, test mobile/responsive states, and validate accessibility for new flows. _Dependency:_ routes implemented.

---

## Testing Strategy
- **Landing page**: manual QA across breakpoints, verify reduced motion support, ensure CTA links route correctly.
- **Menus page**: unit test data hooks if possible; manual smoke to confirm Sonner toast + API flows behave post-migration.
- **Recipe detail**: snapshot or component tests for critical sections, manual verification with seeded recipes.
- **Regression**: run `npm run lint` and minimal smoke (`npm run dev`) after each phase.

---

## Risks & Mitigations
- **Scope creep**: marketing redesign can balloon. Mitigate by timeboxing animation polish and shipping iterative sections.
- **Routing confusion**: users might bookmark old home preview. Provide redirect or banner on `/` pointing to `/menus` until everyone migrates.
- **Data fetching duplication**: ensure recommendation logic doesn’t exist in two places by fully removing from home once `/menus` is live.
- **Recipe detail data gaps**: some recipes may lack fields; enforce fallbacks (placeholders, default copy) similar to card behavior.

---

## Next Steps
1. Review this plan with stakeholders for sign-off.
2. Break down each section into tickets (landing hero, menus route, recipe detail, nav update).
3. Begin with landing skeleton + `/menus` routing before expanding into recipe detail storytelling.


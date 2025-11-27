# Phase 2 — Insights & Operator Tools Plan

This document breaks down the remaining Phase 2 scope outlined in `docs/work-items.md` and `docs/PRD.md` into concrete, trackable tasks. Status values: ✅ Complete, 🔄 In Progress, 💤 Not Started.

## Objectives
- Ship a production-ready inventory console (`/admin/inventory`) with inline edits, restock tooling, and alerts so operators can trust the personalization engine.
- Extend recommendation services so inventory availability is enforced end-to-end.
- Add analytics + nightly sync workflows to keep stock data accurate and observable.

## Milestones
1. **M2.1 — Data Foundations:** ensure Prisma schema, importers, and environment toggles cover inventory scenarios (target: Day 1 of Phase 2).
2. **M2.2 — Operator Console Vertical Slice:** `/admin/inventory` CRUD with guardrails + live preview (target: Day 2).
3. **M2.3 — Automation & Observability:** nightly sync hook, low-stock alerts, instrumentation, and docs (target: Day 3).

## Task Tracker
| ID | Status | Owner | Description | Notes |
| --- | --- | --- | --- | --- |
| P2-001 | ✅ Complete | SA | Validate Prisma inventory schema + gaps vs. recipe dataset. | Confirmed `InventoryItem` relation + status enums already exist (`prisma/schema.prisma:70-163`). Identified need for future `Ingredient` tables but safe to defer for MVP. |
| P2-002 | ✅ Complete | SA | Define ingestion/sync approach derived from `data/recipes.json`. | Plan covers importer updates + standalone `import-inventory` script with CSV contract and cron hook; see “Data Model & Sources” decision notes. |
| P2-003 | ✅ Complete | BE | Update recipe importer to seed/update `InventoryItem` rows with sane defaults + threshold logic. | Added configurable heuristics (`INVENTORY_*` env overrides) that derive quantity, low-stock thresholds, and restock ETAs when importing Kaggle recipes so every recipe now gets a consistent `InventoryItem` snapshot. |
| P2-004 | ✅ Complete | BE | Implement `/api/admin/inventory` handlers (list, bulk update, restock mutation) guarded by `requireAdminApiUser`. | Added GET/PATCH/POST handlers plus validation schemas so admins can fetch, bulk update, and restock inventory through a single endpoint with consistent Prisma includes + error handling. |
| P2-005 | ✅ Complete | FE | Build `/admin/inventory` UI with filtering, inline edits, restock drawer, and live recommendation preview. | New AdminInventoryManager client component ships search/filter controls, inline quantity edits, restock drawer, and RecommendationCard preview wired into the freshly exposed API. |
| P2-006 | ✅ Complete | BE | Wire recommendation service to join inventory, filter OUT_OF_STOCK, and deprioritize low stock. | Recommendation service now filters to IN_STOCK first, heavily penalizes low stock via scoring adjustments, and propagates granular inventory copy into deterministic rationales so AI + fallback paths honor availability. |
| P2-007 | ✅ Complete | PL | Add low-stock alerts + analytics events (`inventory.low_stock`, `inventory.restocked`, `inventory.sync_failed`). | Admin console now surfaces a low-stock alert banner + counts, and telemetry events fire on low inventory, restocks, and sync failures across admin + cron endpoints. |
| P2-008 | ✅ Complete | DevOps | Create cron-secured route (e.g., `/api/admin/inventory/import`) + script to ingest nightly CSV/JSON payloads. | Added `/api/admin/inventory/import` secured via `INVENTORY_SYNC_SECRET` plus `npm run inventory:import` script that ingests JSON/CSV feeds locally. |
| P2-009 | ✅ Complete | Docs | Document operator SOP + CSV contract inside `/admin/inventory` and `docs/work-items.md`. | Added SOP + feed contract to docs, highlighted `/admin/inventory`, cron route, and `INVENTORY_SYNC_SECRET` usage in PRD + work-items. |

## Progress Log
- **2025-02-18 @ 14:10** — Completed schema validation (P2-001) and ingestion strategy definition (P2-002); confirmed recipe dataset coverage (`data/recipes.json`) aligns with current Prisma model. Next focus: start importer updates (P2-003).
- **2025-02-18 @ 15:05** — Delivered importer enhancements (P2-003). The script now computes inventory defaults via serves, popularity, and difficulty with env-tunable thresholds + restock projections so initial inventory mirrors real operator heuristics.
- **2025-02-18 @ 15:45** — Wrapped admin inventory API (P2-004). New `/api/admin/inventory` route supplies GET (filters), PATCH (bulk update), and POST (restock) flows with Zod validation + Prisma transactions, unlocking the FE console workstream.
- **2025-02-18 @ 17:05** — Landed `/admin/inventory` console (P2-005). The new AdminInventoryManager handles filters, inline edits, restock drawer, and a live RecommendationCard preview so operators can see immediate consumer impact.
- **2025-02-18 @ 17:40** — Inventory-aware personalization (P2-006) shipped. Recommendation service now prioritizes IN_STOCK dishes, penalizes low stock, and injects quantity-aware copy into rationales so AI + deterministic paths respect availability.
- **2025-02-18 @ 18:10** — Low-stock telemetry + UI alerts (P2-007) completed. Admin console now surfaces urgency banners and emits `inventory.low_stock` / `inventory.restocked` / `inventory.sync_failed` events from every touchpoint.
- **2025-02-18 @ 18:30** — Cron import pipeline (P2-008) online. Added `/api/admin/inventory/import` guarded by `INVENTORY_SYNC_SECRET` plus `npm run inventory:import` to replay nightly feeds from CSV/JSON dumps.
- **2025-02-18 @ 18:45** — Documentation refresh (P2-009). PRD + work-items now outline the `/admin/inventory` SOP, feed columns, cron route handshake, and new env variable so operators know exactly how to manage stock.

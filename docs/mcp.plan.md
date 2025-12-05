# MCP Integration Plan — Supabase Connector

## Summary
- Goal: expose a Supabase-backed MCP connector that mirrors our Prisma data (users, profiles, recipes, inventory, feedback) and let `/menus` switch data sources via query param (`?source=backend|supabase`), keeping SSR stable by passing the initial source from the server to the client.
- Menus route is SSR (server component page that passes props into a client recommendations component), so the toggle must be persisted in the URL to avoid hydration mismatches.
- Data parity first: seed + migrate Postgres (Prisma), export to Supabase, verify counts/checksums, then enable the Supabase MCP read path.

## Approach
- Toggle: query param `source` with allowed values `backend` (default) or `supabase`; server page reads it and passes to client; client switch updates the query param via router replace.
- MCP connector: Supabase MCP server with routes for reads (recipes + inventory + profiles + feedback) and a bulk import endpoint for initial sync. Use the same DTO shapes used by the recommendation service to avoid mapping drift.
- Sync: one-way export from Prisma DB into Supabase before enabling the MCP fetch path; keep a verification script to compare row counts and simple checksums.
- Safety: keep deterministic filters (allergens, availability) consistent across both sources; if MCP fails, fall back to backend.

## Tasks
- [x] Document SSR/CSR decision and query-param toggle strategy in `docs/mcp.plan.md`. _Note: captured Menus SSR shape and source toggle plan._
- [x] Add query-param data-source plumbing to Menus + Recommendations client (read `source`, default backend, persist via router replace; show selected source badge). _Implemented initial source parsing on Menus SSR page and client toggle with router replace + refetch trigger._
- [x] Define Supabase MCP contract + types (schemas for recipes, inventory, profiles, feedback) mirroring current DTOs; include payload for bulk import. _Added shared Supabase row/bulk payload types under `src/services/shared/supabase-mcp.types.ts`._
- [x] Implement `scripts/export-to-supabase.ts` to read via Prisma and upsert into Supabase (truncate/overwrite flag, chunked writes). _Script supports `--truncate`, chunked upserts, Accept/Content-Profile headers, and covers users/profiles/recipes/inventory/recommendations/feedback._
- [x] Implement `scripts/verify-supabase-sync.ts` to compare counts + simple checksums (ids, updatedAt) between Prisma DB and Supabase. _Parity checker pulls minimal columns, hashes IDs+timestamps, and surfaces mismatches in exit code._
- [ ] Build Supabase MCP server connector with read endpoints and bulk import; guard with service key from `.env.local`.
- [x] Wire Supabase MCP fetcher into recommendation service (client/server) so `source=supabase` uses MCP path; keep backend fallback on MCP errors. _API route now attempts Supabase MCP first (env-driven URL/key) and falls back to Prisma if MCP is missing or fails; telemetry retains requested source._
- [ ] Add minimal smoke tests/manual checklist for both data paths (backend vs Supabase MCP) before demo.

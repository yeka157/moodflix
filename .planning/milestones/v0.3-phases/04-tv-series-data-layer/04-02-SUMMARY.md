---
phase: 04-tv-series-data-layer
plan: 02
subsystem: api
tags: [tmdb, typescript, tv-series, tanstack-query, proxy-routes, normalization]

requires:
  - phase: 04-tv-series-data-layer
    plan: 01
    provides: TVShow, TVListResponse, TVDetailsResponse types and normalizeTVShow() function in types/tv.ts; TV TMDB fetch functions in lib/tmdb.ts

provides:
  - TV list proxy route at /api/tv with 4 category handlers (trending, top_rated, korean_drama, chinese_drama)
  - TV details proxy route at /api/tv/[id] with regional watch providers and mediaType discriminant
  - TanStack Query hooks in hooks/use-tv.ts: useTrendingTV, useTopRatedTV, useKoreanDramas, useChineseDramas (return Movie[]), useTVDetails (returns TVDetailsResponse)

affects:
  - 04-03 (UI components import hooks/use-tv.ts to render TV data on /series page)

tech-stack:
  added: []
  patterns:
    - "TV proxy routes mirror /api/movies/ pattern exactly — same Next.js 16 async params, same error shape, same try/catch structure"
    - "Normalization at hook boundary — normalizeTVShow() called inside queryFn, not at API route level, so Movie[] flows to all downstream components"
    - "Details route adds mediaType: 'tv' discriminant to response — Phase 5 modal branches on this field"

key-files:
  created:
    - app/api/tv/route.ts
    - app/api/tv/[id]/route.ts
    - hooks/use-tv.ts
  modified: []

key-decisions:
  - "Normalization at hook boundary (not API route) — queryFn calls normalizeTVShow() so API routes remain agnostic and return raw TMDB shapes"
  - "Details hook returns TVDetailsResponse as-is — modal needs TV-specific fields (seasons, episodes, created_by, networks) that would be lost by normalization"
  - "fetchTVCategory is private (not exported) — only the 4 named hooks are public API, consistent with use-movies.ts pattern"

metrics:
  duration: 2min
  completed: 2026-02-22
  tasks: 2
  files_created: 3
  files_modified: 0
---

# Phase 4 Plan 02: TV API Routes and Query Hooks Summary

**TV API proxy routes and TanStack Query hooks completing the data pipeline — /api/tv with 4 category handlers, /api/tv/[id] with mediaType discriminant, and hooks/use-tv.ts normalizing TVShow to Movie[] at the query boundary**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-22T10:21:02Z
- **Completed:** 2026-02-22T10:23:01Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments

- Created `app/api/tv/route.ts` — GET handler supporting 4 categories (trending, top_rated, korean_drama, chinese_drama), dispatching to the correct TMDB fetch function from Plan 01
- Created `app/api/tv/[id]/route.ts` — GET handler with Next.js 16 async params, regional watch provider extraction via getCountryFromHeaders, and `mediaType: "tv"` discriminant for Phase 5 modal branching
- Created `hooks/use-tv.ts` — 7 exports: tvKeys query key factory, TVCategory type, 4 category hooks returning normalized `Movie[]`, 1 details hook returning `TVDetailsResponse`
- Normalization happens inside `queryFn` via `normalizeTVShow()` — all downstream movie card components receive `Movie[]` without modification

## Task Commits

Each task was committed atomically:

1. **Task 1: Create TV API proxy routes** - `3a7f9bd` (feat)
2. **Task 2: Create TanStack Query hooks for TV data** - `0508b2b` (feat)

**Plan metadata:** committed after summary creation (docs)

## Files Created/Modified

- `app/api/tv/route.ts` — 4-category GET handler mirroring movies route structure
- `app/api/tv/[id]/route.ts` — TV details GET handler with watch providers and mediaType discriminant
- `hooks/use-tv.ts` — TanStack Query hooks with normalization at query boundary

## Decisions Made

- Normalization happens inside `queryFn` (not at API route) — locked decision from v0.3 roadmap; API routes return raw TMDB TVShow shapes
- `fetchTVDetails` does not normalize — TVDetailsResponse preserves TV-specific fields (number_of_seasons, number_of_episodes, created_by, networks) needed by the detail modal
- `fetchTVCategory` is unexported (private) — only named hooks are public, consistent with use-movies.ts pattern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 5 `/series` page UI can now `import { useTrendingTV, useKoreanDramas, useChineseDramas, useTopRatedTV } from "@/hooks/use-tv"` and receive `Movie[]` directly compatible with existing MovieCard and MovieRow components
- `useTVDetails(id)` returns `TVDetailsResponse` with `mediaType: "tv"` discriminant, enabling the existing movie-detail-modal to branch on `mediaType` for TV-specific display fields
- TypeScript strict mode, ESLint, and production build all verified clean

## Self-Check

**Files exist:**
- `app/api/tv/route.ts` — FOUND
- `app/api/tv/[id]/route.ts` — FOUND
- `hooks/use-tv.ts` — FOUND

**Commits exist:**
- `3a7f9bd` (Task 1) — FOUND
- `0508b2b` (Task 2) — FOUND

## Self-Check: PASSED

---
*Phase: 04-tv-series-data-layer*
*Completed: 2026-02-22*

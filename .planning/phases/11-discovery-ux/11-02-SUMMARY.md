---
phase: 11-discovery-ux
plan: 02
subsystem: ui
tags: [react, tanstack-query, tmdb, infinite-scroll, tv-search, series-page]

# Dependency graph
requires:
  - phase: 11-discovery-ux
    provides: series page with curated rows and SeriesGridContent browse grid
provides:
  - searchTV TMDB function via /search/tv endpoint
  - /api/tv?query= handler for server-side TV search
  - useTVSearchInfinite TanStack Query hook with deduplication
  - SeriesPageContent client wrapper that owns search state and controls row visibility
  - /series page with functional TV search bar matching /discover UX
affects: [series-page, tv-search, discover-ux]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TV search follows same infinite query pattern as useMovieSearchInfinite
    - Client wrapper (SeriesPageContent) lifts search state so Server Component (SeriesPage) remains stateless
    - isSearchActive = debouncedQuery.length >= 2 gate controls curated row visibility

key-files:
  created:
    - components/series/series-page-content.tsx
  modified:
    - lib/tmdb.ts
    - app/api/tv/route.ts
    - hooks/use-tv.ts
    - app/(app)/series/page.tsx

key-decisions:
  - "SeriesPageContent client wrapper lifts search state — SeriesPage stays a pure Server Component"
  - "Search results use hrefPrefix=/tv/ for direct navigation, not a drawer/modal (consistent with existing TV card behavior)"
  - "dedupeShows inlined in SeriesPageContent to avoid cross-file coupling with SeriesGridContent"
  - "readOnly=true on search result MovieGrid — watchlist bookmarks not shown in TV search results"

patterns-established:
  - "TV search: useTVSearchInfinite with enabled: query.length >= 2 gate, staleTime 2min"
  - "Search bar at top of page always visible; curated rows toggle off when isSearchActive"

requirements-completed: [DISC-01]

# Metrics
duration: 4min
completed: 2026-03-03
---

# Phase 11 Plan 02: TV Search on Series Page Summary

**TV show search bar on /series page using searchTV TMDB function, /api/tv?query= handler, useTVSearchInfinite hook, and SeriesPageContent client wrapper that hides curated rows during active search**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-03T09:14:08Z
- **Completed:** 2026-03-03T09:18:27Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Added `searchTV` function to `lib/tmdb.ts` targeting TMDB `/search/tv` endpoint, mirroring `searchMovies` pattern
- Added `?query=` parameter handling to `/api/tv/route.ts` before the existing `action` check, with `useTVSearchInfinite` hook and `tvKeys.search` in `hooks/use-tv.ts`
- Created `SeriesPageContent` client wrapper that owns search state (inputValue, debouncedQuery, isSearchActive) and conditionally renders either search results or curated rows + Browse All section
- Updated `SeriesPage` server component to delegate all client state to `SeriesPageContent`, keeping it a pure SSR component

## Task Commits

Each task was committed atomically:

1. **Task 1: Add searchTV function, API route handler, and TanStack Query hook** - `294aa8d` (feat)
2. **Task 2: Create SeriesPageContent wrapper and integrate search into the series page** - `f39d175` (feat)

**Plan metadata:** `260c5e6` (docs: complete plan)

## Files Created/Modified
- `lib/tmdb.ts` - Added `searchTV(query, page)` function using `/search/tv` TMDB endpoint
- `app/api/tv/route.ts` - Added `?query=` parameter handler calling `searchTV` before existing action routing
- `hooks/use-tv.ts` - Added `tvKeys.search` key factory and `useTVSearchInfinite` infinite query hook
- `components/series/series-page-content.tsx` - New client wrapper owning search state, rendering search results or curated rows based on `isSearchActive`
- `app/(app)/series/page.tsx` - Replaced inline JSX (SeriesContent + Browse All + SeriesGridContent) with `<SeriesPageContent>` wrapper

## Decisions Made
- `SeriesPageContent` client wrapper lifts search state so `SeriesPage` remains a pure Server Component — Server Components cannot hold client state
- Search results use `hrefPrefix="/tv/"` for direct navigation (not a drawer/modal) — consistent with existing TV card behavior on the series page
- `dedupeShows` helper inlined in `SeriesPageContent` rather than imported from `SeriesGridContent` — avoids coupling two unrelated components
- `readOnly=true` on search result `MovieGrid` — watchlist bookmark icon not shown in TV search results context (browse/discovery context)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- /series page now has full TV search matching /discover movie search UX
- Search replaces curated rows; clearing restores them
- Infinite scroll and deduplication work on search results
- Build and lint pass clean
- Ready for Phase 11 Plan 03 or subsequent discovery UX improvements

---
*Phase: 11-discovery-ux*
*Completed: 2026-03-03*

---
phase: 07-ui-ux-revamp
plan: 03
subsystem: ui
tags: [react, tanstack-query, infinite-scroll, shadcn-select, tmdb, filter]

# Dependency graph
requires:
  - phase: 07-ui-ux-revamp plan 01
    provides: sidebar navigation structure and warm color scheme that these pages sit inside
provides:
  - Discover page: filterable movie grid with Genre, Sort by, Year dropdowns and infinite scroll
  - Series page: filterable TV show grid with Genre (TV_GENRES), Sort by, Year dropdowns and infinite scroll
  - useDiscoverMovies hook with infinite query and decade-range year filtering
  - useDiscoverTV hook with infinite query and decade-range year filtering
  - MovieGrid readOnly prop propagated to MovieCard
affects: [07-04, movie-discovery, series-discovery]

# Tech tracking
tech-stack:
  added: [react-infinite-scroll-hook (already installed), shadcn Select (already installed in Task 1)]
  patterns: [filter-then-infinite-scroll grid pattern, keepPreviousData for smooth filter transitions, decade-range year params mapping]

key-files:
  created:
    - components/movies/discover-grid-content.tsx
    - components/series/series-grid-content.tsx
  modified:
    - app/(app)/discover/page.tsx
    - app/(app)/series/page.tsx
    - hooks/use-movies.ts
    - hooks/use-tv.ts
    - app/api/tv/route.ts
    - components/movies/movie-grid.tsx

key-decisions:
  - "MovieGrid readOnly prop added to MovieGridProps and passed through to MovieCard — previously missing caused TypeScript error in SeriesGridContent"
  - "Decade year values (2020s, 2010s) expand to year_start/year_end range params at hook layer — API and TMDB call use numeric ranges"
  - "keepPreviousData on discover queries gives smooth filter transitions with loading overlay instead of full re-render"
  - "Series page fully client-driven (no SSR prefetch) — grid is filter-first so SSR of unfiltered results adds no value"
  - "SeriesGridContent combines TV_GENRES with shared movie/TV genre IDs for maximum discoverability"
  - "Search bar only on Discover page, not on Series page (per plan spec)"

patterns-established:
  - "Filter grid pattern: useState for genreId/sortBy/year → useMemo params object → useInfiniteQuery → dedupeBySet → MovieGrid with sentinel"
  - "Loading overlay pattern: isPlaceholderData drives opacity-50 + pointer-events-none with centered spinner toast"

requirements-completed: [REVAMP-01]

# Metrics
duration: 15min
completed: 2026-02-24
---

# Phase 7 Plan 03: Discover and Series Grid Layout Summary

**Replaced horizontal-scroll row layouts on Discover and Series pages with filterable grid + infinite scroll using shadcn Select dropdowns for Genre, Sort by, and Year**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-02-24T03:00:00Z
- **Completed:** 2026-02-24T03:15:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Discover page: responsive 2-6 column movie grid with Genre, Sort by, Year filters and search bar; infinite scroll loads more as user scrolls
- Series page: same grid pattern with TV-specific genres (TV_GENRES + shared IDs), read-only cards (no watchlist buttons), infinite scroll
- Both pages use `keepPreviousData` for smooth filter transitions — old results remain visible with loading overlay while new results fetch
- Decade year values (2020s, 2010s, etc.) correctly expand to `year_start`/`year_end` range params at the hook layer

## Task Commits

Each task was committed atomically:

1. **Task 1: Install shadcn Select, create discover grid content with filters** - `5466b1e` (feat)
2. **Task 2: Create series grid content with filters** - `25731d4` (feat)

**Plan metadata:** committed with final docs commit

## Files Created/Modified
- `components/movies/discover-grid-content.tsx` - Client grid with Genre/Sort/Year filters, search bar, infinite scroll for movies
- `components/series/series-grid-content.tsx` - Client grid with TV Genre/Sort/Year filters, read-only cards, infinite scroll for TV shows
- `app/(app)/discover/page.tsx` - Simplified server page — renders DiscoverGridContent only (fully client-driven)
- `app/(app)/series/page.tsx` - Simplified server page — renders SeriesGridContent only (fully client-driven)
- `hooks/use-movies.ts` - Added useDiscoverMovies hook (infinite query, genre/sort/year/decade params)
- `hooks/use-tv.ts` - Added useDiscoverTV hook (infinite query, genre/sort/year/decade params, normalizeTVShow at boundary)
- `app/api/tv/route.ts` - Added `action=discover` handler calling discoverTV with genre/sort/year params
- `components/movies/movie-grid.tsx` - Added readOnly prop to MovieGridProps and propagated to MovieCard

## Decisions Made
- `keepPreviousData` on all discover queries — shows stale content with loading overlay rather than empty state during filter changes
- Decade year values handled at hook layer (not API layer) — `2020s` → `year_start=2020&year_end=2029`
- Series page is fully client-driven with no SSR prefetch — filter-first UX means pre-fetching unfiltered results adds no value
- `SeriesGridContent` uses combined genre list (TV_GENRES + shared IDs) for maximum discoverability without duplicates
- `MovieGrid.readOnly` prop added and passed through to `MovieCard` — needed so TV cards suppress watchlist action buttons

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] MovieGrid missing readOnly prop caused TypeScript build error**
- **Found during:** Task 2 (series grid content wiring)
- **Issue:** `series-grid-content.tsx` passes `readOnly` to `<MovieGrid>` but `MovieGridProps` had no `readOnly` field — TypeScript error prevented build from compiling
- **Fix:** Added `readOnly?: boolean` to `MovieGridProps` interface and passed it through to `<MovieCard readOnly={readOnly} />` in the grid
- **Files modified:** `components/movies/movie-grid.tsx`
- **Verification:** `npm run build` passes cleanly after fix
- **Committed in:** `25731d4` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — missing prop caused TypeScript build failure)
**Impact on plan:** Required fix — build could not pass without it. No scope creep.

## Issues Encountered
None beyond the readOnly prop TypeScript error (auto-fixed above).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Discover and Series pages ready for Plan 04 (movie/TV detail page navigation — link-based routing replacing modal)
- `MovieGrid` now has `readOnly` prop, enabling future read-only grid contexts without forking the component
- Filter dropdowns establish the visual pattern for any future filtered grid pages

---
*Phase: 07-ui-ux-revamp*
*Completed: 2026-02-24*

## Self-Check: PASSED

- FOUND: components/movies/discover-grid-content.tsx
- FOUND: components/series/series-grid-content.tsx
- FOUND: app/(app)/series/page.tsx
- FOUND: .planning/phases/07-ui-ux-revamp/07-03-SUMMARY.md
- FOUND commit: 5466b1e (Task 1)
- FOUND commit: 25731d4 (Task 2)

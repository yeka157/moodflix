---
phase: 05-tv-series-page-modal
plan: 01
subsystem: ui
tags: [nextjs, react, tmdb, framer-motion, tv, series, tailwind]

# Dependency graph
requires:
  - phase: 04-tv-series-data-layer
    provides: getTrendingTV, getTopRatedTV, discoverKoreanDramas, discoverChineseDramas, normalizeTVShow, TV_GENRES
provides:
  - /series route with hero banner + 4 curated TV content rows
  - readOnly prop on MovieCard, MovieDetailModal, and MovieRow (gates watchlist buttons)
  - SeriesHeroBanner component (clickable, keyboard-accessible)
  - SeriesContent client component (manages selectedShow state)
  - Series navbar link (Home > Discover > Series > Library)
  - /series/loading.tsx route-level skeleton
affects: [05-02-tv-detail-modal]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - readOnly prop pattern for gating watchlist controls on read-only content sections
    - TV normalization at page boundary (SSR page calls normalizeTVShow before passing to client)
    - SeriesHeroBanner composes existing HeroBanner pattern with onClick instead of Link

key-files:
  created:
    - app/(app)/series/page.tsx
    - app/(app)/series/loading.tsx
    - components/series/series-content.tsx
    - components/series/series-hero-banner.tsx
  modified:
    - components/movies/movie-card.tsx
    - components/movies/movie-detail-modal.tsx
    - components/movies/movie-row.tsx
    - components/layout/app-navbar.tsx

key-decisions:
  - "readOnly prop gates entire action icon div in MovieCard — hook calls kept (React rules), only rendering suppressed"
  - "readOnly prop gates entire Library Actions section in MovieDetailModal — hook calls kept (React rules)"
  - "movieType prop added to MovieDetailModal interface with eslint-disable for unused-vars — TV branching deferred to Plan 02"
  - "SeriesHeroBanner uses TV_GENRES first, falls back to GENRES for shared IDs (e.g. Drama=18)"
  - "featuredShow selected deterministically via trending.find(t => t.backdrop_path) — no Math.random()"
  - "MovieRow extended with readOnly prop to pass through to MovieCard — cleanly fulfills TV-01 no-watchlist-buttons requirement"

patterns-established:
  - "readOnly pattern: wrap action UI in {!readOnly && (...)} — hooks stay, rendering gated"
  - "TV page pattern: SSR page fetches + normalizes, passes Movie[] to client component"

requirements-completed: [TV-01]

# Metrics
duration: 3min
completed: 2026-02-22
---

# Phase 05 Plan 01: TV Series Page and Navbar Summary

**Clickable /series hero + 4 curated TV rows (Trending, K-Drama, C-Drama, Top Rated) via readOnly MovieRow/MovieCard composition, with navbar Series link and route loading skeleton**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-22T16:55:57Z
- **Completed:** 2026-02-22T16:59:09Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Added `readOnly` prop to MovieCard, MovieDetailModal, and MovieRow — watchlist action buttons completely hidden when readOnly=true, with zero impact on existing movie pages
- Created the complete /series page: SSR fetches 4 TV categories in parallel, normalizes with normalizeTVShow, renders hero + 4 rows
- Navbar updated with Series link (Tv icon) between Discover and Library
- SeriesHeroBanner is fully keyboard-accessible (Tab + Enter opens modal), uses TV_GENRES + GENRES fallback for genre badges

## Task Commits

Each task was committed atomically:

1. **Task 1: Add readOnly prop to MovieCard, MovieDetailModal, MovieRow** - `f6eabf3` (feat)
2. **Task 2: Create /series page, hero banner, content component, loading skeleton, navbar link** - `bf50220` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `app/(app)/series/page.tsx` - SSR Server Component: parallel fetch of 4 TV categories, normalization, renders SeriesContent
- `app/(app)/series/loading.tsx` - Route-level loading skeleton: hero + 4 row skeletons
- `components/series/series-hero-banner.tsx` - Clickable hero banner for TV shows with keyboard a11y, Framer Motion stagger, TV_GENRES genre badges, More Info CTA
- `components/series/series-content.tsx` - Client component: selectedShow state, SeriesHeroBanner, 4 readOnly MovieRows, MovieDetailModal with mediaType=tv readOnly
- `components/movies/movie-card.tsx` - Added readOnly?: boolean prop; action icons div gated behind !readOnly
- `components/movies/movie-detail-modal.tsx` - Added readOnly?: boolean and mediaType?: "movie" | "tv" props; Library Actions section gated behind !readOnly
- `components/movies/movie-row.tsx` - Added readOnly?: boolean prop; passed to MovieCard
- `components/layout/app-navbar.tsx` - Added Series nav link with Tv icon between Discover and Library

## Decisions Made
- `readOnly` keeps hook calls in place (React rules) but gates all action button rendering — no conditional hook calls
- `mediaType` prop added to MovieDetailModal now with eslint-disable comment; TV-specific branching (useTVDetails hook, TV fields) deferred to Plan 02
- `SeriesHeroBanner` uses `TV_GENRES[id] ?? GENRES[id]` — handles both TV-exclusive IDs (10759+) and shared IDs (18 Drama)
- `featuredShow` = `trending.find(t => t.backdrop_path) ?? trending[0]` — deterministic, no Math.random
- MovieRow extended with readOnly to cleanly propagate read-only behavior down to cards

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added eslint-disable for mediaType prop**
- **Found during:** Task 2 (lint check)
- **Issue:** `mediaType` prop added to interface for Plan 02 use, but not yet consumed — lint flagged as unused-vars warning
- **Fix:** Added `// eslint-disable-next-line @typescript-eslint/no-unused-vars` above the function signature
- **Files modified:** components/movies/movie-detail-modal.tsx
- **Verification:** `npm run lint` passes with zero warnings
- **Committed in:** bf50220 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (lint suppression for intentionally deferred prop)
**Impact on plan:** Minimal — suppression is appropriate since mediaType will be consumed in Plan 02 Task 1.

## Issues Encountered
None — plan executed cleanly. `_mediaType` prefix didn't suppress the ESLint rule; inline eslint-disable comment used instead.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- /series page is live and accessible from navbar
- readOnly pattern established for TV content — no watchlist buttons appear on TV cards or modals
- Plan 02 will add TV-specific modal fields (seasons/episodes, created_by, networks) using the mediaType prop infrastructure added here

---
*Phase: 05-tv-series-page-modal*
*Completed: 2026-02-22*

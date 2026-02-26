---
phase: 07-ui-ux-revamp
plan: 02
subsystem: ui
tags: [nextjs, tmdb, framer-motion, shadcn, watchlist, ssr]

# Dependency graph
requires:
  - phase: 07-01
    provides: sidebar navigation layout and bottom tab bar (60px offset)
  - phase: 05-tv-series-page-modal
    provides: TVDetailsWithExtras type, TVDetailsResponse type
  - phase: 04-tv-series-data-layer
    provides: getTVDetails in lib/tmdb.ts
provides:
  - /movie/[id] SSR detail page with Stremio-inspired full-page layout
  - /tv/[id] SSR detail page with TV-specific metadata
  - MovieDetailPageContent client component with fixed bottom action bar
  - TVDetailPageContent client component with seasons/episodes/status/creators
  - Loading skeletons for both detail pages
  - generateMetadata for both routes (SEO)
affects: [07-03, 07-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - SSR detail pages using await params with getMovieDetails/getTVDetails
    - Promise.all parallelization for movie details + recommendations fetch
    - Fixed bottom action bar offset (bottom-16 md:bottom-0, left-0 md:left-[60px])
    - Framer Motion entrance animations with backdropVariants + contentVariants
    - useReducedMotion for a11y animation control
    - Pill-style metadata row: year, runtime, rating, country, status
    - Genre tags using Badge variant="outline", metadata using Badge variant="secondary"
    - Cast chips as Badge pills (name only, no photos — Stremio style)

key-files:
  created:
    - app/(app)/movie/[id]/page.tsx
    - app/(app)/movie/[id]/loading.tsx
    - app/(app)/tv/[id]/page.tsx
    - app/(app)/tv/[id]/loading.tsx
    - components/movies/movie-detail-page.tsx
    - components/movies/tv-detail-page.tsx
  modified: []

key-decisions:
  - "Movie detail page passes country prop explicitly from SSR (not re-detected client-side)"
  - "Bottom action bar uses bottom-16 md:bottom-0 left-0 md:left-[60px] to clear sidebar + tab bar"
  - "More Like This row uses MovieRow with readOnly=true — no watchlist interaction from recommendations"
  - "TV page has no watchlist action bar — read-only in v0.3, shows 'TV show tracking coming soon'"
  - "Trailer links to YouTube search (no TMDB video endpoint in current lib/tmdb.ts)"
  - "Cast chips use name-only Badge pills — no circular photos (Stremio reference pattern)"
  - "TV genre resolution: TV_GENRES first, fallback to GENRES for shared IDs"

patterns-established:
  - "Detail page pattern: SSR page.tsx fetches data + extracts watchProviders, passes to client layout component"
  - "Full-bleed backdrop: h-[50vh] min-h-[300px] with gradient overlay and title overlay at bottom-left"

requirements-completed: [REVAMP-01]

# Metrics
duration: 3min
completed: 2026-02-23
---

# Phase 7 Plan 02: Movie and TV Detail Pages Summary

**SSR /movie/[id] and /tv/[id] detail pages with Stremio-inspired full-bleed backdrop, pill metadata, cast chips, watch providers, and fixed action bar with watchlist controls**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-23T15:03:27Z
- **Completed:** 2026-02-23T15:06:30Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Movie detail page at `/movie/[id]` with SSR, SEO metadata, full-bleed backdrop, Stremio pill layout, "More Like This" recommendations row, and fixed bottom action bar with full watchlist controls (add/watched/like/dislike)
- TV detail page at `/tv/[id]` with TV-specific fields: seasons count, episodes count, status badge, "Created by:" label — read-only in v0.3
- Loading skeletons for both routes using Skeleton component matching the respective page layouts

## Task Commits

Each task was committed atomically:

1. **Task 1: Movie detail page route and client layout** - `642bf31` (feat)
2. **Task 2: TV detail page route and client layout** - `f95bfd3` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `app/(app)/movie/[id]/page.tsx` - SSR movie detail page with generateMetadata, parallel fetch, WatchProviderResult extraction
- `app/(app)/movie/[id]/loading.tsx` - Skeleton matching movie detail layout with bottom action bar skeleton
- `components/movies/movie-detail-page.tsx` - MovieDetailPageContent: backdrop, metadata pills, genres, overview, director, cast chips, watch providers, MovieRow "More Like This", fixed action bar
- `app/(app)/tv/[id]/page.tsx` - SSR TV detail page with generateMetadata and country detection
- `app/(app)/tv/[id]/loading.tsx` - Skeleton matching TV detail layout (no action bar skeleton)
- `components/movies/tv-detail-page.tsx` - TVDetailPageContent: backdrop, TV metadata (seasons/episodes/status), genre resolution, cast chips, watch providers, no watchlist controls

## Decisions Made

- Movie detail passes `country` prop from SSR — no client-side re-detection
- Bottom action bar offset: `bottom-16 md:bottom-0` (clears BottomTabBar) + `left-0 md:left-[60px]` (clears AppSidebar)
- "More Like This" MovieRow uses `readOnly=true` — recommendation cards don't expose watchlist buttons
- TV page omits action bar entirely (v0.3 read-only constraint), shows "TV show tracking coming soon" text
- Trailer button links to YouTube search query — TMDB video endpoint not yet added to lib/tmdb.ts
- Cast chips are name-only Badge pills, no circular profile photos — matches Stremio reference design
- TV genre resolution: `TV_GENRES[id] ?? GENRES[id] ?? g.name` — handles both TV-only and shared genre IDs

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `/movie/[id]` and `/tv/[id]` routes are live and SSR-rendered
- Plan 03 can wire movie card clicks to navigate to `/movie/{id}` instead of opening the modal
- Plan 04 can replace app-navbar.tsx and finalize navigation
- The `app-navbar.tsx` preserved from Plan 01 is still referenced nowhere in the current app layout (AppSidebar + BottomTabBar used instead) — safe to remove in Plan 04

---
*Phase: 07-ui-ux-revamp*
*Completed: 2026-02-23*

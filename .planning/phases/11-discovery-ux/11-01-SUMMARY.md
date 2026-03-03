---
phase: 11-discovery-ux
plan: 01
subsystem: ui
tags: [navigation, sidebar, rating, tmdb, detail-page]

# Dependency graph
requires: []
provides:
  - Movies label on /discover nav item (sidebar + bottom tab bar)
  - X.X/10 rating format on movie and TV detail pages with vote_count > 10 guard
affects: [navigation, movie-detail-page, tv-detail-page]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - components/layout/app-sidebar.tsx
    - components/layout/bottom-tab-bar.tsx
    - components/movies/movie-detail-page.tsx
    - components/movies/tv-detail-page.tsx

key-decisions:
  - "Nav label-only change: /discover route path, Compass icon, and aria-label attributes all unchanged"
  - "Rating badge hidden when vote_count <= 10 (insufficient votes guard) — no star symbol remains"
  - "vote_count guard uses nullish coalescing: (details.vote_count ?? 0) > 10 for safe optional field handling"

patterns-established: []

requirements-completed: [DISC-02, DISC-03]

# Metrics
duration: 3min
completed: 2026-03-03
---

# Phase 11 Plan 01: Discovery UX Summary

**Sidebar and bottom tab bar relabeled from "Discover" to "Movies"; detail page ratings replaced from star format to "X.X/10" with a vote_count > 10 guard**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-03T09:13:42Z
- **Completed:** 2026-03-03T09:16:25Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Desktop sidebar /discover nav item now reads "Movies" (route, icon, aria unchanged)
- Mobile bottom tab bar /discover nav item now reads "Movies"
- Movie detail page rating badge shows "7.8/10" format, hidden when vote_count <= 10
- TV detail page rating badge shows "8.2/10" format, hidden when vote_count <= 10
- No star (★) symbol remains in either detail page component
- Build and lint pass clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Rename Discover nav label to Movies** - `a4810c7` (feat)
2. **Task 2: Replace star rating with X.X/10 format on detail pages** - `54fdb37` (feat)

## Files Created/Modified
- `components/layout/app-sidebar.tsx` - navLinks[1].label changed from "Discover" to "Movies"
- `components/layout/bottom-tab-bar.tsx` - navLinks[1].label changed from "Discover" to "Movies"
- `components/movies/movie-detail-page.tsx` - Rating badge: `{rating} ★` → conditional `{rating}/10` with vote_count > 10 guard
- `components/movies/tv-detail-page.tsx` - Rating badge: `{rating} ★` → conditional `{rating}/10` with vote_count > 10 guard

## Decisions Made
- Nav label-only change: /discover route path, Compass icon, and aria-label attributes all unchanged per plan spec
- Rating format is text-only numeric ("X.X/10") — no star icon alongside the number, per user decision
- vote_count guard: `(details.vote_count ?? 0) > 10` — nullish coalescing handles optional field safely

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Navigation relabeling complete; sidebar and bottom tab bar both display "Movies" for /discover
- Detail pages show universally understood numeric rating format; entries with insufficient data show no rating badge
- Ready for remaining Phase 11 plans

---
*Phase: 11-discovery-ux*
*Completed: 2026-03-03*

## Self-Check: PASSED

- FOUND: components/layout/app-sidebar.tsx
- FOUND: components/layout/bottom-tab-bar.tsx
- FOUND: components/movies/movie-detail-page.tsx
- FOUND: components/movies/tv-detail-page.tsx
- FOUND: .planning/phases/11-discovery-ux/11-01-SUMMARY.md
- FOUND commit a4810c7 (Task 1: rename nav label)
- FOUND commit 54fdb37 (Task 2: rating format)

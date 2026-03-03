---
phase: 10-tv-watchlisting-watchlist-ux
plan: "03"
subsystem: ui
tags: [watchlist, react, framer-motion, tanstack-query, shadcn-ui, media-type]

# Dependency graph
requires:
  - phase: 10-01
    provides: mediaType field on WatchlistItem, WatchlistMediaFilter type, media-type-aware hooks

provides:
  - WatchlistCard with correct media-type routing (/tv/[id] vs /movie/[id])
  - WatchlistCard type badge pill overlay (TV / Movie) on every poster
  - WatchlistContent with ToggleGroup media type filter row (All / Movies / TV Shows with counts)
  - Client-side dual filtering by mediaFilter + activeTab via useMemo
  - Stable card behavior on status change (WLUX-02) — cards only disappear on explicit remove
  - Contextual empty states per filter combination with CTA links
  - Updated WatchlistSkeleton with two-row filter placeholder

affects: [watchlist-page, library-ux, tv-detail-routing, series-page]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Client-side dual filtering via useMemo: fetch all items, filter in-memory by mediaType + status"
    - "Derive href from item.mediaType: /tv/[id] for TV, /movie/[id] for movies"
    - "Always pass mediaType in remove/undo mutations to preserve correct media-type cache keys"

key-files:
  created: []
  modified:
    - components/watchlist/watchlist-card.tsx
    - components/watchlist/watchlist-content.tsx
    - components/watchlist/watchlist-skeleton.tsx

key-decisions:
  - "Client-side filtering (no status arg to useWatchlist) ensures cards stay stable during status changes — WLUX-02"
  - "ToggleGroup filter row above status tabs in two-row layout — media type first, then status"
  - "Both TV and Movie cards show type badge with unified dark style (bg-black/70) — no color distinction for library context"
  - "Undo toast re-add includes mediaType from item to correctly restore TV entries"
  - "motion key combines activeTab + mediaFilter for correct stagger animation reset on filter change"

patterns-established:
  - "Two-row filter UI pattern: media type pills (ToggleGroup) above status tabs — use for any multi-dimension filter scenario"
  - "All-items-then-filter: fetch full dataset, filter client-side — avoids card flicker on mutation"

requirements-completed: [TVWL-05, TVWL-06, WLUX-02, WLUX-03]

# Metrics
duration: 15min
completed: 2026-03-03
---

# Phase 10 Plan 03: Watchlist UX Enhancements Summary

**Library page media type badges, /tv/[id] routing, ToggleGroup filter row, and client-side stable-card filtering via useMemo**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-03
- **Completed:** 2026-03-03
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- WatchlistCard now derives href from `item.mediaType`, linking TV items to `/tv/[id]` and movies to `/movie/[id]`
- Type badge pill ("TV" / "Movie") overlaid on every poster, top-left, with dark semi-transparent style readable on any backdrop
- WatchlistContent fetches all items without status filter; useMemo handles dual filtering client-side
- Media type ToggleGroup row shows live item counts (All / Movies / TV Shows) and renders above status tabs
- Status changes no longer remove cards from view — only explicit "Remove from Library" triggers fade-out animation (WLUX-02)
- Contextual empty states for each filter combination (TV-only, movie-only, status-only, or fully empty library)
- WatchlistSkeleton updated to show two-row filter placeholder matching the new layout

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix WatchlistCard link routing and add type badge** - `5118ab1` (feat)
2. **Task 2: Add media type filter and switch to client-side filtering in WatchlistContent** - `e216dee` (feat)

## Files Created/Modified
- `components/watchlist/watchlist-card.tsx` - Correct media-type href derivation, type badge overlay, mediaType in remove/undo mutations
- `components/watchlist/watchlist-content.tsx` - Client-side dual filtering, WatchlistMediaFilter ToggleGroup row, contextual empty states
- `components/watchlist/watchlist-skeleton.tsx` - Two-row filter skeleton (media type pills + status tab placeholder)

## Decisions Made
- Client-side filtering (no status arg to `useWatchlist`) ensures cards stay stable during status changes — this is the correct approach for WLUX-02 because optimistic updates mutate items in-place within the allItems array, so filtered views stay consistent
- Both TV and Movie cards use the same unified dark badge style (`bg-black/70 text-white/90`) — no color distinction since both types appear together in the library
- The undo toast re-add mutation now includes `mediaType: item.mediaType` to correctly restore TV entries under their media-type cache key
- `motion` container `key` combines `activeTab` and `mediaFilter` to properly reset stagger animation when either filter changes

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness
- Library page fully handles TV and movie items with correct routing, type badges, and stable filtering
- Phase 10 complete — all three plans done (media-type-aware watchlist layer, TV detail page, watchlist UX enhancements)
- Ready to continue to Phase 11 or next milestone planning

## Self-Check: PASSED

- FOUND: components/watchlist/watchlist-card.tsx
- FOUND: components/watchlist/watchlist-content.tsx
- FOUND: components/watchlist/watchlist-skeleton.tsx
- FOUND: .planning/phases/10-tv-watchlisting-watchlist-ux/10-03-SUMMARY.md
- FOUND commit: 5118ab1 (Task 1 - WatchlistCard routing + badge)
- FOUND commit: e216dee (Task 2 - client-side filtering + media type filter row)

---
*Phase: 10-tv-watchlisting-watchlist-ux*
*Completed: 2026-03-03*

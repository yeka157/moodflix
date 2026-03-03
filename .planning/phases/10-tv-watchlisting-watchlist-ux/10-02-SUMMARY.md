---
phase: 10-tv-watchlisting-watchlist-ux
plan: "02"
subsystem: watchlist
tags: [tv-detail-page, action-bar, media-type, watchlist-crud]
dependency_graph:
  requires: [10-01]
  provides: [TV detail page watchlist action bar, explicit mediaType on movie detail page and modal]
  affects: [components/movies/tv-detail-page.tsx, components/movies/movie-detail-page.tsx, components/movies/movie-detail-modal.tsx]
tech_stack:
  added: []
  patterns: [media-type-aware watchlist hooks, fixed bottom action bar]
key_files:
  created: []
  modified:
    - components/movies/tv-detail-page.tsx
    - components/movies/movie-detail-page.tsx
    - components/movies/movie-detail-modal.tsx
---

## Summary

Wired the full watchlist action bar into `TVDetailPageContent` and updated `MovieDetailPageContent` and `MovieDetailModal` to pass explicit `mediaType` to all watchlist hooks and mutations.

## Changes

### Task 1: Wire full watchlist action bar into TVDetailPageContent
**File:** `components/movies/tv-detail-page.tsx`

- Replaced "TV show tracking coming soon" placeholder with a fixed bottom action bar identical to `MovieDetailPageContent`
- Added `useWatchlistCheck(details.id, "tv")` and all mutation hooks
- All `addMutation.mutate()` calls include `mediaType: "tv"` — including the undo toast re-add
- Handlers: `handleAddToLibrary`, `handleMarkWatched`, `handleRemove`, `handleMoveToWantToWatch`
- Action bar positioned `fixed bottom-16 md:bottom-0` to clear mobile tab bar and sidebar
- Like/dislike buttons only visible when item is in library
- TV-specific metadata (seasons, episodes) displayed alongside existing content

### Task 2: Update MovieDetailPageContent and MovieDetailModal to pass explicit mediaType
**Files:** `components/movies/movie-detail-page.tsx`, `components/movies/movie-detail-modal.tsx`

- `MovieDetailPageContent`: `useWatchlistCheck(details.id, "movie")`, `mediaType: "movie"` on all add/remove/undo calls
- `MovieDetailModal`: `useWatchlistCheck(movie?.id ?? 0, mediaType)`, forwards `mediaType` prop to all add/remove/undo mutation calls
- Ensures media-type-aware cache keys resolve correctly for both movies and TV in all contexts

## Decisions

- [Phase 10-02]: TV detail action bar replicates movie detail bar exactly — same icon set, same positioning, same interaction patterns
- [Phase 10-02]: `details.name` used for TV title (TMDB uses `name` not `title` for TV shows)
- [Phase 10-02]: Modal forwards its `mediaType` prop (default "movie") to all watchlist calls — enables future mixed-content modals

## Self-Check

- [x] Self-Check: PASSED — Build passes, lint clean, all mutations include explicit mediaType, TV action bar renders with full CRUD

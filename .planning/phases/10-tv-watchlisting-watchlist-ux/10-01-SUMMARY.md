---
phase: 10-tv-watchlisting-watchlist-ux
plan: "01"
subsystem: watchlist
tags: [media-type, cache, optimistic-updates, hooks, components]
dependency_graph:
  requires: []
  provides: [media-type-aware watchlist layer, mediaType prop on movie cards]
  affects: [hooks/use-watchlist.ts, actions/watchlist.ts, types/watchlist.ts, components/movies/movie-card.tsx, components/movies/movie-row.tsx, components/movies/movie-grid.tsx]
tech_stack:
  added: []
  patterns: [media-type-keyed TanStack Query cache, optimistic updates with mediaType context]
key_files:
  created: []
  modified:
    - hooks/use-watchlist.ts
    - actions/watchlist.ts
    - types/watchlist.ts
    - components/movies/movie-card.tsx
    - components/movies/movie-row.tsx
    - components/movies/movie-grid.tsx
    - components/series/series-grid-content.tsx
decisions:
  - "watchlistKeys.check includes mediaType as 4th key segment — independent cache entries per media type"
  - "useRemoveFromWatchlist filters tmdbIds cache by both tmdbId AND mediaType to avoid removing sibling-type entries"
  - "WatchlistMediaFilter type added to types/watchlist.ts for use in Plan 03 library filters"
  - "entryMediaType stored in onMutate context for rollback fidelity — avoids re-deriving media type on error"
metrics:
  duration: "3 minutes"
  completed_date: "2026-03-03"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 7
---

# Phase 10 Plan 01: Media-Type-Aware Watchlist Layer Summary

Media-type disambiguation throughout watchlist hooks, actions, and movie card components — TV shows and movies with the same TMDB ID now resolve to independent cache entries and independent bookmark state.

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Add mediaType to watchlist check action, hook, and query keys | d78d531 | actions/watchlist.ts, hooks/use-watchlist.ts, types/watchlist.ts |
| 2 | Add mediaType prop to MovieCard, MovieRow, MovieGrid | f4a6c3d | components/movies/movie-card.tsx, movie-row.tsx, movie-grid.tsx, series-grid-content.tsx |

## What Was Built

### actions/watchlist.ts
`getWatchlistItemByTmdbId` now accepts `mediaType: MediaType = "movie"` as a second parameter and includes `eq(watchlist.mediaType, mediaType)` in the WHERE clause via `and()`. This ensures that checking if a TV show ID is in the watchlist will not return a matching movie entry with the same numeric ID.

### hooks/use-watchlist.ts
- `watchlistKeys.check` signature updated from `(tmdbId: number)` to `(tmdbId: number, mediaType: MediaType = "movie")` — cache key array is now `["watchlist", "check", tmdbId, mediaType]`
- `useWatchlistCheck` accepts `mediaType` parameter and passes it to both the query key and query function
- `useAddToWatchlist.onMutate` stores `itemMediaType` in context and uses it for the check cache write and rollback
- `useRemoveFromWatchlist` params type extended with `mediaType?: MediaType`; tmdbIds cache filter now checks both `tmdbId` AND `mediaType` to avoid removing a sibling-type entry
- `useUpdateWatchlistStatus` and `useRateWatchlistItem` look up `entryMediaType` from the tmdbIds cache entry and use it for check cache reads/writes and rollbacks

### types/watchlist.ts
`WatchlistMediaFilter = "all" | "movie" | "tv"` exported — needed by Plan 03 library filter tabs.

### components/movies/movie-card.tsx
- `mediaType?: MediaType` prop added (default `"movie"`)
- `tmdbEntries.find` now filters by `e.tmdbId === movie.id && e.mediaType === mediaType`
- All `addMutation.mutate` calls include `mediaType` in the payload
- All `removeMutation.mutate` calls include `mediaType` in the params

### components/movies/movie-row.tsx
- `mediaType` prop type narrowed from `"movie" | "tv"` to `MediaType` (imported from `@/types/media`)
- `mediaType` forwarded to each `MovieCard`

### components/movies/movie-grid.tsx
- `mediaType?: MediaType` prop added (default `"movie"`)
- `mediaType` forwarded to each `MovieCard`

### components/series/series-grid-content.tsx
- `mediaType="tv"` added to `MovieGrid` — was previously missing, meaning TV cards in the grid would look up movie entries

## Decisions Made

1. **watchlistKeys.check 4-segment key**: Including mediaType as the 4th segment (not a nested object) keeps the key serializable and consistent with TanStack Query's array-based matching
2. **useRemoveFromWatchlist dual filter**: Old code filtered tmdbIds cache by `entry.tmdbId !== params.tmdbId` — this would remove both a movie and a TV show with the same ID. New code requires both tmdbId AND mediaType to match
3. **entryMediaType in context**: Storing entryMediaType in the onMutate return context ensures rollback uses the exact same key that was written — avoids stale-key bugs if the component unmounts between mutate and error
4. **No changes to series-content.tsx**: Already passed `mediaType="tv"` to all `MovieRow` instances — verified correct

## Deviations from Plan

None — plan executed exactly as written. The `series-grid-content.tsx` update was explicitly called out in the plan as a required caller update.

## Verification

- `npm run build`: passes (zero TypeScript errors)
- `npm run lint`: passes (zero warnings)
- `watchlistKeys.check` includes mediaType in key array — confirmed at line 26 of hooks/use-watchlist.ts
- `MovieCard` tmdbEntries lookup filters by `e.mediaType === mediaType` — confirmed at line 55 of movie-card.tsx
- Series page `MovieRow` components pass `mediaType="tv"` — confirmed in series-content.tsx (pre-existing) and series-grid-content.tsx (updated)

## Self-Check

### Files Exist
- hooks/use-watchlist.ts: FOUND
- actions/watchlist.ts: FOUND
- types/watchlist.ts: FOUND
- components/movies/movie-card.tsx: FOUND
- components/movies/movie-row.tsx: FOUND
- components/movies/movie-grid.tsx: FOUND
- components/series/series-grid-content.tsx: FOUND

### Commits Exist
- d78d531: FOUND (feat(10-01): make watchlist hook and action layer media-type-aware)
- f4a6c3d: FOUND (feat(10-01): add mediaType prop to MovieCard, MovieRow, MovieGrid for TMDB ID disambiguation)

## Self-Check: PASSED

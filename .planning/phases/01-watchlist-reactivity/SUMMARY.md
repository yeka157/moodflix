# Phase 1: Watchlist Reactivity — Execution Summary

## Plans Executed

### Plan 01-01: Data Layer — Schema, TmdbIds, Optimistic Updates
- Migrated schema: removed `watching` enum value, kept `want_to_watch` + `watched`
- Changed `getWatchlistTmdbIds` to return `WatchlistTmdbEntry[]` with `{ id, tmdbId, status }`
- Added `onMutate` optimistic updates to all mutation hooks: `useAddToWatchlist`, `useRemoveFromWatchlist`, `useUpdateWatchlistStatus`, `useRateWatchlistItem`
- Added `staleTime: 30_000`, `gcTime: 300_000`, `refetchOnWindowFocus: false` to all watchlist queries
- **Commit:** `cbdce73`

### Plan 01-02: Route Rename + Dual Icon System
- Moved `app/(app)/watchlist/` → `app/(app)/library/`
- Added `/watchlist` → `/library` redirect in middleware for backwards compatibility
- Updated 13+ files with user-facing text: "watchlist" → "library"
- Rewrote `movie-card.tsx` with dual icon system: Bookmark (want_to_watch) + CircleCheck (watched)
- Rewrote `movie-detail-modal.tsx`: replaced dropdown with separate action buttons
- **Commits:** `155d5a2`, `16da471`

### Plan 01-03: Library Labels, Feedback, Animation Polish
- Updated `watchlist-content.tsx` heading "My Library" + empty state text
- Updated `watchlist-card.tsx`: "Remove from Library" label, silent status change (no toast), undo toast for remove with re-add action
- Added `useReducedMotion` to movie-card, movie-detail-modal, watchlist-card for a11y
- Added spring-in icon animations for bookmark/check state changes
- Added rating bounce animations (like/dislike) across all locations
- **Commit:** `0886e15`

## Success Criteria Verification

| Criteria | Status |
|----------|--------|
| WATCH-R01: Add movie → icon fills instantly, appears in library without refresh | Done (optimistic updates) |
| WATCH-R02: One-tap "Mark as Watched" on cards and modal | Done (check icon + modal button) |
| WATCH-R03: Distinct icons per status (crimson bookmark, green check) | Done |
| WATCH-R04: Like/dislike fills immediately without refresh | Done (optimistic updates) |
| Cross-propagation: changes reflect across modal ↔ library ↔ cards | Done (TanStack Query cache) |
| Route: `/library` replaces `/watchlist` with redirect | Done |
| Feedback: icon animation success, undo toast remove, error toast rollback | Done |
| `prefers-reduced-motion` respected | Done (useReducedMotion) |

## Notes

- User manually completed several optimistic update hooks and added staleTime/gcTime during Plan 01-01 execution
- Plan 01-01 executor hit rate limit mid-execution; remaining work was completed manually + by orchestrator
- `watching` status removal required Drizzle migration (`db:generate` + `db:migrate`)
- Old watchlist directory cleanup was included in Plan 01-03 commit

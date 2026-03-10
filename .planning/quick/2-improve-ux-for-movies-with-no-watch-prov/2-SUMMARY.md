---
phase: quick-2
plan: 01
subsystem: movies/tv-detail-views
tags: [ux, watch-providers, availability, tmdb]
dependency_graph:
  requires: []
  provides: [contextual-availability-messaging]
  affects: [movie-detail-page, movie-detail-modal, tv-detail-page]
tech_stack:
  added: []
  patterns: [pure-utility-function, discriminated-union-status]
key_files:
  created:
    - lib/availability.ts
  modified:
    - types/movie.ts
    - lib/tmdb.ts
    - components/movies/movie-detail-page.tsx
    - components/movies/movie-detail-modal.tsx
    - components/movies/tv-detail-page.tsx
decisions:
  - "availability.type === available check in else branch: getMovieAvailabilityStatus always checks providers first so this branch is never reached, but guarded against for type safety"
  - "120-day theatrical window constant: standard studio windowing period before digital release"
  - "TV Returning Series within 1 year gets not_yet_streaming: recently-airing shows may not have streaming deals yet"
  - "release_dates optional on MovieDetailsWithExtras: backward-compatible with any cached entries lacking the field"
metrics:
  duration: ~10 minutes
  completed: 2026-03-10
  tasks_completed: 2
  files_changed: 5
---

# Quick Task 2: Improve UX for Movies With No Watch Providers Summary

**One-liner:** Replaced single generic "not available" message with three contextual status messages (in theaters / not yet streaming / not in region) using TMDB release_dates data and TV show status.

## What Was Built

A `lib/availability.ts` utility module with two pure functions:

- `getMovieAvailabilityStatus` — takes watch providers, TMDB release dates, country code, and the movie's `release_date` fallback. Returns a discriminated union: `available`, `in_theaters`, `not_yet_streaming`, or `not_in_region`.
- `getTVAvailabilityStatus` — takes watch providers, TMDB status string, and `first_air_date`. Returns the same discriminated union (TV never returns `in_theaters`).

Three detail views updated:

| View | Messages shown | Icons |
|------|----------------|-------|
| `movie-detail-page.tsx` | in_theaters / not_yet_streaming / not_in_region | Film / Clock / Globe |
| `tv-detail-page.tsx` | not_yet_streaming / not_in_region | Clock / Globe |
| `movie-detail-modal.tsx` | in_theaters / not_yet_streaming / not_in_region (both movie + TV) | Film / Clock / Globe |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

### Files created/modified exist:
- lib/availability.ts: FOUND
- types/movie.ts: FOUND
- lib/tmdb.ts: FOUND
- components/movies/movie-detail-page.tsx: FOUND
- components/movies/movie-detail-modal.tsx: FOUND
- components/movies/tv-detail-page.tsx: FOUND

### Commits:
- 00ef631: feat(quick-2): add release_dates types and availability utility
- fe5d24f: feat(quick-2): show contextual availability messages in all 3 detail views

## Self-Check: PASSED

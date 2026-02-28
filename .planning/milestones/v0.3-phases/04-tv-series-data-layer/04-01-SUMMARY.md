---
phase: 04-tv-series-data-layer
plan: 01
subsystem: api
tags: [tmdb, typescript, tv-series, types, normalization]

requires:
  - phase: 03-library-ui-polish
    provides: Stable Movie type contract in types/movie.ts that TV types extend

provides:
  - TVShow, TVListResponse, TVCreatedBy, TVNetwork, TVDetails, TVDetailsWithExtras, TVDetailsResponse types in types/tv.ts
  - normalizeTVShow() function that maps TVShow fields to the Movie contract
  - TV_GENRES constant with 8 TV-exclusive genre IDs in lib/constants.ts
  - getTrendingTV, getTopRatedTV, discoverKoreanDramas, discoverChineseDramas, getTVDetails functions in lib/tmdb.ts

affects:
  - 04-02 (API routes and TanStack Query hooks consuming these types and fetch functions)
  - 04-03 (UI components rendering TV data via hooks from 04-02)

tech-stack:
  added: []
  patterns:
    - "TV type normalization at hook boundary — normalizeTVShow() maps TVShow to Movie so existing movie UI components work without modification"
    - "TVDetails extends TVShow (intersection pattern) matching MovieDetailsWithExtras extending MovieDetails"
    - "TMDB fetch functions follow identical pattern: export async function, tmdbFetch<T>, default page=1"

key-files:
  created:
    - types/tv.ts
  modified:
    - lib/constants.ts
    - lib/tmdb.ts

key-decisions:
  - "normalizeTVShow maps first_air_date to release_date preserving empty string (no undefined) to satisfy Movie contract"
  - "video hardcoded to false in normalizeTVShow — TV shows have no video trailer flag in TMDB API"
  - "discoverChineseDramas omits with_original_language — Chinese content spans Mandarin (zh) and Cantonese (yue)"
  - "TV_GENRES placed after GENRES and before PROVIDER_URLS in lib/constants.ts to maintain logical grouping"

patterns-established:
  - "Normalization function pattern: normalizeTVShow(tv: TVShow): Movie — explicit return type enforced by TypeScript compiler"
  - "TVDetailsWithExtras intersection: TVDetails & { credits: MovieCredits; 'watch/providers': WatchProvidersResponse }"
  - "TV fetch functions mirror movie fetch functions exactly — same tmdbFetch<T> wrapper, same page default parameter"

requirements-completed:
  - TV-01

duration: 2min
completed: 2026-02-22
---

# Phase 4 Plan 01: TV Series Data Layer Summary

**TV series type system with normalizeTVShow() function, TV_GENRES constant (8 IDs), and 5 TMDB TV fetch functions that mirror existing movie API patterns**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-22T10:16:55Z
- **Completed:** 2026-02-22T10:18:56Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created complete TV type hierarchy (TVShow, TVListResponse, TVCreatedBy, TVNetwork, TVDetails, TVDetailsWithExtras, TVDetailsResponse) in `types/tv.ts`
- Implemented `normalizeTVShow()` function that maps TMDB TV fields to the Movie contract, enabling reuse of all existing movie UI components without modification
- Added `TV_GENRES` constant with all 8 TV-exclusive genre IDs (10759, 10762–10768) to `lib/constants.ts`
- Added 5 TV fetch functions to `lib/tmdb.ts`: `getTrendingTV`, `getTopRatedTV`, `discoverKoreanDramas`, `discoverChineseDramas`, `getTVDetails`

## Task Commits

Each task was committed atomically:

1. **Task 1: Create TV types and normalization function** - `576d93f` (feat)
2. **Task 2: Add TV_GENRES constant and TMDB TV fetch functions** - `ddaac2f` (feat)

**Plan metadata:** committed after summary creation (docs)

## Files Created/Modified

- `types/tv.ts` - 7 TV types + normalizeTVShow() function that returns Movie
- `lib/constants.ts` - Added TV_GENRES record with 8 TV-exclusive genre IDs
- `lib/tmdb.ts` - Added TV import + 5 TV fetch functions after existing movie functions

## Decisions Made

- `normalizeTVShow` maps `first_air_date` to `release_date` preserving empty strings to maintain the Movie contract's no-undefined requirement
- `video` hardcoded to `false` in normalizeTVShow because TMDB TV shows have no video trailer flag
- `discoverChineseDramas` omits `with_original_language` filter — Chinese content spans Mandarin (zh) and Cantonese (yue) variants, so country-only filtering is correct per research
- `TV_GENRES` placed between `GENRES` and `PROVIDER_URLS` in constants.ts to preserve logical grouping

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All type contracts and fetch functions are ready for Plan 02 to build `/api/tv/` route triplet and TanStack Query hooks
- `normalizeTVShow` enables Plan 02 hooks to return normalized `Movie[]` data, allowing Plan 03 UI to reuse existing movie card and modal components without modification
- TypeScript strict mode verified clean, ESLint clean, production build succeeds

---
*Phase: 04-tv-series-data-layer*
*Completed: 2026-02-22*

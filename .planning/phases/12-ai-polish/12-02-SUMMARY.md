---
phase: 12-ai-polish
plan: 02
subsystem: ai, api
tags: [tmdb, origin-country, genre-filtering, infinite-scroll, tanstack-query]

requires:
  - phase: 12-ai-polish-01
    provides: "origin_country field in GenreSuggestion type and AI tool output"
provides:
  - "Full-stack origin_country threading from AI genre chips to TMDB discover API"
  - "Country-prefixed genre labels (e.g., 'Korean Drama') in mood section and recommendations page"
  - "COUNTRY_LABELS map in lib/constants.ts for ISO alpha-2 to English adjective"
  - "Separate TanStack Query cache entries per country filter"
affects: []

tech-stack:
  added: []
  patterns:
    - "Optional originCountry param threaded through TMDB lib, API routes, hooks, and UI"
    - "Query key includes originCountry for cache separation"

key-files:
  created: []
  modified:
    - lib/constants.ts
    - components/ai/mood-section.tsx
    - lib/tmdb.ts
    - app/(app)/home/recommendations/page.tsx
    - components/ai/recommendations-grid.tsx
    - hooks/use-movies.ts
    - hooks/use-tv.ts
    - app/api/movies/route.ts
    - app/api/tv/route.ts

key-decisions:
  - "COUNTRY_LABELS placed in lib/constants.ts (shared between mood-section and recommendations page)"
  - "originCountry included in TanStack Query keys to prevent stale cache across different country filters"

patterns-established:
  - "Country prefix pattern: COUNTRY_LABELS[code] + genre name for display labels"

requirements-completed: [AIPOL-03]

duration: 3min
completed: 2026-03-07
---

# Phase 12 Plan 02: Origin Country Threading Summary

**Full-stack origin_country filtering from AI genre chips through TMDB discover API with country-prefixed labels and cache-separated infinite scroll**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-07T02:27:23Z
- **Completed:** 2026-03-07T02:30:38Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Country-prefixed genre chip labels ("Korean Drama" instead of "Drama") when AI detects country-specific request
- Full URL param threading of origin_country from mood section to recommendations page
- TMDB discover calls include with_origin_country for accurate country-filtered results
- Infinite scroll hooks maintain origin_country filter across pages with separate cache entries

## Task Commits

Each task was committed atomically:

1. **Task 1: Thread origin_country through mood section UI, TMDB lib, and recommendations page SSR** - `194c16c` (feat)
2. **Task 2: Thread origin_country through recommendations grid, hooks, and API routes** - `23b7804` (feat)

## Files Created/Modified
- `lib/constants.ts` - Added COUNTRY_LABELS map (ISO alpha-2 to English adjective)
- `components/ai/mood-section.tsx` - Country-prefixed genre chips, origin_country in URL, dynamic CTA button text
- `lib/tmdb.ts` - Added originCountry param to discoverMoviesByGenre, discoverTVByGenre, and discoverTV
- `app/(app)/home/recommendations/page.tsx` - Read origin_country param, pass to TMDB calls, display prefixed labels
- `components/ai/recommendations-grid.tsx` - Accept and pass originCountry to discover hooks
- `hooks/use-movies.ts` - originCountry in fetchGenreDiscover and useDiscoverByGenre query key
- `hooks/use-tv.ts` - originCountry in fetchTVGenreDiscover and useDiscoverTVByGenre query key
- `app/api/movies/route.ts` - Read origin_country from searchParams, pass to discoverMoviesByGenre
- `app/api/tv/route.ts` - Read origin_country from searchParams, pass to discoverTV

## Decisions Made
- COUNTRY_LABELS placed in lib/constants.ts since it is shared between mood-section and recommendations page
- originCountry included in TanStack Query keys (`[...movieKeys.genre(genreIds), originCountry ?? ""]`) to prevent stale cache when switching between country-filtered and unfiltered queries

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Origin country filtering complete end-to-end
- Phase 12 AI Polish fully complete (both plans done)
- Ready for Phase 13

---
*Phase: 12-ai-polish*
*Completed: 2026-03-07*

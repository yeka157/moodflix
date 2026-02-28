---
phase: 07-ui-ux-revamp
plan: 04
subsystem: ui
tags: [navigation, routing, next-link, sheet, drawer, movie-card, watchlist]

# Dependency graph
requires:
  - phase: 07-ui-ux-revamp plan 01
    provides: AppSidebar + BottomTabBar replacing AppNavbar
  - phase: 07-ui-ux-revamp plan 02
    provides: /movie/[id] and /tv/[id] detail pages
  - phase: 07-ui-ux-revamp plan 03
    provides: DiscoverGridContent + SeriesGridContent grid layouts
provides:
  - MovieCard with dual-mode: href (Link-based) or onClick (callback)
  - MovieRow with hrefPrefix + mediaType props for auto-derived hrefs
  - MovieGrid with hrefPrefix prop
  - MovieSearchDrawer: compact Sheet for Discover search result previews
  - All movie/TV cards across app navigate to /movie/[id] or /tv/[id]
  - Old AppNavbar component deleted from codebase
affects: [all pages that render MovieCard, MovieRow, MovieGrid]

# Tech tracking
tech-stack:
  added: [shadcn/ui Sheet component]
  patterns:
    - href prop on MovieCard — Link wraps card when href provided, onClick callback used otherwise
    - hrefPrefix pattern on MovieRow and MovieGrid — prefix + movie.id = full path
    - e.preventDefault() on watchlist action buttons inside Link to stop propagation

key-files:
  created:
    - components/movies/movie-search-drawer.tsx
    - components/ui/sheet.tsx
  modified:
    - components/movies/movie-card.tsx
    - components/movies/movie-row.tsx
    - components/movies/movie-grid.tsx
    - components/movies/home-movies.tsx
    - components/movies/personalized-section.tsx
    - components/movies/discover-grid-content.tsx
    - components/series/series-grid-content.tsx
    - components/ai/recommendations-grid.tsx
    - components/watchlist/watchlist-card.tsx
  deleted:
    - components/layout/app-navbar.tsx

key-decisions:
  - "MovieCard href prop: Link wraps card when href provided; onClick callback when not — dual-mode for both link and drawer use cases"
  - "e.preventDefault() added to bookmark/check handlers inside Link to prevent navigation on watchlist action clicks"
  - "MovieRow resolvedHrefPrefix: explicit hrefPrefix > derived from mediaType > undefined if onMovieClick provided (backward compat)"
  - "Discover search results keep onClick (drawer); discover grid results use hrefPrefix=/movie/ (link navigation)"
  - "WatchlistCard poster and title both link to /movie/[id] — no full-card link to avoid accidental navigation from action buttons"
  - "MovieSearchDrawer shows backdrop, genres, overview, watchlist quick actions, and View Full Details link to /movie/[id]"
  - "app-navbar.tsx deleted — layout.tsx already used AppSidebar since Plan 01"
  - "PersonalizedSection onMovieClick prop removed — now uses link-based navigation via MovieRow mediaType prop"

patterns-established:
  - "hrefPrefix pattern: pass prefix string to MovieGrid/MovieRow, component computes full href per item"
  - "Search drawer pattern: search results use onClick→state→Sheet, grid results use direct link navigation"

requirements-completed: [REVAMP-01]

# Metrics
duration: 12min
completed: 2026-02-24
---

# Phase 07 Plan 04: Navigation Migration and Final Cleanup Summary

**Link-based card navigation across all contexts (home, discover, series, library, AI) with search drawer for Discover search results and AppNavbar deletion**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-02-24T07:28:55Z
- **Completed:** 2026-02-24T07:40:31Z
- **Tasks:** 2/3 (Task 3 is human-verify checkpoint — awaiting visual verification)
- **Files modified:** 9 modified, 2 created, 1 deleted

## Accomplishments
- MovieCard supports dual-mode navigation: `href` prop wraps in Next.js Link (link-based), no `href` uses `onClick` callback (drawer use)
- All movie/TV cards across home, discover grid, series grid, library, and AI recommendations now navigate to `/movie/[id]` or `/tv/[id]`
- MovieSearchDrawer created: Sheet-based compact preview with backdrop, metadata, watchlist quick actions, and "View Full Details" link
- Discover search results use the drawer (onClick); discover/filter grid results use link navigation
- WatchlistCard poster and title link to `/movie/[id]`
- `app-navbar.tsx` deleted — layout.tsx has used AppSidebar since Plan 01
- Build passes with zero errors, lint passes with zero warnings

## Task Commits

Each task was committed atomically:

1. **Task 1: Add href prop to MovieCard, migrate all call sites** - `d9fd182` (feat)
2. **Task 2: Create search drawer, remove old navbar, final cleanup** - `61076b7` (feat)
3. **Task 3: Visual verification of complete UI/UX revamp** - awaiting human checkpoint

## Files Created/Modified
- `components/movies/movie-card.tsx` - Added href prop, dual-mode Link/onClick, e.preventDefault on action buttons
- `components/movies/movie-row.tsx` - Added hrefPrefix + mediaType props for auto-derived hrefs per card
- `components/movies/movie-grid.tsx` - Added hrefPrefix prop, passes to MovieCard
- `components/movies/home-movies.tsx` - Removed modal state + MovieDetailModal, uses mediaType=movie on rows
- `components/movies/personalized-section.tsx` - Removed onMovieClick prop, rows use link navigation
- `components/movies/discover-grid-content.tsx` - Search results: onClick→drawer, grid results: hrefPrefix=/movie/
- `components/series/series-grid-content.tsx` - Removed modal, TV cards use hrefPrefix=/tv/
- `components/ai/recommendations-grid.tsx` - Removed modal state, uses hrefPrefix=/movie/
- `components/watchlist/watchlist-card.tsx` - Poster and title link to /movie/[id]
- `components/movies/movie-search-drawer.tsx` - NEW: Sheet-based search result preview with "View Full Details"
- `components/ui/sheet.tsx` - NEW: shadcn Sheet component
- `components/layout/app-navbar.tsx` - DELETED

## Decisions Made
- MovieCard href prop: dual-mode — Link wraps entire card when href provided; onClick callback when not
- `e.preventDefault()` added to bookmark/check button handlers so watchlist actions don't trigger navigation
- `resolvedHrefPrefix` in MovieRow: explicit prop > derived from mediaType > undefined if onMovieClick provided
- Discover search results keep onClick (for drawer); discover grid results use hrefPrefix (direct link)
- WatchlistCard: poster and title are links, not full-card wrap — avoids accidental navigation from action buttons
- MovieSearchDrawer uses `side="right"` Sheet with compact layout; "View Full Details" button closes drawer and navigates

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed wrong backdrop size argument in MovieSearchDrawer**
- **Found during:** Task 2 build verification
- **Issue:** `getBackdropUrl(path, "w780")` — "w780" is a raw TMDB path segment, not the typed size key; TypeScript caught this
- **Fix:** Changed to `getBackdropUrl(path, "sm")` which maps to "w780" via the TMDB_BACKDROP_SIZES constant
- **Files modified:** components/movies/movie-search-drawer.tsx
- **Verification:** Build passes with zero TypeScript errors
- **Committed in:** 61076b7 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 type/bug fix)
**Impact on plan:** Minimal fix caught by TypeScript before shipping. No scope creep.

## Issues Encountered
- Sheet component was not previously installed — added via `npx shadcn@latest add sheet` as part of Task 2

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All Phase 7 automated tasks complete (Plans 01-04)
- Task 3 checkpoint pending: human visual verification of all 10 feature areas
- Phase 8 (Landing Page Revamp) is ready to start after Task 3 sign-off

---
*Phase: 07-ui-ux-revamp*
*Completed: 2026-02-24*

---
phase: 05-tv-series-page-modal
verified: 2026-02-23T00:00:00Z
status: passed
score: 12/12 must-haves verified
re_verification: false
gaps: []
human_verification:
  - test: "Navigate to /series, click a TV card — verify modal shows seasons, episodes, status badge, Created by"
    expected: "Modal renders TV-specific fields — no runtime, no Director, no watchlist buttons"
    why_human: "API-dependent runtime fields; requires live TMDB data to confirm rendering path"
  - test: "Navigate to /discover, click a movie card — confirm modal still shows Director, runtime, and watchlist buttons"
    expected: "Movie modal is 100% unchanged — readOnly=false path renders all library controls"
    why_human: "Regression check requiring live UI interaction"
  - test: "Tab to the series hero banner and press Enter"
    expected: "TV detail modal opens — keyboard accessibility is wired"
    why_human: "Browser-level keyboard event; cannot verify with grep"
  - test: "Hard refresh /series and observe the loading skeleton"
    expected: "Hero skeleton + 4 row skeletons appear briefly before content"
    why_human: "Timing-dependent loading state only observable in the browser"
---

# Phase 05: TV Series Page and Modal Verification Report

**Phase Goal:** Users can navigate to /series, browse four curated TV content rows, and open a TV-specific detail modal — all using the existing movie UI components with minimal modification.
**Verified:** 2026-02-23
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | A "Series" link appears in the top navbar and navigates to /series | VERIFIED | `app-navbar.tsx` line 46-48: `{ href: "/series", label: "Series", icon: Tv, exact: false }` — inserted between Discover and Library |
| 2  | The /series page displays four labeled rows: Trending TV Shows, Korean Drama, Chinese Drama, Top Rated Series | VERIFIED | `series-content.tsx` lines 37-62: four `<MovieRow>` calls with exact titles in required order |
| 3  | Each row has horizontal scroll with arrow navigation (MovieRow reuse) | VERIFIED | `series-content.tsx` passes `movies` and `onMovieClick` to `<MovieRow>` — MovieRow component provides scroll + arrows |
| 4  | A hero banner at top of /series shows a trending TV show backdrop | VERIFIED | `series-content.tsx` line 29-33: `<SeriesHeroBanner show={featuredShow} onClick=...>` rendered before rows; `series-hero-banner.tsx` renders backdrop image |
| 5  | Clicking the hero banner opens the TV detail modal | VERIFIED | `series-hero-banner.tsx` lines 46-49: `onClick`, `role="button"`, `tabIndex={0}`, `onKeyDown` handler; `series-content.tsx` line 32: `onClick={() => setSelectedShow(featuredShow)}` |
| 6  | TV show cards do NOT show watchlist add/remove buttons (read-only) | VERIFIED | `movie-card.tsx` line 188: `{!readOnly && <div ...>}` gates action icons; `series-content.tsx` passes `readOnly` to all four `<MovieRow>` instances; `movie-row.tsx` line 121: propagates `readOnly` to `<MovieCard>` |
| 7  | The /series route shows a loading skeleton while data loads | VERIFIED | `app/(app)/series/loading.tsx` exists with hero skeleton + 4 row skeletons matching discover pattern |
| 8  | TV detail modal shows title, overview, first air date, number of seasons, number of episodes | VERIFIED | `movie-detail-modal.tsx` lines 337-342: `{isTV && numberOfSeasons !== null && ...}` and `{isTV && numberOfEpisodes !== null && ...}` in meta row; title and overview shared fields |
| 9  | TV detail modal shows a status badge (Returning Series / Ended / Canceled) | VERIFIED | `movie-detail-modal.tsx` lines 357-361: `{isTV && showStatus && <Badge variant={getStatusBadgeVariant(showStatus)}...>}`; `getStatusBadgeVariant` helper at lines 49-59 covers all TMDB status strings |
| 10 | TV detail modal shows "Created by:" instead of "Director:" | VERIFIED | `movie-detail-modal.tsx` lines 552-572: `{isTV ? ( creatorNames ? <p>Created by: ...</p> ) : ( director ? <p>Director: ...</p> )}` — branched correctly on `isTV` |
| 11 | Watch providers for the user's region appear in the TV detail modal | VERIFIED | `movie-detail-modal.tsx` lines 617-676: watch providers section uses unified `details?.watchProviders` reference — works for both movie and TV; `/api/tv/[id]/route.ts` injects `watchProviders` and `watchCountry` from TMDB `watch/providers` |
| 12 | Movie detail modal behavior is completely unchanged when mediaType is "movie" (default) | VERIFIED | `movie-detail-modal.tsx` default `mediaType = "movie"`, `readOnly = false`; movie path: `useMovieDetails` enabled, `isTV=false` gates all TV-specific rendering; `useMovieDetails` path preserves director, runtime, watchlist buttons |

**Score:** 12/12 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/(app)/series/page.tsx` | Server Component with SSR fetch for 4 TV categories + metadata | VERIFIED | 33 lines; imports all 4 TMDB functions; `Promise.all` parallel fetch; `normalizeTVShow` applied; exports metadata |
| `app/(app)/series/loading.tsx` | Route-level loading skeleton matching discover pattern | VERIFIED | 25 lines; hero skeleton + 4 row skeletons; uses `<Skeleton>` component |
| `components/series/series-content.tsx` | Client Component managing selectedShow state and 4 MovieRow instances | VERIFIED | 72 lines; `useState<Movie | null>`; 4 `<MovieRow readOnly>` instances; `<MovieDetailModal mediaType="tv" readOnly>` |
| `components/series/series-hero-banner.tsx` | Clickable hero banner for TV show with onClick handler | VERIFIED | 132 lines; `onClick`, `role="button"`, `tabIndex={0}`, `onKeyDown`; `aria-label`; Framer Motion stagger; `TV_GENRES ?? GENRES` fallback |
| `components/layout/app-navbar.tsx` | Navbar with Series link added between Discover and Library | VERIFIED | Lines 46-48: Series entry at index 2 (after Discover, before Library); `Tv` icon from lucide-react |
| `components/movies/movie-detail-modal.tsx` | Extended modal with mediaType branching for TV-specific fields | VERIFIED | 684 lines; dual-hook pattern; `isTV` branching; `getStatusBadgeVariant`; `TVDetailsResponse` type cast; `useTVDetails` imported and called |
| `components/movies/movie-card.tsx` | readOnly prop gates watchlist action icons | VERIFIED | Line 29: `readOnly?: boolean`; line 188: `{!readOnly && <div ...>}` wraps entire action icons container |
| `components/movies/movie-row.tsx` | readOnly prop passed through to MovieCard | VERIFIED | Line 15: `readOnly?: boolean`; line 24: `readOnly = false`; line 121: `<MovieCard movie={movie} onClick={onMovieClick} readOnly={readOnly} />` |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app/(app)/series/page.tsx` | `lib/tmdb.ts` | SSR fetch calls | WIRED | Imports `getTrendingTV`, `getTopRatedTV`, `discoverKoreanDramas`, `discoverChineseDramas`; all four called in `Promise.all` |
| `components/series/series-content.tsx` | `components/movies/movie-row.tsx` | MovieRow with normalized Movie[] data | WIRED | `<MovieRow title="..." movies={trending|korean|chinese|topRated} onMovieClick={setSelectedShow} readOnly>` — 4 instances |
| `components/series/series-content.tsx` | `components/movies/movie-detail-modal.tsx` | selectedShow state passed as movie prop with mediaType='tv' | WIRED | `<MovieDetailModal movie={selectedShow} onClose={...} mediaType="tv" readOnly />` — state flows from hero/card clicks |
| `components/movies/movie-card.tsx` | `hooks/use-watchlist.ts` | readOnly prop gates watchlist hooks and buttons | WIRED | Hooks still called (React rules); `{!readOnly && ...}` wraps action div at line 188 — rendering gated, hooks kept |
| `components/movies/movie-detail-modal.tsx` | `hooks/use-tv.ts` | useTVDetails hook called when mediaType is tv | WIRED | `useTVDetails(isTV ? (movie?.id ?? null) : null)` — enabled only when `isTV=true` via `enabled: id !== null` |
| `components/movies/movie-detail-modal.tsx` | `types/tv.ts` | TVDetailsResponse type for casting TV-specific fields | WIRED | `import type { TVDetailsResponse } from "@/types/tv"` at line 17; `tvData = isTV ? (details as TVDetailsResponse | undefined) : undefined` |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| TV-01 | 05-01-PLAN.md, 05-02-PLAN.md | TV Series Discovery Page — /series page with 4 rows, hero, modal, readOnly cards, loading skeleton | SATISFIED | All 12 acceptance criteria verified in code; build passes (`/series` route visible in build output) |

### TV-01 Acceptance Criteria Breakdown

| Criterion | Status | Evidence |
|-----------|--------|----------|
| /series page exists and accessible from navbar via "Series" link | SATISFIED | Route in build output; navbar line 46 |
| Four content rows in order: Trending TV, Korean Drama, Chinese Drama, Top Rated Series | SATISFIED | `series-content.tsx` lines 37-62 |
| Each row uses existing MovieRow component | SATISFIED | 4 `<MovieRow>` calls in series-content |
| TV show cards use existing MovieCard component | SATISFIED | MovieRow → MovieCard (unchanged component, readOnly prop added) |
| Clicking a TV show card opens a detail modal | SATISFIED | `onMovieClick={setSelectedShow}` → `MovieDetailModal movie={selectedShow}` |
| TV modal shows title, overview, first air date, seasons, episodes, status badge, "Created by:", watch providers | SATISFIED | All verified in movie-detail-modal.tsx with isTV branching |
| Korean Drama: `with_origin_country=KR&with_genres=18&with_original_language=ko` | SATISFIED | `lib/tmdb.ts` `discoverKoreanDramas` exact match |
| Chinese Drama: `with_origin_country=CN&with_genres=18` | SATISFIED | `lib/tmdb.ts` `discoverChineseDramas` exact match |
| Route-level `loading.tsx` skeleton matching discover pattern | SATISFIED | `app/(app)/series/loading.tsx` — hero + 4 row skeletons |
| TV shows do NOT have watchlist buttons (read-only discovery) | SATISFIED | `readOnly` prop chains: SeriesContent → MovieRow → MovieCard; `{!readOnly && ...}` gates action icons |
| TV_GENRES constant added to lib/constants.ts | SATISFIED | `lib/constants.ts` line 37 — 8 TV-exclusive genre IDs (10759-10768) |

### Orphaned Requirements Check

No requirements in REQUIREMENTS.md map to Phase 5 that were not claimed by plans 05-01 or 05-02. TV-01 is the sole requirement and is fully accounted for.

---

## Anti-Patterns Found

No anti-patterns found across all 8 created/modified files:
- No TODO, FIXME, XXX, or HACK comments
- No placeholder or stub return values
- No empty handlers (all onClick handlers call setSelectedShow with real data)
- No Math.random() in Server Components (featuredShow uses `.find()` deterministically)
- readOnly hooks (useWatchlistTmdbIds, useAddToWatchlist, etc.) kept in MovieCard per React rules — not conditional hook calls

---

## Human Verification Required

### 1. TV Detail Modal Fields

**Test:** Navigate to /series, click any TV show card.
**Expected:** Modal shows "N Seasons", "M Episodes", a color-coded status badge (e.g., "Returning Series" in default/green), "Created by: [Name]" instead of "Director:", cast row, and watch providers tabs.
**Why human:** Requires live TMDB API response; rendering of `tvData?.number_of_seasons` is gated on API data being non-null.

### 2. Movie Modal Regression Check

**Test:** Navigate to /discover or /home, click any movie card.
**Expected:** Modal shows runtime, Director label, and the full Library Actions section (Add to Library, Mark as Watched, Like/Dislike buttons).
**Why human:** Requires confirming `readOnly=false` path renders correctly in a browser session.

### 3. Hero Banner Keyboard Accessibility

**Test:** Tab to the series hero banner container and press Enter.
**Expected:** TV detail modal opens — the `onKeyDown` handler for Enter is wired to `onClick`.
**Why human:** Browser keyboard event flow cannot be confirmed via static code inspection alone.

### 4. Loading Skeleton Timing

**Test:** Hard refresh /series on a slow connection or with throttled network.
**Expected:** Hero skeleton and 4 row skeletons appear briefly before content loads.
**Why human:** Next.js route-level loading.tsx trigger timing requires an actual browser request.

---

## Summary

Phase 05 goal is fully achieved. All 12 observable truths are verified in the codebase with substantive implementations — no stubs, no orphaned artifacts, no broken links.

**Key findings:**
- The /series route is registered in the build output as a dynamic server-rendered route (`ƒ /series`)
- All 4 TV data functions (`getTrendingTV`, `getTopRatedTV`, `discoverKoreanDramas`, `discoverChineseDramas`) are wired from TMDB lib through the SSR page to the client component
- The `readOnly` prop chains correctly through 3 layers: `SeriesContent` → `MovieRow` (prop added) → `MovieCard` (rendering gated)
- The dual-hook pattern in `MovieDetailModal` (`useMovieDetails` + `useTVDetails` both always called, null ID disables inactive one) correctly satisfies React rules while enabling TV/movie branching
- TMDB query parameters for Korean Drama and Chinese Drama match TV-01 spec exactly
- `TV_GENRES` constant exists and is used in `SeriesHeroBanner` with `GENRES` fallback for shared IDs
- Build passes with zero TypeScript errors (`npm run build` confirmed)
- No regressions introduced to existing movie pages — `readOnly` defaults to `false` and `mediaType` defaults to `"movie"` preserving all prior behavior

4 items flagged for human verification (UI behavior, live API data, keyboard interaction, loading timing) — all automated checks pass.

---

_Verified: 2026-02-23_
_Verifier: Claude (gsd-verifier)_

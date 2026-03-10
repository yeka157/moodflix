---
phase: quick-2
verified: 2026-03-10T00:00:00Z
status: passed
score: 5/5 must-haves verified
gaps: []
human_verification:
  - test: "Open a recent theatrical release (no digital yet)"
    expected: "Film icon + 'In theaters now — not yet available for streaming' message"
    why_human: "Requires a live movie currently in the 120-day theatrical window to confirm the date logic fires correctly"
  - test: "Open a movie past theatrical window with no streaming providers"
    expected: "Clock icon + 'Not yet on streaming — check back later' message"
    why_human: "Requires a specific real-world movie in the correct state"
  - test: "Open a movie/TV with providers in its region"
    expected: "Normal provider tabs render — no regression to any contextual message"
    why_human: "Visual confirmation that Tabs render correctly and no message appears when hasAnyProvider is true"
---

# Quick Task 2: Improve UX for Movies With No Watch Providers — Verification Report

**Task Goal:** Replace generic "Not available for streaming in your region" with three contextual status messages based on TMDB release_dates and TV show status.
**Verified:** 2026-03-10
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Movie in theaters with no digital release shows "In theaters now" message | VERIFIED | `movie-detail-page.tsx:401`, `movie-detail-modal.tsx:794` — `availability.type === "in_theaters"` branch renders Film icon + message |
| 2 | Movie with ended theatrical run and no streaming shows "Not yet on streaming" message | VERIFIED | `movie-detail-page.tsx:407`, `movie-detail-modal.tsx:800`, `tv-detail-page.tsx:483` — `not_yet_streaming` branch renders Clock icon + message |
| 3 | Movie/TV with providers elsewhere but not user's country shows "Not available in your region" | VERIFIED | All 3 views have `not_in_region` branch with Globe icon + message |
| 4 | TV shows use first_air_date and status for contextual messaging | VERIFIED | `getTVAvailabilityStatus` in `lib/availability.ts:75-105` uses `status` and `firstAirDate`; wired in `tv-detail-page.tsx:284` and `movie-detail-modal.tsx:285` |
| 5 | Movies/TV with watch providers still show provider tabs normally (no regression) | VERIFIED | All 3 views preserve `hasAnyProvider`/`hasStream`/`hasRent`/`hasBuy` guard — Tabs only render when providers exist; contextual messages only render in the `else` branch |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `lib/availability.ts` | Pure function to determine availability status | VERIFIED | 106 lines; exports `getMovieAvailabilityStatus`, `getTVAvailabilityStatus`, `AvailabilityStatus` type |
| `types/movie.ts` | `ReleaseDateResult` and related types | VERIFIED | `ReleaseDateEntry` (line 87), `ReleaseDateResult` (line 96), `MovieReleaseDatesResponse` (line 101), `release_dates?` on `MovieDetailsWithExtras` (line 109) |
| `lib/tmdb.ts` | `release_dates` in `append_to_response` | VERIFIED | Line 70: `append_to_response: "credits,watch/providers,release_dates"` |
| `components/movies/movie-detail-page.tsx` | Contextual messages in no-provider branch | VERIFIED | Imports `getMovieAvailabilityStatus` (line 18), computes at line 119, renders 3 branches at lines 401/407/413 with Film/Clock/Globe icons |
| `components/movies/movie-detail-modal.tsx` | Contextual messages for both movie + TV in modal | VERIFIED | Imports both functions (line 22), TV branch at 285/movie branch at 290, renders 3 branches at lines 794/800/806 |
| `components/movies/tv-detail-page.tsx` | Contextual messages using TV status logic | VERIFIED | Imports `getTVAvailabilityStatus` (line 19), computes at line 284, renders 2 branches at lines 483/489 with Clock/Globe icons |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `lib/availability.ts` | `components/movies/movie-detail-page.tsx` | `getMovieAvailabilityStatus` import | WIRED | Imported at line 18, called at line 119, result rendered in JSX |
| `lib/availability.ts` | `components/movies/movie-detail-modal.tsx` | `getMovieAvailabilityStatus` + `getTVAvailabilityStatus` imports | WIRED | Imported at line 22, both called at lines 285/290, result rendered in JSX |
| `lib/availability.ts` | `components/movies/tv-detail-page.tsx` | `getTVAvailabilityStatus` import | WIRED | Imported at line 19, called at line 284, result rendered in JSX |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| QUICK-2 | 2-PLAN.md | Contextual watch provider availability messaging | SATISFIED | All three messages implemented, utility module created, all 3 views updated |

### Anti-Patterns Found

None detected. No TODOs, FIXMEs, placeholder returns, or empty handlers found in modified files.

### Human Verification Required

#### 1. "In theaters now" message with a current theatrical release

**Test:** Find a movie currently in theatrical release (released within last 120 days, no digital release yet) and open its detail page or modal.
**Expected:** Film icon followed by "In theaters now — not yet available for streaming".
**Why human:** Requires a real-world movie in the correct state — the date logic in `getMovieAvailabilityStatus` cannot be exercised without live TMDB data.

#### 2. "Not yet on streaming" message for a post-theatrical movie

**Test:** Find a movie that had a theatrical run over 120 days ago but has no streaming providers in any region, and open its detail.
**Expected:** Clock icon followed by "Not yet on streaming — check back later".
**Why human:** Requires a specific real-world movie with the correct TMDB `release_dates` state.

#### 3. Provider tabs regression check

**Test:** Open a movie or TV show that has streaming providers in your region (e.g., any popular Netflix title).
**Expected:** Normal Stream/Rent/Buy tabs render with provider logos — no contextual message appears.
**Why human:** Visual confirmation that the `hasAnyProvider` guard works correctly and the `else` branch is not reached.

### Gaps Summary

No gaps. All automated checks pass:

- `lib/availability.ts` is a substantive 106-line module with correct discriminated union logic, 120-day theatrical window, country-aware release date lookup, and TV status-based logic.
- All three types added to `types/movie.ts` are present and `release_dates` is optional on `MovieDetailsWithExtras`.
- `lib/tmdb.ts` fetches `release_dates` alongside existing `append_to_response` fields.
- All three detail views (`movie-detail-page`, `movie-detail-modal`, `tv-detail-page`) import the utility, compute availability, and render all applicable message branches with the correct Lucide icons.
- Provider tabs (`Tabs` + `hasAnyProvider`) are preserved intact — no regression risk.
- Both documented commits (`00ef631`, `fe5d24f`) verified to exist in git history.
- TypeScript compiles cleanly with `npx tsc --noEmit`.

---

_Verified: 2026-03-10_
_Verifier: Claude (gsd-verifier)_

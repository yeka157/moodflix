---
phase: 10-tv-watchlisting-watchlist-ux
verified: 2026-03-03T12:00:00Z
status: gaps_found
score: 9/10 must-haves verified
re_verification:
  previous_status: passed
  previous_score: 10/10
  gaps_closed: []
  gaps_remaining:
    - "REQUIREMENTS.md still marks TVWL-01, TVWL-02, TVWL-03, TVWL-04 as [ ] Pending despite complete implementation"
  regressions: []
gaps:
  - truth: "REQUIREMENTS.md accurately reflects phase completion state"
    status: failed
    reason: "TVWL-01, TVWL-02, TVWL-03, TVWL-04 are still [ ] (unchecked) in REQUIREMENTS.md even though tv-detail-page.tsx fully implements all four. Unstaged working-tree changes exist that fix TVWL-06, WLUX-02, WLUX-03 but do not fix TVWL-01 through TVWL-04."
    artifacts:
      - path: ".planning/REQUIREMENTS.md"
        issue: "TVWL-01 through TVWL-04 remain [ ] Pending in both the checklist and the Traceability table — these should be [x] Complete"
    missing:
      - "Mark TVWL-01, TVWL-02, TVWL-03, TVWL-04 as [x] in the checklist section"
      - "Update TVWL-01 through TVWL-04 rows in the Traceability table from Pending to Complete"
      - "Stage and commit the updated REQUIREMENTS.md (including the already-unstaged fixes for TVWL-06, WLUX-02, WLUX-03)"
human_verification:
  - test: "Navigate to a TV show detail page (/tv/[id]) and click the Bookmark button"
    expected: "Show is added to library, bookmark icon fills, toast confirms. Clicking the filled Bookmark removes it with an Undo toast."
    why_human: "Real TMDB API + Supabase auth required to exercise the full add/remove flow"
  - test: "On /tv/[id] detail page, click 'Mark Watched' button for a TV show in library"
    expected: "Status updates to watched, button turns green with filled CircleCheck icon. Like/Dislike icons appear."
    why_human: "State transition requires real user session and Supabase DB write"
  - test: "On /tv/[id] detail page, click ThumbsUp when in library"
    expected: "ThumbsUp fills green, ThumbsDown remains unfilled. Clicking again clears the rating."
    why_human: "Rating flow requires real watchlist item ID from DB"
  - test: "On library page (/library), verify a TV show card links to /tv/[id] and shows a 'TV' badge"
    expected: "Clicking the card navigates to /tv/[id]. A small dark 'TV' pill badge is visible top-left on the poster."
    why_human: "Visual routing check requires real library data"
  - test: "On library page, toggle media type filter to 'TV Shows', then change a TV show's status via dropdown"
    expected: "The card stays visible in the grid after status change. Only 'Remove from Library' in the dropdown causes the card to fade out."
    why_human: "Stable-card behavior (WLUX-02) requires real data and real mutation to observe"
  - test: "On any movie/TV card (series page, home page), confirm bookmark state syncs after adding from detail page"
    expected: "Bookmark icon on movie cards fills without page refresh after mutation."
    why_human: "Cross-page cache sync (WLUX-01) requires navigating multiple pages within the same session"
---

# Phase 10: TV Watchlisting & Watchlist UX Verification Report

**Phase Goal:** Users can add TV shows to their library from the TV detail page, and all watchlist state syncs instantly across every card on every page without a refresh.
**Verified:** 2026-03-03T12:00:00Z
**Status:** gaps_found
**Re-verification:** Yes — after previous verification that returned status: passed

---

## Re-verification Summary

The previous VERIFICATION.md (2026-03-03, score 10/10) was reviewed. All code artifacts from Plans 01, 02, and 03 are confirmed present and wired. One gap was identified that was not caught in the initial pass: REQUIREMENTS.md has unstaged working-tree changes that partially update the document — TVWL-06, WLUX-02, WLUX-03 are corrected in the working tree but TVWL-01, TVWL-02, TVWL-03, TVWL-04 remain `[ ] Pending` in both the checklist and the Traceability table despite fully implemented code. No code regressions were found.

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | useWatchlistCheck accepts mediaType and query key includes it — TV and movie with same TMDB ID are independent cache entries | VERIFIED | `watchlistKeys.check: (tmdbId, mediaType) => [...watchlistKeys.all, "check", tmdbId, mediaType]` at hooks/use-watchlist.ts:26-27 |
| 2 | useRemoveFromWatchlist params include mediaType and optimistic tmdbIds filter checks both tmdbId AND mediaType | VERIFIED | `filter(entry => !(entry.tmdbId === params.tmdbId && entry.mediaType === itemMediaType))` at hooks/use-watchlist.ts:148-151 |
| 3 | MovieCard accepts mediaType prop and filters useWatchlistTmdbIds entries by mediaType | VERIFIED | `tmdbEntries?.find((e) => e.tmdbId === movie.id && e.mediaType === mediaType)` at components/movies/movie-card.tsx:57-59 |
| 4 | MovieRow and MovieGrid forward mediaType to MovieCard | VERIFIED | MovieRow: mediaType prop at line 17, forwarded at line 134; MovieGrid: mediaType prop at line 14, forwarded at line 52 |
| 5 | User can add/mark-watched/like-dislike/remove a TV show from /tv/[id] detail page | VERIFIED | Full action bar at components/movies/tv-detail-page.tsx:487-632; useWatchlistCheck(details.id, "tv") at lines 182-185; all mutations include mediaType: "tv" |
| 6 | Movie detail page and modal pass explicit mediaType to all watchlist hooks and mutation calls | VERIFIED | movie-detail-page.tsx:111 `useWatchlistCheck(details.id, "movie")`; movie-detail-modal.tsx:282 `useWatchlistCheck(movie?.id ?? 0, mediaType)` |
| 7 | Library cards for TV shows link to /tv/[id] and movie cards link to /movie/[id] | VERIFIED | `const href = item.mediaType === "tv" ? /tv/${item.tmdbId} : /movie/${item.tmdbId}` at watchlist-card.tsx:59 — applied to both poster Link and title Link |
| 8 | Library cards display a visible TV or Movie type badge pill on poster | VERIFIED | `<span className="absolute top-1 left-1 z-10 rounded px-1.5 py-0.5 text-[10px] font-semibold ...">` at watchlist-card.tsx:135-137 |
| 9 | Library page has media type filter (All / Movies / TV Shows) with live counts above status tabs | VERIFIED | ToggleGroup with totalCount, movieCount, tvCount at watchlist-content.tsx:151-168, rendered above status Tabs |
| 10 | REQUIREMENTS.md accurately reflects phase completion state for all Phase 10 requirements | FAILED | TVWL-01, TVWL-02, TVWL-03, TVWL-04 remain `[ ]` Pending in REQUIREMENTS.md (checklist + Traceability table) despite complete code implementation. Unstaged diff shows TVWL-06/WLUX-02/WLUX-03 were already partially fixed but TVWL-01 through TVWL-04 were not included. |

**Score:** 9/10 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `hooks/use-watchlist.ts` | Media-type-aware watchlistKeys.check, useWatchlistCheck, optimistic updates | VERIFIED | watchlistKeys.check includes mediaType (line 26-27); useWatchlistCheck accepts mediaType (line 50); all optimistic writes use correct keyed cache |
| `actions/watchlist.ts` | getWatchlistItemByTmdbId with mediaType filter | VERIFIED | `eq(watchlist.mediaType, mediaType)` in WHERE clause (line 98); function signature `mediaType: MediaType = "movie"` (line 86) |
| `components/movies/movie-card.tsx` | MovieCard with mediaType prop for TMDB ID disambiguation | VERIFIED | `mediaType?: MediaType` in props (line 33); lookup filters `e.mediaType === mediaType` (line 58) |
| `components/movies/movie-row.tsx` | MovieRow forwarding mediaType to MovieCard | VERIFIED | `mediaType?: MediaType` in props (line 17); forwarded to MovieCard (line 134) |
| `components/movies/movie-grid.tsx` | MovieGrid forwarding mediaType to MovieCard | VERIFIED | `mediaType?: MediaType` in props (line 14); forwarded to MovieCard (line 52) |
| `components/movies/tv-detail-page.tsx` | Full watchlist action bar for TV shows | VERIFIED | Action bar at lines 487-632; useWatchlistCheck(details.id, "tv") at lines 182-185; all add/remove/status/rate mutations with mediaType "tv" |
| `components/movies/movie-detail-page.tsx` | Explicit mediaType='movie' in watchlist calls | VERIFIED | useWatchlistCheck(details.id, "movie") at line 111; mediaType: "movie" in handleAddToLibrary |
| `components/movies/movie-detail-modal.tsx` | mediaType-aware watchlist calls forwarding mediaType prop | VERIFIED | useWatchlistCheck(movie?.id ?? 0, mediaType) at line 282; mediaType forwarded to all add/remove mutation calls |
| `components/watchlist/watchlist-card.tsx` | WatchlistCard with media-type routing and type badge | VERIFIED | href derived from item.mediaType (line 59); badge overlay at lines 135-137; remove/undo mutations include item.mediaType |
| `components/watchlist/watchlist-content.tsx` | WatchlistContent with media type filter row and client-side filtering | VERIFIED | useWatchlist() with no status arg (line 40); WatchlistMediaFilter used (line 37); ToggleGroup filter row (lines 151-168); useMemo dual filter (lines 48-57) |
| `components/watchlist/watchlist-skeleton.tsx` | Skeleton includes two-row filter placeholder | VERIFIED | Media type pills row (lines 14-18) above status tab skeleton (line 20) |
| `types/watchlist.ts` | WatchlistMediaFilter type exported | VERIFIED | `export type WatchlistMediaFilter = "all" | "movie" | "tv"` at line 9 |
| `.planning/REQUIREMENTS.md` | TVWL-01 through TVWL-04 marked complete | FAILED | These four requirements remain `[ ]` Pending. The TV detail page fully implements all four, but the documentation was not updated. |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| hooks/use-watchlist.ts | actions/watchlist.ts | getWatchlistItemByTmdbId(tmdbId, mediaType) | WIRED | Line 53: `queryFn: () => getWatchlistItemByTmdbId(tmdbId, mediaType)` — both params threaded |
| components/movies/movie-card.tsx | hooks/use-watchlist.ts | useWatchlistTmdbIds entry filtered by mediaType | WIRED | Line 57-59: `tmdbEntries?.find((e) => e.tmdbId === movie.id && e.mediaType === mediaType)` |
| components/movies/tv-detail-page.tsx | hooks/use-watchlist.ts | useWatchlistCheck(details.id, 'tv') | WIRED | Lines 182-185: exact call confirmed |
| components/movies/tv-detail-page.tsx | actions/watchlist.ts | addMutation with mediaType: 'tv' | WIRED | Lines 204, 225, 256 all include `mediaType: "tv"` |
| components/watchlist/watchlist-card.tsx | /tv/[id] and /movie/[id] | href derived from item.mediaType | WIRED | Line 59: conditional href applied to both poster and title Links |
| components/watchlist/watchlist-content.tsx | hooks/use-watchlist.ts | useWatchlist() with no status filter | WIRED | Line 40: `const { data: allItems, isLoading } = useWatchlist()` — no argument |
| components/series/series-content.tsx | components/movies/movie-row.tsx | mediaType="tv" on all four MovieRow calls | WIRED | Lines 23, 30, 37, 44 all pass `mediaType="tv"` |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| TVWL-01 | Plan 02 | User can add a TV show to library from /tv/[id] | SATISFIED (code) / STALE (docs) | `handleAddToLibrary` in tv-detail-page.tsx; addMutation with mediaType "tv" wired to Bookmark button. REQUIREMENTS.md still shows `[ ]` |
| TVWL-02 | Plan 02 | User can mark TV show as watched from /tv/[id] | SATISFIED (code) / STALE (docs) | `handleMarkWatched` in tv-detail-page.tsx; statusMutation wired to CircleCheck button. REQUIREMENTS.md still shows `[ ]` |
| TVWL-03 | Plan 02 | User can like/dislike TV show from /tv/[id] | SATISFIED (code) / STALE (docs) | ThumbsUp/ThumbsDown buttons wired to rateMutation at tv-detail-page.tsx:561-610. REQUIREMENTS.md still shows `[ ]` |
| TVWL-04 | Plan 02 | User can remove TV show from library | SATISFIED (code) / STALE (docs) | `handleRemove` in tv-detail-page.tsx; toggle-to-remove via Bookmark/Watched buttons + undo toast. REQUIREMENTS.md still shows `[ ]` |
| TVWL-05 | Plan 03 | Library cards for TV shows link to /tv/[id] | SATISFIED | watchlist-card.tsx:59 — href derives from item.mediaType. REQUIREMENTS.md shows `[x]` |
| TVWL-06 | Plan 03 | Library cards display TV/Movie type badge | SATISFIED | Badge overlay at watchlist-card.tsx:135-137. Unstaged REQUIREMENTS.md change has `[x]` |
| WLUX-01 | Plan 01 | Watchlist state syncs instantly across all cards after mutation | SATISFIED | useWatchlistTmdbIds cache updated optimistically in onMutate; MovieCard reads from shared cache; all cards invalidated on settle. REQUIREMENTS.md shows `[x]` |
| WLUX-02 | Plan 03 | Status change does not remove card from current view | SATISFIED | useWatchlist() fetches all items; client-side useMemo filters; AnimatePresence exit only fires on id removal. Unstaged REQUIREMENTS.md has `[x]` |
| WLUX-03 | Plan 03 | Library page has media type filter (All / Movies / TV Shows) | SATISFIED | ToggleGroup at watchlist-content.tsx:151-168 with live counts. Unstaged REQUIREMENTS.md has `[x]` |

### Documentation Gap Detail

`git status` confirms `.planning/REQUIREMENTS.md` has unstaged modifications. `git diff` reveals:

- Working tree already fixed: TVWL-06 (`[ ]` to `[x]`), WLUX-02 (`[ ]` to `[x]`), WLUX-03 (`[ ]` to `[x]`) in both checklist and Traceability table.
- Not yet fixed in working tree: TVWL-01, TVWL-02, TVWL-03, TVWL-04 — still `[ ]` and "Pending" in the committed file and in the current working tree.
- All four have complete, wired implementations in `components/movies/tv-detail-page.tsx`.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `components/movies/tv-detail-page.tsx` | 109 | `return null` in SeasonsSection | Info | Guard clause for empty seasons — correct, not a stub |
| `actions/watchlist.ts` | 47, 64, 89 | `return []` / `return null` when unauthenticated | Info | Auth guard — correct, not stubs |

No blocker or warning anti-patterns found in code.

---

## Human Verification Required

### 1. TV Show Add to Library Flow

**Test:** Navigate to a TV show detail page (/tv/[id]). Click the "Add to Library" button (Bookmark icon).
**Expected:** Show adds to library. Bookmark fills and label changes to "In Library". Toast appears. Navigating to /library shows the TV show with a "TV" badge.
**Why human:** Requires real Supabase auth session and TMDB API for TV show data.

### 2. TV Show Mark Watched and Rate

**Test:** From /tv/[id] with the show already in library, click "Mark Watched", then click ThumbsUp.
**Expected:** Button turns green with "Watched" label. ThumbsUp fills green. Both persist after page refresh.
**Why human:** State persistence requires real DB write and re-fetch.

### 3. Library Card TV Routing and Badge

**Test:** Visit /library with at least one TV show in library. Observe the card.
**Expected:** Card shows a "TV" pill badge top-left on the poster. Clicking the card title or poster navigates to /tv/[id], not /movie/[id].
**Why human:** Visual appearance and routing check requires real library data.

### 4. Stable Card on Status Change (WLUX-02)

**Test:** On /library with "Want to Watch" tab active, change a card's status dropdown to "Watched".
**Expected:** Card remains visible in the grid. Status badge on the card updates immediately. Card does not disappear.
**Why human:** Real-time optimistic update behavior requires a live session.

### 5. Cross-Card Instant Sync (WLUX-01)

**Test:** Add a movie from /movie/[id]. Navigate to /discover or /home. Check the movie card in a row.
**Expected:** Bookmark icon on the movie card is already filled without any page refresh.
**Why human:** Cross-page cache invalidation requires navigating between pages in a live session.

---

## Gaps Summary

All code artifacts are present, substantive, and wired. The phase goal is technically achieved in the codebase — TV watchlisting is fully implemented and watchlist state syncs across all cards.

One documentation gap blocks clean sign-off: TVWL-01, TVWL-02, TVWL-03, TVWL-04 remain `[ ] Pending` in `.planning/REQUIREMENTS.md` (both the checklist section and the Traceability table) despite the code being complete in `components/movies/tv-detail-page.tsx`. An unstaged change in the working tree partially addressed other requirements (TVWL-06, WLUX-02, WLUX-03) but did not include the four TV watchlisting core requirements.

**Fix required:** Update `.planning/REQUIREMENTS.md` — change TVWL-01, TVWL-02, TVWL-03, TVWL-04 from `[ ]` to `[x]` in the checklist, and from "Pending" to "Complete" in the Traceability table. Stage and commit all pending REQUIREMENTS.md changes together.

---

_Verified: 2026-03-03T12:00:00Z_
_Verifier: Claude (gsd-verifier)_

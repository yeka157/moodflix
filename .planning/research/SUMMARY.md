# Project Research Summary

**Project:** Moodflix v0.3 — Content Expansion
**Domain:** TV series discovery + homepage personalization + UI quality fix
**Researched:** 2026-02-19
**Confidence:** HIGH

## Executive Summary

Moodflix v0.3 adds three distinct features to an already-working movie app: a `/series` page for TV show discovery, a skeleton color fix, and homepage "Because you liked" personalized recommendation rows. The largest feature — TV series discovery — is architecturally clean because TMDB's TV endpoints mirror the movie endpoints almost exactly. The critical implementation constraint is normalization: TMDB TV shows use `name`/`first_air_date` instead of `title`/`release_date`, and these field mismatches will cause silent `undefined` renders and corrupt watchlist data if not caught at the type boundary. The recommended approach is to define a `normalizeTVShow()` adapter function in `types/tv.ts` that is called inside each hook's `queryFn`, so all components downstream only ever see `Movie`-shaped data.

The hardest non-obvious work in v0.3 is the watchlist schema migration. TMDB movie and TV show IDs are assigned from separate integer sequences — a TV show and a movie can share the same numeric ID. The current `UNIQUE(userId, tmdbId)` constraint will silently reject valid TV saves and show incorrect "already in library" state. A Drizzle migration adding `media_type` to the watchlist table and updating the unique constraint to `(userId, tmdbId, mediaType)` must be the absolute first deliverable, before any TV UI is built. This affects server actions, hooks, and types but is a contained, well-understood change.

The two smaller features (skeleton color fix and personalized homepage rows) are low-risk and self-contained. The skeleton fix is a single token swap (`bg-accent` to `bg-muted`) applied across all skeleton components. The "Because you liked" rows require a daily-rotation strategy seeded from the user's top-5 watched/liked movies and a pool of sentence-pattern variations for the row label — no new API surfaces or schema changes needed beyond a TMDB `movie.recommendations` call already available in `lib/tmdb.ts`.

## Key Findings

### Recommended Stack

No new runtime dependencies for v0.3. The entire milestone runs on the existing stack: Next.js 16, TanStack Query 5, Drizzle ORM, TMDB API v3, and Supabase. The TMDB TV endpoints authenticate with the same Bearer token already in `lib/tmdb.ts` and follow the identical `tmdbFetch<T>()` pattern used for movies. TanStack Query hooks for TV mirror `use-movies.ts` exactly, swapping endpoint paths and response types. Drizzle handles the watchlist schema migration through the existing `db:generate` + `db:migrate` workflow.

**Core technologies (already installed):**
- TMDB API v3 — TV endpoints mirror movie endpoints; same auth header, same ISR 300s revalidate
- TanStack Query 5.x — `useQuery` / `useInfiniteQuery` patterns copy directly to TV hooks
- Drizzle ORM — migration required for `media_type` column on watchlist table
- TypeScript strict — `TVShow` type + `normalizeTVShow()` function eliminate all unsafe field accesses at compile time

**No new packages required.** See `STACK.md` for full version compatibility table.

### Expected Features

**Must have — TV series page (table stakes):**
- Trending TV row — users orient by popularity (TMDB `/trending/tv/week`)
- Top Rated series row — critically vetted anchor (TMDB `/tv/top_rated`)
- Korean Drama row — named first-class row, not buried under "International" (TMDB discover `with_origin_country=KR&with_genres=18`)
- Chinese Drama row — first-class treatment for a significant global audience (`with_origin_country=CN&with_genres=18`)
- TV show detail modal — seasons/episodes count, show status badge (Returning / Ended), "Created by:" instead of "Director:"
- Loading skeletons matching existing discover page skeleton pattern

**Should have — competitive differentiation:**
- Show status badge (Returning Series / Ended / Cancelled) — Netflix hides this; surfacing it is a genuine UX win
- Miniseries detection (`number_of_seasons === 1 && status === "Ended"` → "Miniseries" label)
- Network/streaming origin in modal (HBO, Netflix Original, etc.)
- Watchlist add/remove for TV shows (requires schema migration first)

**Must have — bug fix:**
- Skeleton loading color: replace `bg-accent` with `bg-muted` across all skeleton components — current state flickers crimson on load

**Must have — homepage personalization:**
- "Because you liked [Movie Title]" rows with daily rotation from user's top-5 rated/watched pool
- Sentence variety in row labels (4-6 patterns: "Because you liked", "More like", "If you loved", etc.) to avoid repetition across sessions

**Defer to v0.4+:**
- TV search on `/discover` (doubles API surface, UI duplication)
- TV genre filters on `/series` (TV genre IDs differ from movie IDs; separate filter UI needed)
- Japanese Anime row (`with_origin_country=JP&with_genres=16`)
- AI mood recommendations for TV (TV genre IDs differ; separate AI prompt work)
- Episode-level progress tracking (requires new schema table, complex UX)
- Season-by-season watchlist status (same as above)

### Architecture Approach

The core architectural pattern for v0.3 is **normalize at the hook boundary, not at the API route**. The `/api/tv/route.ts` returns raw TMDB `TVShow[]` JSON. The `use-tv.ts` hook's `queryFn` calls `normalizeTVShow()` from `types/tv.ts` on each result, converting to `Movie` shape before TanStack Query caches it. This means `MovieCard`, `MovieRow`, and (mostly) `MovieDetailModal` consume TV show data without modification. The `MovieDetailModal` receives a `mediaType?: "movie" | "tv"` prop and a separate `tvDetails?: TVDetailsResponse` prop — it branches in ~20 lines for runtime display, creator label, and season count. No existing movie component is forked.

The `/api/tv/` route is separate from `/api/movies/` (not a `?type=tv` param extension) to keep typed contracts clean. A separate `tvKeys` TanStack Query key factory under `["tv"]` root prevents cache cross-contamination with the `["movies"]` cache. The watchlist data flow is unchanged after the schema migration — server actions use `movie.id` (the normalized ID) and the new `mediaType` discriminant.

**New files to create:**
1. `types/tv.ts` — `TVShow`, `TVDetails`, `TVDetailsResponse`, `normalizeTVShow()` adapter
2. `lib/constants.ts` addition — `TV_GENRES` record for TV-specific genre IDs (10759, 10762–10768)
3. `app/api/tv/route.ts` — TV list proxy (trending, top_rated, korean_drama, chinese_drama categories)
4. `app/api/tv/[id]/route.ts` — TV detail proxy with `append_to_response=credits,watch/providers`
5. `hooks/use-tv.ts` — TanStack Query hooks with normalization in `queryFn`
6. `components/series/series-content.tsx` — Client component managing rows + modal state
7. `app/(app)/series/page.tsx` — SSR page (Promise.all for initial row data)
8. `app/(app)/series/loading.tsx` — Route skeleton (reuse discover skeleton pattern)

**Files to modify:**
- `drizzle/schema.ts` — add `mediaTypeEnum`, add `mediaType` column, replace unique constraint
- `components/movies/movie-detail-modal.tsx` — add `mediaType`/`tvDetails` props, ~20 lines of branching
- `components/layout/app-navbar.tsx` — add "Series" nav link with `Tv` lucide icon
- `lib/constants.ts` — add `TV_GENRES` and `ALL_GENRES` exports
- All skeleton components — `bg-accent` → `bg-muted` token fix
- `app/(app)/home/page.tsx` — add "Because you liked" rows section
- `actions/watchlist.ts` / `hooks/use-watchlist.ts` — propagate `mediaType` through watchlist CRUD

### Critical Pitfalls

1. **`title`/`name` field mismatch is silent and destructive** — TypeScript won't error if raw `TVShow` is cast as `Movie`; the result is blank titles on every TV card and `undefined` stored in the watchlist `title` column. Prevention: define `TVShow` type in `types/tv.ts` first, call `normalizeTVShow()` in every hook's `queryFn` before returning, never pass raw TV API responses to `Movie`-typed props.

2. **TMDB ID collision requires schema migration before any TV UI** — Movie and TV IDs are independent integer sequences; the same number can refer to both. The current `UNIQUE(userId, tmdbId)` constraint silently rejects valid TV saves when a movie with the same ID exists. Migration to `UNIQUE(userId, tmdbId, mediaType)` must be applied and tested first — it cascades through Drizzle schema, server actions, watchlist hooks, and all `tmdbId`-only match sites. Recovery after launch is HIGH cost.

3. **TV detail calls wrong TMDB endpoint if `useMovieDetails` is reused** — `useMovieDetails(id)` hits `/api/movies/[id]` which calls TMDB `/movie/{id}` — returning a different (movie) entity or a 404 for TV-only IDs. Prevention: create `/api/tv/[id]/route.ts` and `useTVDetails(id)` hook; pass `tvDetails` as prop to modal; disable `useMovieDetails` when `mediaType === "tv"`.

4. **TV genre IDs are a separate namespace** — TV-only genres (Action & Adventure `10759`, Kids `10762`, Sci-Fi & Fantasy `10765`, etc.) are absent from the existing `GENRES` constant. TV show cards will display zero genre badges without a `TV_GENRES` addition. Prevention: add `TV_GENRES` to `lib/constants.ts` and an `ALL_GENRES` merged export before building any TV card component.

5. **K-Drama / C-Drama filter needs `with_genres=18` to exclude variety content** — `with_origin_country=KR` alone returns all Korean content (news, reality, variety). Always combine with `with_genres=18` (Drama) and `with_original_language=ko`. C-Drama: `with_origin_country=CN` misses shows registered under `HK`/`TW` — for v0.3, accept this limitation and label clearly as "Chinese Drama"; defer multi-country union query to v0.4.

6. **TanStack Query key root must be isolated** — TV hooks must use `["tv"]` as root, not `["movies"]`. The `useMovieDetails` `placeholderData` function already does unsafe `as unknown as MovieDetailsResponse` casting — if TV data bleeds into the movies cache, wrong data flashes in the modal. Prevention: define a separate `tvKeys` factory before writing any TV hook.

## Implications for Roadmap

Based on research, the three v0.3 features map cleanly to three phases ordered by dependency and risk.

### Phase 1: Foundation — Schema Migration + TV Types + Constants

**Rationale:** Every subsequent task depends on these. The schema migration must be live before any TV UI can be wired to watchlist actions. TV types and constants must exist before any hooks or components can be type-checked. This phase has zero UI surface but eliminates the two highest-cost pitfalls (ID collision, field name mismatch) before they can cause harm.

**Delivers:**
- Drizzle migration: `media_type` enum + column on watchlist, updated unique constraint
- `types/tv.ts` with `TVShow`, `TVDetails`, `TVDetailsResponse`, `normalizeTVShow()`
- `lib/constants.ts` additions: `TV_GENRES`, `ALL_GENRES`
- `tvKeys` query key factory stub in `hooks/use-tv.ts`
- Updated `AddToWatchlistInput`, `WatchlistItem` types to include `mediaType`
- Updated `actions/watchlist.ts` and `hooks/use-watchlist.ts` to propagate `mediaType`

**Avoids:** TMDB ID collision (Pitfall 2), field name mismatch (Pitfall 1), genre ID namespace gap (Pitfall 4), query key collision (Pitfall 6)

### Phase 2: TV Series Page

**Rationale:** The primary feature of the milestone. Built after Phase 1 ensures types, constants, and schema are in place. This phase is the largest by file count but each individual step is straightforward — it mirrors existing movie patterns.

**Delivers:**
- `lib/tmdb.ts` TV functions: `getTrendingTV`, `getTopRatedTV`, `discoverTVByCountry`
- `app/api/tv/route.ts` — list proxy (trending, top_rated, korean_drama, chinese_drama)
- `app/api/tv/[id]/route.ts` — detail proxy with `append_to_response`
- `hooks/use-tv.ts` — full TanStack Query hook set with normalization
- `components/series/series-content.tsx` — four-row client component
- `app/(app)/series/page.tsx` + `loading.tsx` — SSR page and skeleton
- `components/movies/movie-detail-modal.tsx` modification — `mediaType` prop, TV branching
- `components/layout/app-navbar.tsx` modification — Series nav link

**Implements:** Normalization-at-hook-boundary pattern, separate API route triplet, media-type-prop modal branching

**Avoids:** Wrong endpoint for TV details (Pitfall 3), variety show contamination in K-Drama row (Pitfall 5), watch provider type errors (Pitfall 6)

### Phase 3: Homepage Polish — Skeleton Fix + Personalized Rows

**Rationale:** Self-contained, lower-risk changes that sit on top of the existing home page. Ordered last because they don't block the TV page and have no dependencies on Phase 1 or 2. Could be parallelized with Phase 2 if needed — they are genuinely independent.

**Delivers:**
- Skeleton color fix: `bg-accent` → `bg-muted` across all skeleton components (single-pass find-and-replace)
- "Because you liked" rows on `/home`: daily-rotation logic selecting one movie from top-5 watched/rated pool, TMDB recommendations call, sentence-pattern pool for label variety
- No schema changes, no new API routes

**Uses:** Existing `useMovieRecommendations` pattern (or adds it to `hooks/use-movies.ts`), deterministic daily seed from `new Date().toDateString()` to avoid `Math.random()` SSR lint error

### Phase Ordering Rationale

- Schema migration before TV UI: the watchlist ID collision bug is not hypothetical — it will occur whenever a user saves a TV show whose TMDB ID matches an existing movie ID. The migration is irreversible after launch data exists.
- Types before hooks before components: TypeScript's strict mode catches integration errors at each layer; building in reverse means discovering type errors late.
- TV page before homepage polish: Phase 3 is independent but lower priority; if time is short, Phase 3 can ship as a follow-up without blocking the TV page launch.
- Skeleton fix is fast (< 1 hour) and can be the first commit of Phase 3 or tacked onto Phase 2 completion.

### Research Flags

Phases likely needing deeper research or careful verification during planning:

- **Phase 1 — watchlist migration:** Verify the zero-downtime migration path. The existing `watchlist_user_tmdb_unique` constraint must be dropped before the new `watchlist_user_tmdb_media_unique` one can be added. Confirm `db:migrate` applies these as a single transaction.
- **Phase 2 — `aggregate_credits` vs `credits`:** TMDB TV details support both. `aggregate_credits` covers all seasons but was flagged as needing live API verification. Confirm which append key returns the richer cast list without breaking the existing `MovieCredits` type shape.
- **Phase 2 — K-Drama filter validation:** Verify `with_origin_country=KR&with_genres=18&with_original_language=ko` returns drama content (not variety) via a live API call during implementation. TMDB data quality on country tagging is MEDIUM confidence.
- **Phase 3 — daily rotation seed:** Confirm that `new Date().toDateString()` hashing produces stable daily rotation without triggering Next.js ESLint "Cannot call impure function" errors in Server Components. Use a simple integer hash, not `Math.random()`.

Phases with standard patterns (no additional research needed):

- **Phase 1 — Drizzle migration workflow:** Documented in `DRIZZLE_GUIDE.md`, well-established pattern.
- **Phase 2 — TMDB API route pattern:** Mirrors `app/api/movies/route.ts` exactly; no novel API surface.
- **Phase 2 — TanStack Query hook pattern:** Mirrors `hooks/use-movies.ts` exactly.
- **Phase 3 — skeleton color fix:** Single token replacement, no research needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | No new packages; all TV endpoints follow identical patterns to movie endpoints already in use |
| Features | HIGH (TV page) / MEDIUM (homepage rows) | TV features well-scoped from TMDB docs; personalized row rotation logic needs design decision on seed strategy |
| Architecture | HIGH | Normalization pattern and route separation validated against actual codebase; build order confirmed by dependency analysis |
| Pitfalls | HIGH (schema, types, genre IDs) / MEDIUM (K-Drama filter reliability, `aggregate_credits`) | Schema and type pitfalls are deterministic; TMDB data quality pitfalls depend on live API behavior |

**Overall confidence:** HIGH

### Gaps to Address

- **`aggregate_credits` vs `credits` for TV:** Research flagged this as needing live API verification. Recommendation: use `credits` first (matches existing movie pattern, same TypeScript type); if cast lists are too sparse for long-running shows, switch to `aggregate_credits` in a follow-up.
- **Viki / Kocowa provider IDs:** Research cited IDs 234 and 443 from training data — verify against TMDB `/watch/providers` list before adding to `PROVIDER_URLS` in `lib/constants.ts`. If unverifiable without live API access, skip in v0.3.
- **Homepage personalized row rotation design:** The "Because you liked" feature needs a specific design decision: (a) which users qualify (at least N watched/liked movies?), (b) what fallback to show for new users with no history, (c) whether to persist the daily pick server-side or derive it deterministically client-side. These are product decisions, not research gaps — resolve during Phase 3 planning.
- **C-Drama coverage gap:** `with_origin_country=CN` misses HK/TW productions. Accepted limitation for v0.3. Document in UI if feasible ("Showing Mainland China productions"). Revisit for v0.4.

## Sources

### Primary (HIGH confidence)

- Actual codebase — `types/movie.ts`, `lib/tmdb.ts`, `lib/constants.ts`, `drizzle/schema.ts`, `components/movies/movie-card.tsx`, `components/movies/movie-detail-modal.tsx`, `hooks/use-movies.ts`, `hooks/use-watchlist.ts`, `app/api/movies/route.ts`, `app/api/movies/[id]/route.ts`, `actions/watchlist.ts`, `components/layout/app-navbar.tsx` (read directly 2026-02-19)
- TMDB API v3 TV endpoints — field names (`name`, `first_air_date`, `episode_run_time`, `number_of_seasons`, `created_by`, `origin_country`), endpoint paths (`/trending/tv/week`, `/tv/top_rated`, `/discover/tv`), `with_origin_country`/`with_original_language` parameters (stable API surface, HIGH confidence)
- TMDB TV genre IDs — 10759 (Action & Adventure), 10762–10768 (Kids/News/Reality/Sci-Fi/Soap/Talk/War), overlap IDs 16/18/35/80 shared with movies (HIGH confidence)

### Secondary (MEDIUM confidence)

- Netflix web app UX — K-Drama and C-Drama row patterns, show status display
- JustWatch — country filter behavior, provider display patterns
- TMDB data quality for `with_origin_country` — K-Drama/C-Drama filter reliability

### Tertiary (LOW confidence — verify during implementation)

- Viki provider ID (234) and Kocowa provider ID (443) — training data citation, needs live verification
- `aggregate_credits` vs `credits` behavior for long-running TV shows — verify against TMDB API response in implementation

---
*Research completed: 2026-02-19*
*Ready for roadmap: yes*

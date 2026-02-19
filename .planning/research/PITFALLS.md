# Pitfalls Research

**Domain:** TV series discovery added to existing movie-only Next.js + TMDB app (Moodflix v0.3)
**Researched:** 2026-02-19
**Confidence:** HIGH (codebase analysis + verified TMDB API schema knowledge)

---

## Critical Pitfalls

### Pitfall 1: TMDB Field Name Mismatch — `title`/`release_date` vs `name`/`first_air_date`

**What goes wrong:**
The existing `Movie` type uses `title` and `release_date`. The TMDB TV series API returns `name` and `first_air_date` in their place. Every component that reads `movie.title` or `movie.release_date` will silently produce `undefined` when fed a TV show object — TypeScript will not catch this if the shared display type uses the movie shape.

Specifically in the current codebase:

- `MovieCard` line 37: `movie.release_date?.slice(0, 4)` → `"N/A"` for every TV show
- `MovieCard` line 39: `movie.title` in the alt text and overlay heading → `undefined` rendered as empty
- `MovieDetailModal` line 125: `movie?.release_date?.slice(0, 4)` → `"N/A"`
- `MovieDetailModal` line 273: `{movie.title}` in backdrop overlay → blank heading
- `MovieDetailModal` line 238: `{movie?.title ?? "Movie Details"}` in DialogTitle → falls back to "Movie Details" for every TV show
- `addToWatchlist` called with `title: movie.title` → stores `undefined` in DB

**Why it happens:**
Developers normalize TV shows into the existing `Movie` type to reuse components. They assume numeric `id`, `poster_path`, `backdrop_path`, `overview`, `vote_average`, and `genre_ids` are shared — they are. But `title`→`name` and `release_date`→`first_air_date` are silent field renames, not omissions. TypeScript won't error if the TV API response is cast as `Movie` because the type doesn't mark those fields as required with literal types — it just says `string`.

**How to avoid:**
Create a `TVShow` type mirroring the TMDB TV response, then create a normalized `MediaItem` union or mapped type:

```typescript
// types/tv.ts
export type TVShow = {
  id: number;
  name: string;               // NOT title
  original_name: string;      // NOT original_title
  first_air_date: string;     // NOT release_date
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  adult: boolean;
  original_language: string;
  origin_country: string[];   // TV-only field
};

// types/media.ts — normalized shape for shared components
export type MediaItem = {
  id: number;
  mediaType: "movie" | "tv";
  title: string;              // normalized: movie.title | tv.name
  releaseDate: string;        // normalized: movie.release_date | tv.first_air_date
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  adult: boolean;
  original_language: string;
};
```

Normalize at the API boundary (in `lib/tmdb.ts` TV functions or in the `/api/series` route handler) before the data reaches any component or hook. Never pass raw TMDB TV responses into `Movie`-typed props.

**Warning signs:**
- Movie cards showing blank titles in the series grid
- Year displaying "N/A" on every TV show card
- `movie.title` appearing as `undefined` in watchlist DB rows (check Drizzle Studio)
- TypeScript not erroring — this is the hidden danger, it will compile fine if cast wrong

**Phase to address:** Phase 1, task 1 — define `TVShow` and `MediaItem` types BEFORE writing any TV API functions or components. The type contract must exist before implementation.

---

### Pitfall 2: TMDB ID Collision Between Movies and TV Shows

**What goes wrong:**
Movie ID `1399` is Game of Thrones (TV). Movie ID `550` is Fight Club. These ID spaces are entirely separate in TMDB — the same integer ID (e.g., `1234`) can exist as both a movie and a TV show. The current watchlist schema has:

```sql
UNIQUE (user_id, tmdb_id)   -- watchlist_user_tmdb_unique
```

This constraint treats movie ID `1234` and TV show ID `1234` as the same row. A user who saves the movie with TMDB ID `1234` cannot then save the TV show with TMDB ID `1234` — the insert will throw `watchlist_user_tmdb_unique` violation and the `addToWatchlist` action returns `"Movie already in library"` (wrong error message and wrong behavior).

Beyond the constraint, `useWatchlistTmdbIds` returns a flat array of `{ tmdbId, status }`. The `MovieCard` does `tmdbEntries?.find((e) => e.tmdbId === movie.id)` — if a movie and TV show share the same numeric ID, the TV show card will show as already-in-library (incorrectly), and vice versa.

**Why it happens:**
The current design implicitly assumes all `tmdbId` values come from a single namespace. This was correct when only movies existed. The mistake is not adding a `media_type` discriminator to the watchlist table.

**How to avoid:**
Add a `media_type` column to the `watchlist` table in a Drizzle migration **before** building any TV series feature:

```typescript
// drizzle/schema.ts addition
export const mediaTypeEnum = pgEnum("media_type", ["movie", "tv"]);

export const watchlist = pgTable(
  "watchlist",
  {
    // ... existing columns ...
    mediaType: mediaTypeEnum("media_type").notNull().default("movie"),
  },
  (table) => [
    // REPLACE the old unique constraint:
    unique("watchlist_user_tmdb_media_unique").on(
      table.userId,
      table.tmdbId,
      table.mediaType,   // now (userId, tmdbId, mediaType) is the unique key
    ),
  ],
);
```

Update `AddToWatchlistInput`, `WatchlistItem`, `WatchlistTmdbEntry` types to include `mediaType`. Update all queries, actions, and optimistic update logic that currently matches on `tmdbId` alone to also match on `mediaType`.

**Warning signs:**
- User reports they can't save a TV show (unique constraint error)
- TV show card shows "In Library" bookmark even though user never saved it (ID collision false positive)
- `addToWatchlist` returns `"Movie already in library"` for a TV show the user has never seen

**Phase to address:** Phase 1, task 1 — schema migration must be the absolute first deliverable. All subsequent TV work depends on it. Do NOT build any TV UI before this migration is applied and tested.

---

### Pitfall 3: TV Detail Endpoint and `runtime` Field Structure Difference

**What goes wrong:**
The current `MovieDetails` type has `runtime: number | null` — a single integer (total minutes). The TMDB TV series detail endpoint (`/tv/{id}`) returns `episode_run_time: number[]` — an array of episode durations in minutes, often empty `[]`, sometimes with one element, occasionally multiple (for shows with variable-length episodes). There is no single `runtime` field.

The current `movie-detail-modal.tsx` calls `formatRuntime(details.runtime)` and shows `"2h 14m"` style. For TV shows:
- `details.runtime` will be `undefined` (field doesn't exist) → `formatRuntime(undefined)` returns `""` → runtime simply disappears
- More useful TV metadata: `number_of_seasons`, `number_of_episodes`, episode count per season

If the modal is naively reused for TV details, the runtime row goes blank with no TV-specific replacement.

**How to avoid:**
Define a `TVShowDetails` type that mirrors what `/tv/{id}?append_to_response=credits,watch/providers` actually returns:

```typescript
export type TVShowDetails = {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genres: { id: number; name: string }[];
  popularity: number;
  adult: boolean;
  original_language: string;
  episode_run_time: number[];          // array, NOT a single number
  number_of_seasons: number;
  number_of_episodes: number;
  status: string;                      // "Returning Series" | "Ended" | "Canceled" etc.
  tagline: string | null;
  // TV credits use "created_by" not "crew" for show creator
  created_by: { id: number; name: string; profile_path: string | null }[];
  credits: MovieCredits;               // cast structure is same
  "watch/providers": WatchProvidersResponse;  // same structure
};
```

In the detail modal for TV shows: replace the runtime display with season/episode count (`2 Seasons · 16 Episodes`), and replace "Director:" with "Created by:". Create a `MediaDetailModal` that branches on `mediaType` to render the correct metadata.

**Warning signs:**
- TV detail modal shows no runtime at all
- TV detail modal says "Director: undefined" or shows no director section
- TypeScript errors when accessing `details.name` on a `MovieDetails` type

**Phase to address:** Phase 2 (TV detail modal) — when building `/api/tv/[id]` route and the detail display.

---

### Pitfall 4: TV Series Genre IDs Are a Separate Namespace from Movie Genre IDs

**What goes wrong:**
The existing `GENRES` constant in `lib/constants.ts` maps movie genre IDs to names (e.g., `28: "Action"`, `18: "Drama"`). The TMDB TV genre endpoint returns a different set of IDs for what appear to be the same genres. Overlapping IDs may map to different genre names:

| ID | Movie genre | TV genre |
|----|------------|---------|
| 10759 | (doesn't exist) | Action & Adventure |
| 10762 | (doesn't exist) | Kids |
| 10763 | (doesn't exist) | News |
| 10764 | (doesn't exist) | Reality |
| 10765 | (doesn't exist) | Sci-Fi & Fantasy |
| 10766 | (doesn't exist) | Soap |
| 10767 | (doesn't exist) | Talk |
| 10768 | (doesn't exist) | War & Politics |
| 16 | Animation (movie) | Animation (TV) — same ID, same name |
| 35 | Comedy (movie) | Comedy (TV) — same ID, same name |
| 18 | Drama (movie) | Drama (TV) — same ID, same name |

The `MovieCard` component does `movie.genre_ids.slice(0, 2).map((id) => GENRES[id]).filter(Boolean)`. TV shows with TV-only genre IDs (10759, 10762, etc.) will silently produce no genre badges — `GENRES[10759]` is `undefined`, filtered out.

**How to avoid:**
Add TV genre IDs to `lib/constants.ts`:

```typescript
export const TV_GENRES: Record<number, string> = {
  10759: "Action & Adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
  16: "Animation",
  35: "Comedy",
  18: "Drama",
  80: "Crime",
  99: "Documentary",
  9648: "Mystery",
  10749: "Romance",
  37: "Western",
  14: "Fantasy",
  27: "Horror",
  36: "History",
  10751: "Family",
};

// Unified lookup — safe to use for both
export const ALL_GENRES: Record<number, string> = { ...GENRES, ...TV_GENRES };
```

Update `MovieCard` (or the future `MediaCard`) to use `ALL_GENRES` so TV-specific genre IDs render correctly.

**Warning signs:**
- TV show cards show no genre badges at all
- Genre filter on `/series` page shows no genre options for TV shows
- `displayGenres` array is always empty for TV items

**Phase to address:** Phase 1, task 2 (constants update) — before building any TV UI, add TV genre IDs to the lookup map.

---

### Pitfall 5: K-Drama / C-Drama Filter Reliability via TMDB Discover

**What goes wrong:**
TMDB's discover endpoint for TV (`/discover/tv`) supports `with_origin_country` and `with_original_language` parameters. Filtering K-Dramas uses `with_origin_country=KR&with_original_language=ko`. This works but has reliability issues:

1. **Coverage gap**: Many Korean co-productions list `origin_country: ["KR", "US"]` — they appear in KR-filtered results but users expecting pure Korean dramas may see Netflix originals that feel more Western.
2. **Language vs country mismatch**: Some Korean-language dramas are listed with `origin_country: ["KR"]` but `original_language: "zh"` (e.g., Chinese co-productions). Filtering on both narrows too aggressively.
3. **C-Drama filtering**: `with_origin_country=CN` is unreliable because many mainland Chinese productions are registered under Hong Kong (`HK`) or Taiwan (`TW`) for political/legal reasons on TMDB. A C-Drama filter using only `CN` will miss a significant portion of Chinese-language shows.
4. **No dedicated "K-Drama genre"**: TMDB has no official K-Drama genre ID. The filter is purely country+language, which includes Korean variety shows, documentaries, and news — not just dramas. You must combine `with_origin_country=KR&with_original_language=ko&with_genres=18` (Drama genre ID 18) to get drama-specific results, but this still includes Korean movies of the Drama genre if the endpoint is wrong.
5. **Result count volatility**: The `total_results` count for Korean drama filters can swing significantly between API calls because TMDB users continuously add/edit country metadata. Don't rely on `total_results` for progress tracking.

**How to avoid:**
- Always combine `with_origin_country` + `with_original_language` + `with_genres=18` for K-Drama/C-Drama filters
- For C-Drama, query three times: `CN`, `HK`, `TW` origin countries and deduplicate by ID, or use `with_original_language=zh` alone (broader but more reliable)
- Display as "Korean Drama" not "K-Drama from Korea" to set appropriate expectations
- Add a note in UI: "Results from TMDB community data — some shows may vary"
- Deduplicate results by `id` (same technique already in place for movies)

**Warning signs:**
- K-Drama filter returns Korean variety shows (Running Man, etc.)
- C-Drama filter returns very few results (missing HK/TW-registered shows)
- Same show appearing multiple times when union-querying multiple origin countries

**Phase to address:** Phase 3 (series browse filters) — implement the multi-country union query and deduplication when building the `/series` filter UI.

---

### Pitfall 6: Watch Provider Data Differences for TV vs Movies

**What goes wrong:**
The TMDB watch provider structure (`/tv/{id}?append_to_response=watch/providers`) returns the same `flatrate`/`rent`/`buy` shape — this part is shared. However:

1. **TV shows rarely have `buy` providers** — most streaming-native TV is flatrate only. The current modal logic picks `defaultTab` as the first non-empty tab (stream → rent → buy). For TV shows without buy/rent, this works fine. But the error case "Not available for streaming in your region" will trigger much more often for older/international TV shows — this is expected behavior, not a bug.
2. **Provider data for TV is per-series, not per-season** — TMDB aggregates providers at the series level, but availability can vary by season (e.g., only Seasons 1-3 on Netflix, Season 4 on Hulu). There is no per-season provider breakdown in the TMDB API. Users may follow the "Where to Watch" link and find the specific season they want is not available. This is a data limitation, not a bug, but users will blame the app.
3. **`append_to_response` for TV uses the same syntax** — `/tv/{id}?append_to_response=credits,watch/providers` works identically to the movie equivalent. The TV credits endpoint returns the same `cast` array structure but uses `aggregate_credits` for merged cast across seasons; `credits` returns only episode-level credits. Using `credits` (as the movie endpoint does) returns a narrower cast list for long-running TV shows.

**How to avoid:**
- Reuse the existing `WatchProvidersResponse` type — the structure is identical
- For cast: use `credits` (same as movies) for consistency, accept that long-running shows show partial cast
- Add UI copy: "Streaming availability shown for current season" to set expectations
- The `ProviderGrid` component can be reused as-is — no changes needed

**Warning signs:**
- TypeScript errors on `details["watch/providers"]` — won't happen if the type is declared correctly on the TV details type
- Users reporting wrong providers — this is a TMDB data quality issue, not a code bug

**Phase to address:** Phase 2 (TV detail modal) — mostly a copy of movie implementation, low risk here.

---

### Pitfall 7: `useMovieDetails` Hook and `/api/movies/[id]` Called for TV Shows

**What goes wrong:**
The current `MovieDetailModal` calls `useMovieDetails(movie?.id)` which hits `/api/movies/${id}`. If this component is naively reused for TV shows (by passing a TV show as the `movie` prop), it will call `/api/movies/1234` for a TV show with TMDB ID `1234`, which calls TMDB's `/movie/1234` endpoint — returning a completely different (movie) record, or a 404.

The `placeholderData` in `useMovieDetails` searches existing `MovieListResponse` caches for an item with matching `id`. If both a movie and a TV show with the same ID exist in cache, the placeholder shows wrong data.

**How to avoid:**
Route detail fetching based on `mediaType`. Options:

- **Option A (recommended):** Create `/api/tv/[id]` route and `useTVDetails(id)` hook separately. In `MediaDetailModal`, branch on `item.mediaType` to call the correct hook.
- **Option B:** Create a unified `/api/media/[type]/[id]` route that accepts `type=movie|tv` and delegates to the correct TMDB endpoint.

Do NOT add a `type` query param to the existing `/api/movies/[id]` route — that route's name implies movies and changes to it risk breaking existing movie functionality.

**Warning signs:**
- TV detail modal shows a completely different movie's data
- Console error: "TMDB API error: 404" when opening TV show details
- `details.title` is defined but wrong (it's a movie title for a different film)

**Phase to address:** Phase 2 (TV detail API route) — create `/api/tv/[id]` before building the detail modal.

---

### Pitfall 8: TanStack Query Key Namespace Collision

**What goes wrong:**
Current query keys use `["movies"]` as the root:

```typescript
export const movieKeys = {
  all: ["movies"] as const,
  details: (id: number) => [...movieKeys.all, "details", id] as const,
};
```

If TV series hooks are added carelessly under a similar root:

```typescript
// Bad — same "details" + numeric id structure
export const tvKeys = {
  all: ["tv"] as const,
  details: (id: number) => [...tvKeys.all, "details", id] as const,
};
```

This is actually fine because the root differs (`"movies"` vs `"tv"`). The real risk is if someone reuses `movieKeys.details(id)` to cache TV details — then `queryClient.getQueriesData({ queryKey: movieKeys.all })` in `useMovieDetails`'s `placeholderData` will find TV detail data and use it as a `MovieDetailsResponse`, causing type confusion and potentially wrong renders.

The `placeholderData` function in `useMovieDetails` (line 116-127 in `hooks/use-movies.ts`) casts found items as `unknown as MovieDetailsResponse` — this is already a type escape hatch. If TV show data ends up in the movies cache, it will be returned as placeholder data with `undefined` for `title`, causing the modal to briefly flash no title.

**How to avoid:**
- Use a separate `tvKeys` query key factory with `["tv"]` root — keep it isolated
- Never pass TV show data through movie-typed hooks
- The `placeholderData` casting is already unsafe (`as unknown as MovieDetailsResponse`) — for TV, create a separate `useTVDetails` hook with its own `tvKeys.details` and its own placeholder lookup scoped to TV list caches only

**Warning signs:**
- Detail modal briefly shows data from a different item before loading completes
- `queryClient.invalidateQueries({ queryKey: movieKeys.all })` accidentally invalidates TV queries (won't happen with separate roots, but check)

**Phase to address:** Phase 1, task 3 (query key architecture) — define `tvKeys` factory before writing any TV hooks.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Cast TV response as `Movie` type | Zero new types, reuses all components | Silent undefined for `title`/`release_date`, watchlist stores `undefined` | Never — causes data corruption in DB |
| Skip `mediaType` column in watchlist | No migration needed | ID collision breaks watchlist for any user who saves both a movie and TV show with same numeric TMDB ID | Never — will definitely occur at scale |
| Use movie genre map for TV | No new constants | TV-specific genre IDs (10759, 10765, etc.) silently show no genre badges | Never — invisible to developer, confusing to user |
| Reuse `/api/movies/[id]` for TV | No new route | Returns wrong TMDB entity; 404 for IDs that don't exist as movies | Never |
| Use `GENRES` only, not `ALL_GENRES` | One lookup map | TV genre badges always empty | Never |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| TMDB TV Discover | Using movie genre IDs (28, 18) in `with_genres` for TV discover — they partly overlap but TV has exclusive IDs | Use TMDB TV genre list endpoint (`/genre/tv/list`) to get the authoritative TV genre ID set |
| TMDB TV Credits | Using `credits` append for a 10-season show returns only the most recent episode credits | For full cast, use `aggregate_credits` append instead — same structure but covers all seasons |
| TMDB TV `episode_run_time` | Reading `episode_run_time[0]` assuming it's always set | Array can be empty `[]` — always guard: `episode_run_time?.[0] ?? null` |
| TMDB K-Drama filter | `with_origin_country=KR` alone returns all Korean content (variety, news, reality, docs) | Always add `with_genres=18` (Drama) and `with_original_language=ko` |
| Watchlist unique constraint | Current constraint `(userId, tmdbId)` will reject TV show if movie with same ID exists | Migration to `(userId, tmdbId, mediaType)` is required before first TV series can be saved |
| TMDB multi-search | `/search/multi` returns mixed movie and TV results in the same array with a `media_type` discriminator field | Must handle the discriminator to normalize each result — do not use for type-pure endpoints |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Union-querying three origin countries for C-Drama without deduplication | Same show appears 2-3 times in grid | Deduplicate by `id` using `Set` after merging pages (same pattern as existing infinite scroll dedup) | First page with C-Drama filter |
| Fetching `aggregate_credits` for all TV shows in a grid | 3× larger response per show, slows grid load | Only fetch `aggregate_credits` in detail modal — list view doesn't need credits | >10 TV show detail opens per session |
| Invalidating `["movies"]` and `["tv"]` separately after watchlist mutations | Two separate refetches, double network calls | Scope invalidation precisely to `watchlistKeys` only — never invalidate content caches on watchlist mutation | Every watchlist add/remove |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Skipping RLS for `media_type` column in watchlist | Users could read other users' TV show entries if RLS policy doesn't include `media_type` in WHERE clause | After migration, update `rls-policies.sql` to ensure the new column doesn't create a policy gap — existing `eq(watchlist.userId, userId)` in Drizzle actions already covers this |
| Exposing `/api/tv/[id]` without rate limiting | TMDB API key exhausted by unauthenticated enumeration | Apply the same `next: { revalidate: 300 }` ISR caching on the TV detail route as on movie routes |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing "Movie already in library" error when TV show ID collides with movie | User is confused — they've never added this movie | Fix schema first (Pitfall 2), then fix error message to "Already in library" (media-type-neutral) |
| Using "Watched" status for TV series | Ambiguous — did they finish the whole series or one episode? | For v0.3, keep the same binary watched/want-to-watch model with a note that it tracks the series, not individual episodes |
| Genre filter on `/series` page showing movie genre names (Action, not Action & Adventure) | Clicking "Action" on series page returns TV shows tagged as "Action & Adventure" (different ID) with no results | Use TV genre IDs on the `/series` page filter, not movie genre IDs |
| Runtime showing blank for TV shows | Users expect some episode information | Replace blank runtime with "Season X · N episodes" from `number_of_seasons` / `number_of_episodes` |
| "Director:" label in TV detail modal | TV shows have creators/showrunners, not directors | Show "Created by:" using `created_by` field from TV details response |

---

## "Looks Done But Isn't" Checklist

- [ ] **TV type normalization:** `MediaItem.title` is populated from `tv.name` — verify no TV card shows blank title
- [ ] **Watchlist schema:** `media_type` column exists and migration is applied — verify in Drizzle Studio that a movie ID `550` and TV show ID `550` can coexist for the same user
- [ ] **Genre badges on TV cards:** TV-specific genre IDs (10759 etc.) display labels — verify K-Drama show shows "Drama" or "Action & Adventure" badge, not blank
- [ ] **TV detail modal runtime row:** Shows "X Seasons · N Episodes" not blank — verify by opening a multi-season show detail
- [ ] **TV detail creator vs director:** Shows "Created by:" — verify by opening a show with known creator (Game of Thrones → "David Benioff")
- [ ] **K-Drama filter:** Returns actual dramas, not variety shows — verify Running Man does NOT appear in K-Drama filter results
- [ ] **Watchlist bookmark on TV card:** Reflects correct state for the TV show, not a movie with same ID — verify with ID collision test case
- [ ] **`/api/tv/[id]` route isolation:** Opening a TV show detail does not call `/api/movies/[id]` — verify in Network tab

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| `title`/`name` field mismatch already in production | HIGH | Backfill `title` column in watchlist for all TV entries; requires knowing which rows are TV (need `media_type`) — this is why schema migration must come first |
| Missing `mediaType` in watchlist schema after TV launch | HIGH | Migration to add column with default, backfill existing rows as "movie", update unique constraint (drops old, creates new) — requires downtime or careful zero-downtime migration |
| Genre badges empty for TV shows | LOW | Add `TV_GENRES` to constants, no schema change needed |
| K-Drama filter returning wrong content | LOW | Add `with_genres=18` to discover params, redeploy |
| TV detail calling wrong TMDB endpoint | MEDIUM | Create `/api/tv/[id]` route, update hook call site, invalidate cached wrong data |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Field name mismatch (`title`/`name`) | Phase 1 — Define `TVShow` + `MediaItem` types | TypeScript strict build passes with no `any` casts for TV data paths |
| TMDB ID collision in watchlist | Phase 1 — `mediaType` schema migration | Drizzle Studio: two entries with same `tmdbId` but different `mediaType` coexist for one user |
| `runtime` structure difference | Phase 2 — TV detail modal | Opening a TV series detail shows season/episode count, not blank or wrong runtime |
| TV genre ID namespace | Phase 1 — Constants update | K-Drama show card displays "Drama" genre badge |
| K-Drama filter reliability | Phase 3 — Series browse + filter UI | K-Drama filter excludes variety shows; C-Drama returns HK/TW shows too |
| Watch provider differences | Phase 2 — TV detail modal | TV show detail "Where to Watch" shows correct streaming services or "not available" message |
| `useMovieDetails` called for TV | Phase 2 — Create `useTVDetails` hook + `/api/tv/[id]` | Network tab shows `/api/tv/[id]` calls for TV shows, not `/api/movies/[id]` |
| TanStack Query key collision | Phase 1 — Define `tvKeys` factory | `queryClient.getQueriesData({ queryKey: ["movies"] })` does not return TV data |

---

## Sources

- Codebase analysis: `types/movie.ts`, `lib/tmdb.ts`, `lib/constants.ts`, `drizzle/schema.ts`, `components/movies/movie-card.tsx`, `components/movies/movie-detail-modal.tsx`, `hooks/use-movies.ts`, `app/api/movies/[id]/route.ts`, `actions/watchlist.ts` (read 2026-02-19)
- TMDB API v3 TV series schema — `id`, `name`, `original_name`, `first_air_date`, `episode_run_time`, `number_of_seasons`, `number_of_episodes`, `created_by`, `origin_country` field names: verified HIGH confidence (stable API, documented since TMDB v3 launch)
- TMDB genre ID namespaces — movie genres vs TV genres confirmed separate sets with partial overlap (IDs 16, 18, 35, 80, etc. shared; IDs 10759, 10762–10768 TV-exclusive): HIGH confidence
- TMDB ID namespace isolation (movie IDs and TV IDs are independent integer sequences, same integer can refer to different entities): HIGH confidence
- TMDB origin country filtering for K-Drama/C-Drama — `with_origin_country=KR`, `with_original_language=ko`, `CN`/`HK`/`TW` split: MEDIUM confidence (known behavior, but TMDB's data quality for origin country varies; validate with live API calls during Phase 3)
- Drizzle ORM unique constraint modification — drop old constraint, add new with extra column: HIGH confidence (standard PostgreSQL DDL, Drizzle migration workflow documented in `DRIZZLE_GUIDE.md`)

---

*Pitfalls research for: TV series discovery added to movie-only Next.js + TMDB app*
*Researched: 2026-02-19*

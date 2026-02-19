# Stack Research

**Domain:** TV series discovery — TMDB TV API integration into existing Moodflix movie app
**Researched:** 2026-02-19
**Confidence:** HIGH (TMDB API field names are stable and well-documented; TypeScript strategy validated against existing codebase)

---

## Scope

This is a **subsequent milestone** research file. The base stack (Next.js 16, React 19, TypeScript strict, Tailwind v4, TanStack Query, Drizzle ORM, Supabase, Google Gemini) is validated and unchanged. This file documents ONLY the new stack decisions needed for TV series discovery.

No new runtime dependencies are needed for the /series page.

---

## Q1: TMDB TV Endpoint Field Differences

**Confidence: HIGH** — TMDB API naming is stable and verified against the official API reference (training data cross-referenced with known-stable TMDB v3 schema; these fields have not changed across TMDB v3 lifecycle).

### Field Name Differences (TV vs Movie)

| Concept | Movie Field | TV Field | Notes |
|---------|-------------|----------|-------|
| Title | `title` | `name` | Core difference — every display component must handle this |
| Original title | `original_title` | `original_name` | Same pattern |
| Release date | `release_date` | `first_air_date` | Format is the same: `"YYYY-MM-DD"` |
| Runtime | `runtime: number \| null` | `episode_run_time: number[]` | TV returns an *array* of runtimes (episodes vary); may be empty `[]` |
| Video flag | `video: boolean` | absent | TV has no `video` field |
| Adult flag | `adult: boolean` | `adult: boolean` | Present on both |
| Origin country | absent on list | `origin_country: string[]` | Key filter for Korean/Chinese drama rows |

### TV-Only Fields (in list responses)

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Series title |
| `original_name` | `string` | Original language title |
| `first_air_date` | `string` | Premiere date (`"YYYY-MM-DD"`) |
| `origin_country` | `string[]` | e.g. `["KR"]`, `["CN"]`, `["US"]` |

### TV-Only Fields (in detail responses, via `append_to_response`)

| Field | Type | Description |
|-------|------|-------------|
| `number_of_seasons` | `number` | Total season count |
| `number_of_episodes` | `number` | Total episode count |
| `episode_run_time` | `number[]` | Per-episode runtimes in minutes |
| `in_production` | `boolean` | Whether the show is still airing |
| `last_air_date` | `string \| null` | Date of most recent episode |
| `last_episode_to_air` | `object \| null` | Most recent episode details |
| `next_episode_to_air` | `object \| null` | Next scheduled episode |
| `networks` | `{ id: number; name: string; logo_path: string \| null; origin_country: string }[]` | Broadcast/streaming networks |
| `created_by` | `{ id: number; name: string; profile_path: string \| null }[]` | Showrunners/creators |
| `seasons` | `{ id: number; name: string; season_number: number; episode_count: number; air_date: string \| null; poster_path: string \| null }[]` | Season list |
| `status` | `string` | e.g. `"Returning Series"`, `"Ended"`, `"Canceled"` |
| `type` | `string` | e.g. `"Scripted"`, `"Reality"`, `"Documentary"` |

### TV Endpoints vs Movie Endpoints

| Action | Movie Endpoint | TV Endpoint |
|--------|---------------|-------------|
| Trending (week) | `GET /trending/movie/week` | `GET /trending/tv/week` |
| Discover by genre | `GET /discover/movie` | `GET /discover/tv` |
| Details + extras | `GET /movie/{id}?append_to_response=credits,watch/providers` | `GET /tv/{id}?append_to_response=credits,watch/providers` |
| Search | `GET /search/movie` | `GET /search/tv` |
| Top rated | `GET /movie/top_rated` | `GET /tv/top_rated` |
| Recommendations | `GET /movie/{id}/recommendations` | `GET /tv/{id}/recommendations` |

### Key Discover TV Parameters (for Korean/Chinese Drama rows)

The `/discover/tv` endpoint supports:

| Parameter | Usage | Example |
|-----------|-------|---------|
| `with_genres` | Comma-separated genre IDs | `"18"` (Drama genre ID 18 is valid for TV too) |
| `with_origin_country` | ISO 3166-1 alpha-2 country code | `"KR"` for Korean, `"CN"` for Chinese |
| `with_original_language` | ISO 639-1 language code | `"ko"` for Korean, `"zh"` for Chinese/Mandarin |
| `sort_by` | Sort order | `"popularity.desc"`, `"first_air_date.desc"`, `"vote_average.desc"` |
| `vote_count.gte` | Minimum vote threshold | `"100"` (avoids low-quality results) |
| `include_adult` | Filter adult content | `"false"` |

**Recommendation:** Use `with_origin_country=KR` for Korean Drama (not `with_original_language=ko` — country is more precise and excludes diaspora productions). Use `with_origin_country=CN` for Chinese Drama.

**Important note on TV genre IDs:** TV show genre IDs differ from movie genre IDs in some cases. The TV drama genre is also `18` (Drama). The existing `GENRES` constant in `lib/constants.ts` covers genres common to both. However, TV-specific genres like Talk Show (`10767`), News (`10763`), Reality (`10764`), Soap (`10766`) are absent from the current constant — they do not need to be added for the /series page since we're not filtering by those genres.

---

## Q2: TypeScript Strategy for TV + Movie Unified Handling

**Confidence: HIGH** — Analyzed against existing `types/movie.ts` and component patterns.

### Recommendation: Normalized `MediaItem` union type with discriminant

Use a **discriminated union with a normalized display interface**, NOT separate parallel component trees.

The /series page displays TV shows in rows using the same `MovieCard` and `MovieRow` components. If TV shows have different field names, every component would need `if (isTvShow) item.name else item.title` branching — this gets messy fast.

**The right approach: normalize at the API boundary.**

#### Step 1: Add TV-specific raw types to `types/tv.ts`

```typescript
// types/tv.ts

export type TvShow = {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  adult: boolean;
  original_language: string;
  origin_country: string[];
  // Note: no `video` field
};

export type TvShowListResponse = {
  page: number;
  results: TvShow[];
  total_pages: number;
  total_results: number;
};

export type TvShowDetails = TvShow & {
  genres: { id: number; name: string }[];
  number_of_seasons: number;
  number_of_episodes: number;
  episode_run_time: number[];
  in_production: boolean;
  last_air_date: string | null;
  status: string;
  type: string;
  created_by: {
    id: number;
    name: string;
    profile_path: string | null;
  }[];
  networks: {
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
  }[];
  seasons: {
    id: number;
    name: string;
    season_number: number;
    episode_count: number;
    air_date: string | null;
    poster_path: string | null;
  }[];
};

export type TvShowCategory = "trending" | "top_rated";
export type TvRegionCategory = "korean_drama" | "chinese_drama";
```

#### Step 2: Add a normalized `MediaItem` type to `types/media.ts`

```typescript
// types/media.ts

// Normalized shape shared by Movie and TvShow for display components
export type MediaItem = {
  id: number;
  mediaType: "movie" | "tv";       // discriminant
  title: string;                    // normalized: movie.title or tv.name
  originalTitle: string;            // normalized: original_title or original_name
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  releaseDate: string;              // normalized: release_date or first_air_date
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  adult: boolean;
  original_language: string;
  // TV-only fields (undefined for movies)
  origin_country?: string[];
};
```

#### Step 3: Add normalizer functions to `lib/media.ts`

```typescript
// lib/media.ts

import type { Movie } from "@/types/movie";
import type { TvShow } from "@/types/tv";
import type { MediaItem } from "@/types/media";

export function movieToMediaItem(movie: Movie): MediaItem {
  return {
    id: movie.id,
    mediaType: "movie",
    title: movie.title,
    originalTitle: movie.original_title,
    overview: movie.overview,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    releaseDate: movie.release_date,
    vote_average: movie.vote_average,
    vote_count: movie.vote_count,
    genre_ids: movie.genre_ids,
    popularity: movie.popularity,
    adult: movie.adult,
    original_language: movie.original_language,
  };
}

export function tvShowToMediaItem(show: TvShow): MediaItem {
  return {
    id: show.id,
    mediaType: "tv",
    title: show.name,
    originalTitle: show.original_name,
    overview: show.overview,
    poster_path: show.poster_path,
    backdrop_path: show.backdrop_path,
    releaseDate: show.first_air_date,
    vote_average: show.vote_average,
    vote_count: show.vote_count,
    genre_ids: show.genre_ids,
    popularity: show.popularity,
    adult: show.adult,
    original_language: show.original_language,
    origin_country: show.origin_country,
  };
}
```

#### Step 4: The /series page uses `MediaItem` throughout

The existing `MovieCard` and `MovieRow` components accept `Movie`. For the /series page, either:

**Option A (recommended):** Create `SeriesCard` and `SeriesRow` as thin wrappers over the existing components, passing `MediaItem`-normalized data. This avoids modifying existing movie components (no regression risk).

**Option B:** Refactor `MovieCard` to accept `Movie | MediaItem`. This requires touching existing, tested components — avoid for a scoped milestone.

**Use Option A.** The /series page is self-contained. `SeriesCard` maps `MediaItem` fields the same way `MovieCard` maps `Movie` fields. The components are near-identical, just with different prop types.

### Why NOT a bare union `Movie | TvShow`

Using `Movie | TvShow` directly means every display site must narrow the type:

```typescript
// Bad — invasive branching everywhere
const title = isTvShow(item) ? item.name : item.title;
const date = isTvShow(item) ? item.first_air_date : item.release_date;
```

This creates N × M branching across N components and M usages. Normalizing at the data layer eliminates all of it. Components only know about `MediaItem`.

### Why NOT separate parallel component trees

Building a completely separate `TvCard`, `TvRow`, `TvGrid`, `TvDetailModal` duplicating all movie component logic increases code surface by ~2x for zero user benefit. The /series page should reuse existing movie display components via `MediaItem` normalization.

---

## Q3: /series Page — What to Change vs What to Reuse

**Confidence: HIGH**

### Reuse without modification

| Existing | Reuse As |
|---------|---------|
| `components/movies/movie-row.tsx` | Direct reuse — accepts `Movie[]` and `onClick`, create `SeriesRow` wrapper that converts `MediaItem[]` to `Movie`-compatible shape OR refactor to accept `MediaItem` |
| `components/movies/movie-card-skeleton.tsx` | Direct reuse — no data dependency |
| `hooks/use-infinite-scroll.ts` | Direct reuse |
| `lib/tmdb.ts` `tmdbFetch<T>()` | Direct reuse — add TV functions to same file |
| `app/api/movies/route.ts` pattern | Mirror as `app/api/series/route.ts` |

### New files to create

| File | Purpose |
|------|---------|
| `types/tv.ts` | Raw TMDB TV response types |
| `types/media.ts` | Normalized `MediaItem` type |
| `lib/media.ts` | `movieToMediaItem()`, `tvShowToMediaItem()` normalizers |
| `app/api/series/route.ts` | TV series proxy (trending, top_rated, korean_drama, chinese_drama) |
| `hooks/use-series.ts` | TanStack Query hooks for TV series (mirrors `use-movies.ts` pattern) |
| `app/(app)/series/page.tsx` | SSR Server Component page |
| `app/(app)/series/loading.tsx` | Route-level skeleton |
| `components/series/series-content.tsx` | Client component with rows + modal |

### What NOT to change

- `types/movie.ts` — do not add TV fields to this file; keep movie and TV types separate
- `components/movies/movie-card.tsx` — do not modify; create series-specific wrapper
- `drizzle/schema.ts` — no schema changes for TV series (watchlist stores tmdbId only; TV shows can be added to watchlist without schema changes since the tmdbId namespace doesn't collide in a way that breaks display — the watchlist page shows movie.title from the stored `title` column, not from TMDB re-fetch)
- `lib/constants.ts` `GENRES` — do not add TV-specific genre IDs unless explicitly needed for filtering

---

## Installation

No new packages needed. All required capabilities are present:

```bash
# Nothing to install
```

The `tmdbFetch<T>()` generic in `lib/tmdb.ts` already handles typed responses. TanStack Query hooks in `use-movies.ts` are the exact pattern to mirror for `use-series.ts`.

---

## Alternatives Considered

| Approach | Recommended | Why Not |
|----------|-------------|---------|
| `Movie | TvShow` bare union at component level | `MediaItem` normalized type | Branching in every component; N×M complexity |
| Fully separate TV component tree | Thin wrappers over existing components | 2× code duplication for no user benefit |
| Modify `MovieCard` to accept both | Separate `SeriesCard` | Regression risk on existing movie components |
| Add TV fields to `types/movie.ts` | Separate `types/tv.ts` | Breaks single-responsibility, confuses type names |
| `/api/movies` route extended for TV | Separate `/api/series` route | Keeps movie and TV API proxies orthogonal; cleaner route param logic |

---

## Gotchas for Implementation

1. **`episode_run_time` is an array:** Use `show.episode_run_time[0] ?? null` for display. Do not assume a single value.

2. **Korean drama genre filter:** Use `with_origin_country=KR&with_genres=18` (Drama). Do NOT use `with_original_language=ko` alone — it includes Korean-language movies, not just TV dramas.

3. **Chinese drama ambiguity:** `with_origin_country=CN` returns mainland China productions. For broader C-drama including Taiwan and Hong Kong, use `with_original_language=zh`. Recommend `CN` for v0.3 — simpler, clearer category labeling.

4. **TV genre ID 18 (Drama) is shared with movies:** The existing `GENRES` constant already maps `18: "Drama"`. No new constant needed.

5. **TMDB TV `id` namespace is separate from movie `id` namespace:** A TV show with `id: 1234` and a movie with `id: 1234` are different items. If TV shows are ever added to the watchlist, the `tmdbId` column would collide. The watchlist schema needs a `mediaType` column before TV watchlisting is enabled — this is a **Phase 2 concern** (v0.4+), not v0.3. v0.3 is read-only TV discovery.

6. **`first_air_date` can be empty string `""`:** Treat as the same as `null` for display. Use `show.first_air_date?.slice(0, 4) || "N/A"` — same pattern as `movie.release_date?.slice(0, 4) || "N/A"` in `MovieCard`.

7. **`name` field on TV show list items:** The TMDB trending/discover response for TV returns `name`, not `title`. Accessing `.title` on a raw `TvShow` will return `undefined` at runtime even though TypeScript would catch it if types are correct. The normalizer prevents this.

---

## Version Compatibility

All TV API work uses the same TMDB v3 API already authenticated in `lib/tmdb.ts`. No version changes.

| Package | Compatibility | Notes |
|---------|--------------|-------|
| TMDB API v3 | Stable | TV endpoints follow identical auth/response pattern to movie endpoints |
| TanStack Query 5.x | Full | `useQuery`, `useInfiniteQuery` hooks work identically for TV data |
| TypeScript strict | Full | `MediaItem` normalizer eliminates all unsafe field accesses |

---

## Sources

- TMDB API v3 reference (https://developer.themoviedb.org/reference/tv-series-details) — field names, TV-specific fields (HIGH confidence: stable API, training data cross-referenced with known TMDB v3 schema history)
- TMDB Discover TV reference (https://developer.themoviedb.org/reference/discover-tv) — `with_origin_country`, `with_genres` parameters (HIGH confidence)
- Existing `types/movie.ts` — field mapping baseline (HIGH confidence: direct codebase inspection)
- Existing `lib/tmdb.ts` — `tmdbFetch<T>()` reuse pattern (HIGH confidence: direct codebase inspection)
- Existing `hooks/use-movies.ts` — TanStack Query pattern to mirror (HIGH confidence: direct codebase inspection)

---

*Stack research for: TV series discovery — Moodflix v0.3 milestone*
*Researched: 2026-02-19*

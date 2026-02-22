# Phase 4: TV Series Data Layer - Research

**Researched:** 2026-02-22
**Domain:** TMDB TV API, TypeScript type modeling, TanStack Query data normalization
**Confidence:** HIGH

---

## Summary

Phase 4 builds the complete data plumbing for TV series: raw TMDB types, a `normalizeTVShow()` function that maps TV fields to the existing `Movie` contract, TMDB fetch functions, Next.js proxy API routes (`/api/tv` and `/api/tv/[id]`), TanStack Query hooks, and `TV_GENRES` constants. No schema changes are needed — TV shows are read-only discovery in v0.3.

The core challenge is the field name divergence between TMDB's movie and TV responses. Movies use `title` / `release_date`; TV shows use `name` / `first_air_date`. The normalization function must bridge these differences at the hook boundary (inside `queryFn`) so all downstream components — `MovieCard`, `MovieRow`, `MovieDetailModal` — continue consuming the `Movie` type without modification.

The existing `lib/tmdb.ts` pattern (`tmdbFetch<T>`) and `app/api/movies/route.ts` proxy pattern are clean templates. The TV routes follow an identical structure with different endpoints and a `TVCategory` union type. The `app/api/tv/[id]/route.ts` route extracts watch providers per-country exactly as the movies variant does.

**Primary recommendation:** Mirror the existing movie data layer exactly. Same file layout, same TanStack Query patterns, same proxy route structure — just with TV-specific endpoints and a normalization shim at the hook boundary.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TV-01 (data layer only) | TV Series Discovery Page — data infrastructure only: types, constants, TMDB fetch functions, proxy routes, TanStack Query hooks | TMDB TV API field names verified; normalization pattern confirmed; route structure from existing movie layer directly applicable; TV_GENRES IDs confirmed from TMDB genre/tv/list |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TanStack Query | ^5.90.20 | Client-side data fetching, caching, deduplication | Already in use; hooks/use-movies.ts is the reference implementation |
| Next.js App Router | 16.1.6 | API proxy routes (server-side TMDB calls) | Already in use; prevents TMDB key exposure |
| TypeScript | ^5 | Zero-`any` types | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lib/country.ts` | project | Extract user country from Vercel headers | Used in `/api/tv/[id]` for regional watch providers |
| `lib/tmdb.ts` | project | `tmdbFetch<T>` utility | All TMDB server-side calls go through this |

### No New Dependencies

This phase requires zero new npm packages. All functionality is built on existing infrastructure.

**Installation:**
```bash
# No new packages needed
```

---

## Architecture Patterns

### Recommended Project Structure
```
types/
  tv.ts                    # TVShow, TVDetails, TVDetailsResponse, normalizeTVShow()
lib/
  constants.ts             # TV_GENRES added here (existing file)
  tmdb.ts                  # TV fetch functions added here (existing file)
app/api/
  tv/
    route.ts               # Proxy: trending, top_rated, korean_drama, chinese_drama
    [id]/
      route.ts             # Proxy: TV show details + credits + watch/providers
hooks/
  use-tv.ts                # useTrendingTV, useTopRatedTV, useKoreanDramas, useChineseDramas
```

### Pattern 1: TMDB TV Field Normalization

**What:** TMDB TV list results use `name` and `first_air_date` instead of `title` and `release_date`. `normalizeTVShow()` maps these to the `Movie` contract so all existing UI components work without modification.

**When to use:** Called inside every TanStack Query `queryFn` that processes TV list results. NOT called at the API route level — the route returns raw TMDB data, normalization happens at the hook boundary.

**Example:**
```typescript
// types/tv.ts
import type { Movie } from "@/types/movie";

export type TVShow = {
  id: number;
  name: string;                  // TV-specific (maps to title)
  original_name: string;
  first_air_date: string;        // TV-specific (maps to release_date)
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  adult: boolean;
  original_language: string;
  origin_country: string[];      // TV-specific (array, not single)
};

export type TVListResponse = {
  page: number;
  results: TVShow[];
  total_pages: number;
  total_results: number;
};

export type TVCreatedBy = {
  id: number;
  credit_id: string;
  name: string;
  gender: number;
  profile_path: string | null;
};

export type TVNetwork = {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
};

export type TVDetails = {
  id: number;
  name: string;
  original_name: string;
  first_air_date: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  genres: { id: number; name: string }[];
  popularity: number;
  adult: boolean;
  original_language: string;
  origin_country: string[];
  status: string;                       // "Returning Series" | "Ended" | "Cancelled" | "In Production" | "Planned" | "Pilot"
  tagline: string | null;
  number_of_seasons: number;
  number_of_episodes: number;
  episode_run_time: number[];
  created_by: TVCreatedBy[];
  networks: TVNetwork[];
};

export type TVDetailsWithExtras = TVDetails & {
  credits: import("@/types/movie").MovieCredits;     // Same structure as movies
  "watch/providers": import("@/types/movie").WatchProvidersResponse; // Same structure
};

export type TVDetailsResponse = TVDetailsWithExtras & {
  watchProviders: import("@/types/movie").WatchProviderResult | null;
  watchCountry: string;
  mediaType: "tv";                                   // Discriminant for modal
};

// Normalization: maps TV fields to Movie contract
export function normalizeTVShow(tv: TVShow): Movie {
  return {
    id: tv.id,
    title: tv.name,                        // name → title
    original_title: tv.original_name,
    overview: tv.overview,
    poster_path: tv.poster_path,
    backdrop_path: tv.backdrop_path,
    release_date: tv.first_air_date,       // first_air_date → release_date
    vote_average: tv.vote_average,
    vote_count: tv.vote_count,
    genre_ids: tv.genre_ids,
    popularity: tv.popularity,
    adult: tv.adult,
    original_language: tv.original_language,
    video: false,                          // TV has no video field; default false
  };
}
```

### Pattern 2: TV Proxy Routes — Mirror Movie Routes

**What:** `/api/tv/route.ts` dispatches by `category` param. `/api/tv/[id]/route.ts` fetches full TV details + appended credits/watch providers, extracts regional providers.

**Example:**
```typescript
// app/api/tv/route.ts
import { NextRequest } from "next/server";
import {
  getTrendingTV,
  getTopRatedTV,
  discoverKoreanDramas,
  discoverChineseDramas,
} from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category");
    const page = Number(searchParams.get("page") ?? "1");

    switch (category) {
      case "trending":
        return Response.json(await getTrendingTV(page));
      case "top_rated":
        return Response.json(await getTopRatedTV(page));
      case "korean_drama":
        return Response.json(await discoverKoreanDramas(page));
      case "chinese_drama":
        return Response.json(await discoverChineseDramas(page));
      default:
        return Response.json({ error: "Provide valid 'category' parameter" }, { status: 400 });
    }
  } catch {
    return Response.json({ error: "Failed to fetch TV shows" }, { status: 500 });
  }
}
```

```typescript
// app/api/tv/[id]/route.ts — mirror of app/api/movies/[id]/route.ts
import { NextRequest } from "next/server";
import { getTVDetails } from "@/lib/tmdb";
import { getCountryFromHeaders } from "@/lib/country";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const tvId = Number(id);
    if (Number.isNaN(tvId)) {
      return Response.json({ error: "Invalid TV show ID" }, { status: 400 });
    }

    const country = getCountryFromHeaders(request.headers);
    const details = await getTVDetails(tvId);
    const providers = details["watch/providers"]?.results?.[country] || null;

    return Response.json({
      ...details,
      watchProviders: providers,
      watchCountry: country,
      mediaType: "tv",                    // Discriminant for modal
    });
  } catch {
    return Response.json({ error: "Failed to fetch TV details" }, { status: 500 });
  }
}
```

### Pattern 3: TMDB Fetch Functions for TV

**What:** Four new functions in `lib/tmdb.ts` for TV fetching. Trending TV uses `/trending/tv/week`, top rated uses `/tv/top_rated`, dramas use `/discover/tv` with country/language filters.

**Example:**
```typescript
// Additions to lib/tmdb.ts
import type { TVListResponse, TVDetailsWithExtras } from "@/types/tv";

export async function getTrendingTV(page = 1) {
  return tmdbFetch<TVListResponse>("/trending/tv/week", {
    page: String(page),
  });
}

export async function getTopRatedTV(page = 1) {
  return tmdbFetch<TVListResponse>("/tv/top_rated", {
    page: String(page),
  });
}

export async function discoverKoreanDramas(page = 1) {
  return tmdbFetch<TVListResponse>("/discover/tv", {
    with_origin_country: "KR",
    with_genres: "18",
    with_original_language: "ko",
    sort_by: "popularity.desc",
    page: String(page),
  });
}

export async function discoverChineseDramas(page = 1) {
  return tmdbFetch<TVListResponse>("/discover/tv", {
    with_origin_country: "CN",
    with_genres: "18",
    sort_by: "popularity.desc",
    page: String(page),
  });
}

export async function getTVDetails(id: number) {
  return tmdbFetch<TVDetailsWithExtras>(`/tv/${id}`, {
    append_to_response: "credits,watch/providers",
  });
}
```

### Pattern 4: TanStack Query Hooks for TV

**What:** `hooks/use-tv.ts` mirrors `hooks/use-movies.ts`. Normalization via `normalizeTVShow()` inside `queryFn` so return type is `Movie[]`.

**Example:**
```typescript
// hooks/use-tv.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import type { Movie } from "@/types/movie";
import type { TVListResponse, TVDetailsResponse } from "@/types/tv";
import { normalizeTVShow } from "@/types/tv";

export const tvKeys = {
  all: ["tv"] as const,
  category: (cat: TVCategory) => [...tvKeys.all, "category", cat] as const,
  details: (id: number) => [...tvKeys.all, "details", id] as const,
};

export type TVCategory = "trending" | "top_rated" | "korean_drama" | "chinese_drama";

async function fetchTVCategory(category: TVCategory): Promise<Movie[]> {
  const res = await fetch(`/api/tv?category=${category}`);
  if (!res.ok) throw new Error("Failed to fetch TV shows");
  const data: TVListResponse = await res.json();
  return data.results.map(normalizeTVShow);        // Normalize at hook boundary
}

export function useTrendingTV() {
  return useQuery({
    queryKey: tvKeys.category("trending"),
    queryFn: () => fetchTVCategory("trending"),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useTopRatedTV() {
  return useQuery({
    queryKey: tvKeys.category("top_rated"),
    queryFn: () => fetchTVCategory("top_rated"),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

export function useKoreanDramas() {
  return useQuery({
    queryKey: tvKeys.category("korean_drama"),
    queryFn: () => fetchTVCategory("korean_drama"),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useChineseDramas() {
  return useQuery({
    queryKey: tvKeys.category("chinese_drama"),
    queryFn: () => fetchTVCategory("chinese_drama"),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

async function fetchTVDetails(id: number): Promise<TVDetailsResponse> {
  const res = await fetch(`/api/tv/${id}`);
  if (!res.ok) throw new Error("Failed to fetch TV details");
  return res.json();
}

export function useTVDetails(id: number | null) {
  return useQuery({
    queryKey: tvKeys.details(id!),
    queryFn: () => fetchTVDetails(id!),
    enabled: id !== null,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
```

### Pattern 5: TV_GENRES Constant

**What:** Add `TV_GENRES` to `lib/constants.ts` covering TV-exclusive genre IDs. Shared genre IDs (18 Drama, 16 Animation, etc.) already exist in `GENRES`; `TV_GENRES` adds only the TV-specific ones.

**Example:**
```typescript
// Addition to lib/constants.ts
export const TV_GENRES: Record<number, string> = {
  10759: "Action & Adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
};
```

Note: Genre IDs 16, 18, 35, 80, 99, 10751, 9648, 37 are shared between movies and TV and already exist in `GENRES`. The planner may choose to keep them separate (TV_GENRES = TV-only IDs) or include all TV genre IDs in `TV_GENRES` for completeness. The success criterion says "covering TV-specific genre IDs (10759, 10762–10768)" so the TV-exclusive set is the minimum requirement.

### Anti-Patterns to Avoid

- **Normalizing at the API route level**: Do not call `normalizeTVShow()` in `app/api/tv/route.ts`. The route returns raw TMDB data. Normalization is a client concern (hooks).
- **Adding `mediaType` to the `Movie` type**: The `Movie` type must remain clean. `mediaType: "tv"` belongs only on `TVDetailsResponse` as a discriminant for the modal.
- **Creating a separate TV detail modal component**: Per prior decisions, the `movie-detail-modal.tsx` is extended with a `mediaType` prop. Phase 4 (data layer only) should not touch UI. Document the `mediaType` prop requirement as a contract for Phase 5.
- **Using `?type=tv` param on `/api/movies`**: Per prior decision, TV uses a separate `/api/tv/` route triplet.
- **Hand-rolling deduplication inside hooks**: TanStack Query deduplicates at the cache key level. For list hooks that might be paginated later, only deduplicate if needed (the success criteria don't require infinite scroll for TV in Phase 4).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TV field mapping | Custom transformer component | `normalizeTVShow()` pure function in `types/tv.ts` | Single source of truth; testable; pure |
| Country detection | Geolocation lookup | `getCountryFromHeaders()` from `lib/country.ts` | Already handles Vercel's `x-vercel-ip-country` |
| Request caching | Custom TTL map | TanStack Query `staleTime`/`gcTime` | Handles network race conditions, deduplication |
| TMDB error handling | Custom retry logic | `tmdbFetch<T>` with `response.ok` check | Consistent with existing pattern |

---

## Common Pitfalls

### Pitfall 1: `video` field missing from TVShow
**What goes wrong:** `Movie` type requires `video: boolean`. TMDB TV list responses do not include a `video` field. `normalizeTVShow()` will fail TypeScript's strict check if `video` is not explicitly set.
**Why it happens:** The `Movie` type was designed for movies; `video` is a movie-only concept.
**How to avoid:** In `normalizeTVShow()`, hardcode `video: false` for all TV shows. This is semantically correct (TV shows are not movie trailers).
**Warning signs:** TypeScript error "Property 'video' is missing in type..." on the return of `normalizeTVShow()`.

### Pitfall 2: `first_air_date` can be empty string
**What goes wrong:** Some TMDB TV shows have `first_air_date: ""` (in-production shows). `release_date?.slice(0, 4)` in `MovieCard` returns an empty string, showing "N/A" — this is acceptable. But filtering or sorting by date downstream may break.
**Why it happens:** TMDB returns empty string rather than null for unknown dates.
**How to avoid:** In `normalizeTVShow()`, preserve the empty string as-is. The success criterion states "no `undefined` release_date values" — empty string satisfies this. Add a note in the type: `release_date: string // may be empty ""`.

### Pitfall 3: `TVDetailsResponse` vs `MovieDetailsResponse` in `useTVDetails`
**What goes wrong:** The detail modal currently imports `useMovieDetails` which returns `MovieDetailsResponse`. If TV details are fetched via a separate `useTVDetails` hook that returns `TVDetailsResponse`, the modal needs to accept both types. Phase 4 creates the hook; Phase 5 extends the modal. Designing `TVDetailsResponse` poorly now breaks Phase 5.
**Why it happens:** Type design decisions in Phase 4 have downstream effects on Phase 5 UI.
**How to avoid:** Add `mediaType: "tv"` to `TVDetailsResponse` as a discriminant field. Document that Phase 5 will use this discriminant to conditionally render TV-specific fields (seasons, episodes, created_by) in the modal.

### Pitfall 4: `append_to_response` with `credits,watch/providers` on TV endpoint
**What goes wrong:** Assumes the same `append_to_response` syntax that works for `/movie/{id}` also works for `/tv/{id}`.
**Why it happens:** Not always documented explicitly.
**How to avoid:** The TMDB documentation confirms "TV show detail methods all support `append_to_response`". The syntax `credits,watch/providers` is identical. Both `credits` and `watch/providers` are valid appends for TV series. Confidence: MEDIUM (confirmed by official TMDB docs quote, community verification, and multiple wrapper library implementations).

### Pitfall 5: Korean Drama filter — `with_original_language` vs `with_spoken_languages`
**What goes wrong:** Using the wrong parameter to filter by language. `with_spoken_languages` filters by audio language in the show; `with_original_language` filters by the original production language.
**Why it happens:** TMDB has multiple language-related discover parameters with subtle differences.
**How to avoid:** Per the requirement: `with_origin_country=KR&with_genres=18&with_original_language=ko`. This is specified in TV-01 and matches TMDB discover API parameters. Use exactly these parameters.

### Pitfall 6: `TVListResponse` vs `TVDetailsWithExtras` — don't conflate
**What goes wrong:** Trying to use `TVDetailsWithExtras` as the list response type. List results don't have `credits`, `genres` (object array), or `created_by`.
**Why it happens:** Movie types have the same issue: `Movie` (list) vs `MovieDetails` (detail). TV mirrors this.
**How to avoid:** Keep `TVShow` (list item) and `TVDetails` (full detail) as separate types. The detail endpoint returns `TVDetailsWithExtras` (raw TMDB with appended data) which is then shaped into `TVDetailsResponse` at the proxy route level.

---

## Code Examples

Verified patterns from codebase and official sources:

### Existing `tmdbFetch<T>` utility (use this directly)
```typescript
// lib/tmdb.ts (existing)
async function tmdbFetch<T>(
  endpoint: string,
  params?: Record<string, string>,
): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.set(key, value),
    );
  }
  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_API_READ_KEY}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: 300 },
  });
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}
```

### TMDB TV Endpoint Paths (verified)
```
GET /trending/tv/week             → trending TV (weekly)
GET /tv/top_rated                 → top rated TV
GET /tv/popular                   → popular TV (not needed for Phase 4, but available)
GET /discover/tv                  → discover with filters
GET /tv/{id}?append_to_response=credits,watch/providers → TV details
```

### Discover TV parameters for regional drama rows
```
Korean Drama: with_origin_country=KR, with_genres=18, with_original_language=ko, sort_by=popularity.desc
Chinese Drama: with_origin_country=CN, with_genres=18, sort_by=popularity.desc
```

### TMDB TV Genre IDs (verified from TMDB /genre/tv/list endpoint)
```
10759: "Action & Adventure"  (TV-only)
16:    "Animation"           (shared with movies)
35:    "Comedy"              (shared)
80:    "Crime"               (shared)
99:    "Documentary"         (shared)
18:    "Drama"               (shared)
10751: "Family"              (shared)
10762: "Kids"                (TV-only)
9648:  "Mystery"             (shared)
10763: "News"                (TV-only)
10764: "Reality"             (TV-only)
10765: "Sci-Fi & Fantasy"    (TV-only)
10766: "Soap"                (TV-only)
10767: "Talk"                (TV-only)
10768: "War & Politics"      (TV-only)
37:    "Western"             (shared)
```
TV-specific IDs (not in existing GENRES): 10759, 10762, 10763, 10764, 10765, 10766, 10767, 10768

### TMDB TV Status Values (verified from community + TypeScript wrappers)
```
"Returning Series"   → ongoing, more seasons expected
"Ended"              → concluded naturally
"Cancelled"          → cancelled before completion
"In Production"      → filming, not yet aired
"Planned"            → announced, not yet in production
"Pilot"              → pilot stage
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| Separate movie/TV types with full duplication | Shared `Movie` type with `normalizeTVShow()` shim | v0.3 decision: normalize at hook boundary |
| Forking `movie-detail-modal.tsx` for TV | Adding `mediaType` prop to existing modal | v0.3 prior decision — Phase 5 concern |
| Schema changes for `media_type` column | No DB changes in v0.3 | Deferred to v0.4 per roadmap |
| TanStack Query v4 (`QueryObserver`) | TanStack Query v5 (`useQuery`, `staleTime`, `gcTime`) | Project already on v5.90.20 |

---

## Open Questions

1. **Should `TV_GENRES` include shared genre IDs (18 Drama, etc.) or only TV-exclusive ones?**
   - What we know: Success criterion says "covering TV-specific genre IDs (10759, 10762–10768)". The `GENRES` constant already covers shared IDs.
   - What's unclear: Whether the `/series` page genre filter (Phase 5) will need a combined list or just TV-exclusive IDs.
   - Recommendation: Export `TV_GENRES` with TV-exclusive IDs only (10759, 10762–10768). Phase 5 can spread both if needed: `{ ...GENRES, ...TV_GENRES }`.

2. **Does `useTVDetails` return `TVDetailsResponse` or a normalized `Movie`-compatible shape?**
   - What we know: The TV detail modal needs TV-specific fields (seasons, episodes, created_by). These cannot be in the `Movie` type.
   - What's unclear: The exact prop type the extended `MovieDetailModal` will accept.
   - Recommendation: `useTVDetails` returns `TVDetailsResponse` (raw TV shape + watchProviders + watchCountry + mediaType). Phase 5 designs the modal prop union. Phase 4 just exports the hook and type.

3. **Pagination for drama rows (Phase 5 consideration)?**
   - What we know: Success criterion for Phase 4 hooks returns `Movie[]`, not paginated. `useKoreanDramas` and `useChineseDramas` return first page only.
   - What's unclear: Phase 5 may want infinite scroll on drama rows.
   - Recommendation: Implement hooks as simple `useQuery` (not `useInfiniteQuery`) for Phase 4. If Phase 5 needs infinite scroll, it can convert them.

---

## Sources

### Primary (HIGH confidence)
- Official TMDB API docs (`developer.themoviedb.org/reference/tv-series-popular-list`) — field names for TV list results confirmed: `name`, `first_air_date`, `origin_country`
- Official TMDB docs (`developer.themoviedb.org/docs/append-to-response`) — quote: "The movie, TV show, TV season, TV episode and person detail methods all support a query parameter called `append_to_response`"
- Existing codebase (`lib/tmdb.ts`, `hooks/use-movies.ts`, `app/api/movies/route.ts`, `app/api/movies/[id]/route.ts`) — reference implementation patterns

### Secondary (MEDIUM confidence)
- TMDB community + WebSearch — TV genre IDs (10759, 10762–10768) and names verified across multiple sources
- TypeScript TMDB wrapper (`github.com/blakejoy/tmdb-ts`) — `TVDetails` type shape, `CreatedBy` structure, `status` string values confirmed
- TMDB community — TV status values ("Returning Series", "Ended", "Cancelled", "In Production", "Planned", "Pilot")
- TMDB discover TV parameters for Korean/Chinese dramas — verified against TV-01 requirement spec

### Tertiary (LOW confidence)
- None — all critical claims have medium or high confidence sources.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new packages, existing patterns directly applicable
- Architecture: HIGH — mirrors existing movie layer; field differences well-documented
- Pitfalls: MEDIUM-HIGH — `video` field issue is certain; `first_air_date` empty string behavior is known TMDB behavior; `append_to_response` TV support confirmed by official docs
- TV Genre IDs: HIGH — confirmed from multiple sources including TMDB official genre list endpoint

**Research date:** 2026-02-22
**Valid until:** 2026-06-01 (TMDB API is stable; TanStack Query v5 API stable)

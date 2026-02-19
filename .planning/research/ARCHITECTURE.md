# Architecture Research

**Domain:** TV series discovery integration into existing Moodflix movie architecture
**Researched:** 2026-02-19
**Confidence:** HIGH (based on direct codebase inspection + stable TMDB API knowledge)

---

## Context: What This Research Answers

This file specifically answers the four integration questions for adding a `/series` page to Moodflix:

1. New `/api/tv` route or extend `/api/movies`?
2. How to normalize TVShow fields (`name`, `first_air_date`) for reuse of `MovieCard` and `MovieRow`?
3. Minimum changes to `MovieDetailModal` for TV details?
4. Where does `/series` page fit in the file structure?

---

## Standard Architecture

### System Overview — TV Integration Layer

```
┌─────────────────────────────────────────────────────────────┐
│                     UI Components (REUSED)                   │
│  MovieCard (Movie)   MovieRow (Movie[])   MovieDetailModal   │
│       ↑                    ↑                    ↑            │
│  [normalizeTVShow()]  [normalizeTVShow()]  [media type flag] │
├─────────────────────────────────────────────────────────────┤
│                  NEW: TV-Specific Layer                       │
│  ┌────────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ hooks/use-tv.ts│  │ lib/tmdb.ts  │  │ app/api/tv/      │ │
│  │ (TQ hooks)     │  │ (TV fns)     │  │ route.ts + [id]  │ │
│  └────────────────┘  └──────────────┘  └──────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                  types/tv.ts (NEW)                           │
│  TVShow | TVDetails | TVListResponse | TVDetailsResponse     │
│  + normalizeTVShow(tv: TVShow): Movie  ← single adapter fn  │
├─────────────────────────────────────────────────────────────┤
│                  TMDB API                                     │
│  /trending/tv/week   /tv/popular   /tv/top_rated             │
│  /tv/on_the_air      /search/tv    /discover/tv              │
│  /tv/{id}?append_to_response=credits,watch/providers         │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Modified for TV? |
|-----------|----------------|------------------|
| `MovieCard` | Poster card with watchlist actions | No — receives normalized `Movie` |
| `MovieRow` | Horizontal scroll row | No — receives `Movie[]` |
| `MovieDetailModal` | Netflix-style detail sheet | Yes — small extension for TV-specific fields |
| `types/tv.ts` (new) | Raw TMDB TV types + `normalizeTVShow()` | New file |
| `lib/tmdb.ts` | TMDB fetch helper | Add TV functions only |
| `app/api/tv/` (new) | TV proxy routes | New route group |
| `hooks/use-tv.ts` (new) | TanStack Query hooks for TV | New file |
| `app/(app)/series/` (new) | SSR series discovery page | New route |

---

## The Normalization Decision

### Where to Normalize: `types/tv.ts` — Not the API Route, Not the Hook

**Rule: normalize at the type boundary, once, at the earliest point after fetch.**

Three candidate locations:

| Location | Problem |
|----------|---------|
| API route (`/api/tv/route.ts`) | Transforms server-side response; hook still gets raw JSON over the wire. Requires duplicating field mapping in the hook's type annotation. |
| Hook (`hooks/use-tv.ts`) | Normalization runs in the browser on every render. Hooks receive raw API response and must cast — two representations in flight. |
| **`types/tv.ts` adapter function** | Single function. Hook calls it on fetched data. API route can optionally call it server-side. Components see only `Movie`. One source of truth. |

**Decision: Export `normalizeTVShow(tv: TVShow): Movie` from `types/tv.ts`. Call it inside the hook's `queryFn` after fetch, before returning to component.**

This means:
- Components never see `TVShow` — they only ever receive `Movie`
- `MovieCard`, `MovieRow`, `MovieDetailModal` require zero changes for list display
- The adapter is testable in isolation

### TMDB Field Mapping

TMDB TV show list items return these fields that differ from `Movie`:

| TMDB TV Field | TMDB Movie Field | Notes |
|---------------|-----------------|-------|
| `name` | `title` | Primary display title |
| `original_name` | `original_title` | Original language title |
| `first_air_date` | `release_date` | Format identical: `"YYYY-MM-DD"` |
| `episode_run_time: number[]` | `runtime: number` | Array, not scalar; take `[0]` or average |
| `origin_country: string[]` | _(not present)_ | TV-only |
| `number_of_seasons` | _(not present)_ | TV details only |
| `number_of_episodes` | _(not present)_ | TV details only |
| `created_by` | _(director via credits)_ | TV details only |

Fields that are **identical** (no mapping needed): `id`, `overview`, `poster_path`, `backdrop_path`, `vote_average`, `vote_count`, `genre_ids`, `popularity`, `adult`, `original_language`.

The `video` field does not exist on TV show objects — default to `false`.

**Confidence: HIGH** — TMDB API field names for TV vs movie are stable and well-documented. The field differences above have been consistent across TMDB API v3 for years.

### Adapter Implementation

```typescript
// types/tv.ts

export type TVShow = {
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
  // video field is absent on TV shows
};

export type TVListResponse = {
  page: number;
  results: TVShow[];
  total_pages: number;
  total_results: number;
};

export type TVCategory = "trending" | "popular" | "top_rated" | "on_the_air";

export type TVDetails = {
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
  episode_run_time: number[];
  number_of_seasons: number;
  number_of_episodes: number;
  tagline: string | null;
  status: string;
  created_by: { id: number; name: string; profile_path: string | null }[];
};

export type TVDetailsWithExtras = TVDetails & {
  credits: import("@/types/movie").MovieCredits;
  "watch/providers": import("@/types/movie").WatchProvidersResponse;
};

export type TVDetailsResponse = TVDetailsWithExtras & {
  watchProviders: import("@/types/movie").WatchProviderResult | null;
  watchCountry: string;
  mediaType: "tv";
};

// The single normalization function — called once in queryFn, never in components
export function normalizeTVShow(tv: TVShow): import("@/types/movie").Movie {
  return {
    id: tv.id,
    title: tv.name,
    original_title: tv.original_name,
    overview: tv.overview,
    poster_path: tv.poster_path,
    backdrop_path: tv.backdrop_path,
    release_date: tv.first_air_date,
    vote_average: tv.vote_average,
    vote_count: tv.vote_count,
    genre_ids: tv.genre_ids,
    popularity: tv.popularity,
    adult: tv.adult,
    original_language: tv.original_language,
    video: false, // TV shows have no video flag
  };
}
```

---

## New API Route: `/api/tv` (Separate from `/api/movies`)

**Decision: Create `/api/tv/route.ts` and `/api/tv/[id]/route.ts` — do NOT extend `/api/movies`.**

Rationale:
- `/api/movies` is already tightly typed to `MovieListResponse` — adding a `?type=tv` parameter would require casting at the route level and confuses the type contract
- TV detail responses have extra fields (`number_of_seasons`, `created_by`, etc.) that the existing `MovieDetailsResponse` type doesn't accommodate
- Separate routes means hooks can point to typed endpoints (`/api/movies` returns `Movie[]`, `/api/tv` returns `TVShow[]` — normalization happens in the hook, not in the route)
- Consistent with how the codebase already separates `/api/movies/route.ts` (list) from `/api/movies/[id]/route.ts` (details)

**`/api/tv/route.ts`** handles: trending, popular, top_rated, on_the_air categories + search + genre discover for TV.

**`/api/tv/[id]/route.ts`** handles: TV series details with `append_to_response=credits,watch/providers` + country-aware watch providers (same pattern as `/api/movies/[id]/route.ts`).

The route returns raw `TVShow` / `TVDetailsWithExtras` — normalization is done in the hook, not the route. This keeps the API route dumb and the type contract clean.

---

## `MovieDetailModal` — Minimum Changes for TV Support

The modal currently hardcodes movie-specific fields:
- `movie.title` — display title
- `movie.release_date` — year
- `details.runtime` (via `formatRuntime`) — runtime
- `details.credits.crew.find(c => c.job === "Director")` — director lookup

For TV, those fields need TV-aware equivalents. The strategy is to **add a `mediaType` prop** and branch only in the places that differ.

### What Changes

```typescript
// Add to MovieDetailModalProps:
interface MovieDetailModalProps {
  movie: Movie | null;
  onClose: () => void;
  // NEW — defaults to "movie" for backward compat
  tvDetails?: TVDetailsResponse | null;
  mediaType?: "movie" | "tv";
}
```

| Current (movie) | TV equivalent | Change |
|-----------------|---------------|--------|
| `formatRuntime(details.runtime)` | `formatRuntime(tvDetails.episode_run_time[0])` + "/ ep" label | Branch on `mediaType` |
| `details.credits.crew.find(c => c.job === "Director")` | `tvDetails.created_by[0]?.name` | Branch on `mediaType` |
| `"Director:"` label | `"Created by:"` label | String swap |
| No season/episode info | `"X seasons · Y episodes"` | TV-only addition |
| `movie.title` (from prop) | `movie.title` (already normalized via `normalizeTVShow`) | No change needed |
| `movie.release_date.slice(0, 4)` | `movie.release_date.slice(0, 4)` (normalized from `first_air_date`) | No change needed |

The watchlist CRUD actions (`handleAddToLibrary`, `handleMarkWatched`, `handleRemove`) use `movie.id`, `movie.title`, `movie.poster_path` — all of which are present on normalized `Movie` objects. **No watchlist action changes needed.**

The modal hooks `useMovieDetails` vs a new `useTVDetails` — the modal needs to know which to call. The cleanest approach: pass a separate `tvDetails` prop when `mediaType === "tv"`, and skip calling `useMovieDetails` (use `enabled: mediaType !== "tv"`).

### Concrete Modal Change Pattern

```typescript
// In MovieDetailModal:
const { data: movieDetails } = useMovieDetails(
  mediaType !== "tv" ? (movie?.id ?? null) : null
);

// tvDetails is passed as a prop when mediaType === "tv"
const details = mediaType === "tv" ? tvDetails : movieDetails;

// Branched display:
const runtimeLabel = mediaType === "tv"
  ? tvDetails?.episode_run_time?.[0]
    ? `${tvDetails.episode_run_time[0]}m / ep`
    : null
  : formatRuntime(movieDetails?.runtime ?? null);

const creatorLabel = mediaType === "tv"
  ? tvDetails?.created_by?.[0]?.name ?? null
  : movieDetails?.credits?.crew?.find(c => c.job === "Director")?.name ?? null;

const creatorRole = mediaType === "tv" ? "Created by:" : "Director:";
```

**Scope of modal changes: ~20 lines of additions. No existing rendering logic is removed.**

---

## File Structure

```
moodflix/
├── types/
│   ├── movie.ts              # UNCHANGED
│   └── tv.ts                 # NEW — TVShow, TVDetails, normalizeTVShow()
│
├── lib/
│   └── tmdb.ts               # MODIFIED — add TV functions (getTrendingTV, etc.)
│
├── app/
│   └── api/
│       ├── movies/            # UNCHANGED
│       └── tv/                # NEW
│           ├── route.ts       # TV list: trending/popular/top_rated/on_the_air/search/genre
│           └── [id]/
│               └── route.ts   # TV details + watch providers
│
├── hooks/
│   ├── use-movies.ts          # UNCHANGED
│   └── use-tv.ts              # NEW — TanStack Query hooks, calls normalizeTVShow in queryFn
│
├── components/
│   ├── movies/
│   │   ├── movie-card.tsx          # UNCHANGED
│   │   ├── movie-row.tsx           # UNCHANGED
│   │   ├── movie-detail-modal.tsx  # MODIFIED — ~20 lines for TV branching
│   │   └── movie-grid.tsx          # UNCHANGED
│   └── series/                     # NEW — mirrors components/movies/ structure
│       └── series-content.tsx      # Client component for /series page
│
└── app/
    └── (app)/
        ├── discover/          # UNCHANGED
        └── series/            # NEW
            ├── page.tsx       # SSR — calls getTrendingTV, getPopularTV, getTopRatedTV
            └── loading.tsx    # Skeleton (reuse same skeleton as discover/loading.tsx)
```

### Structure Rationale

- **`types/tv.ts` is separate from `movie.ts`**: TV types are a parallel domain, not a subset. Mixing them would require union types throughout the codebase. The adapter function lives here too, keeping normalization logic co-located with the types.
- **`components/series/`**: Exists because `series-content.tsx` will have TV-specific search placeholder text, TV genre list (TV genres partially overlap movies but have unique entries like Talk Show, Reality), and on_the_air category. It is not a clone of `discover-content.tsx` — it shares all child components but has different state.
- **`app/(app)/series/` not `/tv/`**: "Series" is the user-facing term (Netflix uses it); `/tv/` would be a confusing URL.

---

## Architectural Patterns

### Pattern 1: Adapt at the Hook Boundary

**What:** `normalizeTVShow()` is called inside `queryFn` in `hooks/use-tv.ts`, converting `TVListResponse` to `MovieListResponse` before TanStack Query caches it.

**When to use:** Any time a foreign data shape must flow into components that expect a known type.

**Trade-offs:** TanStack Query cache stores `Movie[]` not `TVShow[]` — cannot retrieve raw TV fields from cache. Acceptable here because TV-specific fields are only needed in the detail modal, which fetches separately.

**Example:**
```typescript
// hooks/use-tv.ts
async function fetchTVCategory(
  category: TVCategory,
  page: number,
): Promise<MovieListResponse> {
  const res = await fetch(`/api/tv?category=${category}&page=${page}`);
  if (!res.ok) throw new Error("Failed to fetch TV shows");
  const data: TVListResponse = await res.json();
  // Normalize here — components never see TVShow
  return {
    ...data,
    results: data.results.map(normalizeTVShow),
  };
}
```

### Pattern 2: Media Type Prop for Modal Branching

**What:** `MovieDetailModal` accepts `mediaType?: "movie" | "tv"` and `tvDetails?: TVDetailsResponse`. Branches on `mediaType` only in the handful of places that differ.

**When to use:** Extending a component for a closely related domain without forking it.

**Trade-offs:** Modal takes on a second responsibility. Acceptable because TV and movie detail UIs are 90% identical. Forking the modal would mean maintaining two nearly-identical 600-line components.

### Pattern 3: Parallel Route/Hook/Type Triplet

**What:** Each media type has its own: `app/api/{type}/`, `hooks/use-{type}.ts`, types in `types/{type}.ts`. They share components via normalization.

**When to use:** When adding a second media type (TV) that has a parallel but distinct TMDB API surface.

**Trade-offs:** More files, but clean separation. Adding a third type (e.g., anime) follows the same pattern without touching existing code.

---

## Data Flow

### Series Page Request Flow

```
[SSR: app/(app)/series/page.tsx]
    ↓ Promise.all
[lib/tmdb.ts: getTrendingTV(), getPopularTV(), getTopRatedTV()]
    ↓ TMDB API /trending/tv/week, /tv/popular, /tv/top_rated
[TVListResponse] → normalizeTVShow() per result → Movie[]
    ↓ passed as props
[components/series/series-content.tsx]
    ↓ renders with
[MovieRow, MovieCard] ← already typed to Movie[], no changes
```

### TV Detail Flow

```
[User clicks TV show card in series-content.tsx]
    ↓ setSelectedShow(movie)
[MovieDetailModal opens with mediaType="tv"]
    ↓ hook disabled for movie details
[useTVDetails(show.id)] → fetch /api/tv/{id}
    ↓ /api/tv/[id]/route.ts → lib/tmdb.ts: getTVDetails()
[TVDetailsResponse] → passed as tvDetails prop to modal
    ↓ modal branches on mediaType
[Renders: seasons count, episode runtime, "Created by:"]
```

### Watchlist Flow (Unchanged)

```
[User adds TV show to watchlist via MovieDetailModal]
    ↓ handleAddToLibrary — uses movie.id (tmdbId), movie.title, movie.poster_path
[addToWatchlist server action] → Drizzle → PostgreSQL
```

**Note:** The watchlist schema has no `mediaType` column. TV show and movie TMDB IDs are in separate ID spaces (TMDB guarantees no collision between `movie.id` and `tv.id`), so the existing unique constraint `(userId, tmdbId)` is safe. If future disambiguation is needed (e.g., showing "TV" badge in library), add a `mediaType text` column via a new Drizzle migration. Do not add it now — YAGNI until library needs it.

---

## Build Order

Build in this order to unblock each subsequent step:

1. **`types/tv.ts`** — Define `TVShow`, `TVListResponse`, `TVDetails`, `TVDetailsResponse`, `TVCategory`, `normalizeTVShow()`. Zero runtime risk, pure types + function.

2. **`lib/tmdb.ts` additions** — Add `getTrendingTV`, `getPopularTV`, `getTopRatedTV`, `getOnTheAirTV`, `searchTV`, `discoverTVByGenre`, `getTVDetails`. Use same `tmdbFetch<T>` helper. Mirror the existing movie function signatures exactly.

3. **`app/api/tv/route.ts`** — Mirror `app/api/movies/route.ts`. Returns raw `TVListResponse` (normalization is hook responsibility). Add `on_the_air` as a valid category.

4. **`app/api/tv/[id]/route.ts`** — Mirror `app/api/movies/[id]/route.ts`. Calls `getTVDetails(id)` which uses `append_to_response=credits,watch/providers`.

5. **`hooks/use-tv.ts`** — Mirror `hooks/use-movies.ts` structure. Call `normalizeTVShow()` inside each `queryFn`. Export `tvKeys` query key factory.

6. **`components/series/series-content.tsx`** — Client component. Accepts `trending: Movie[]`, `popular: Movie[]`, `topRated: Movie[]` props (already normalized). Manages search, genre filter state. Renders `MovieRow`, `MovieGrid`, `MovieDetailModal` with `mediaType="tv"`.

7. **`app/(app)/series/page.tsx`** — SSR page. Calls `getTrendingTV()`, `getPopularTV()`, `getTopRatedTV()` in `Promise.all`. Normalizes results via `normalizeTVShow()`. Passes to `SeriesContent`.

8. **`app/(app)/series/loading.tsx`** — Reuse the same skeleton JSX as `app/(app)/discover/loading.tsx`.

9. **`components/movies/movie-detail-modal.tsx` modifications** — Add `mediaType` prop, `tvDetails` prop, branch the runtime/creator/seasons display. This step is last because it can be tested in isolation once step 6 is wired up.

10. **`components/layout/app-navbar.tsx`** — Add "Series" nav link pointing to `/series` with an appropriate icon (e.g., `Tv` from lucide-react).

**Why this order:** Types first means TypeScript catches errors at every subsequent step. API routes before hooks means hooks can be tested against real endpoints. SSR page before modal modifications means the happy path (browsing) works before the detail overlay is wired up.

---

## Anti-Patterns

### Anti-Pattern 1: Normalizing in the API Route

**What people do:** Map `name → title` in `/api/tv/route.ts` before returning JSON, so the client receives `Movie`-shaped objects.

**Why it's wrong:** The API route loses type information — it returns `Movie` but TypeScript thinks it's returning `TVListResponse`. The raw TV fields (`episode_run_time`, `number_of_seasons`) needed by the detail modal are lost server-side before the hook can forward them. Also makes the route harder to debug — the response no longer matches what TMDB sends.

**Do this instead:** Return raw TMDB response from the route. Normalize in the hook's `queryFn` where TypeScript can enforce the transformation.

### Anti-Pattern 2: Adding `?type=tv` to `/api/movies`

**What people do:** Extend the existing movies route with a `type` query param to serve both movies and TV shows.

**Why it's wrong:** The route is already typed to `MovieListResponse` in `lib/tmdb.ts` functions. Adding a conditional return type forces `as unknown as MovieListResponse` casting throughout. The movie and TV TMDB endpoints have different parameters (`on_the_air` vs `now_playing`). One route trying to do both creates a branchy mess that is hard to test.

**Do this instead:** Separate `/api/tv/` route — same pattern, parallel implementation, zero coupling.

### Anti-Pattern 3: Forking `MovieDetailModal` into `TVDetailModal`

**What people do:** Copy `movie-detail-modal.tsx` to `tv-detail-modal.tsx` and adjust.

**Why it's wrong:** Two 600-line files to maintain. Any fix to the modal (e.g., provider display bug, animation tweak) must be applied twice. The TV and movie UIs are 90% identical.

**Do this instead:** Add `mediaType` prop to the existing modal. Branch only where the fields differ (~20 lines). Use `tvDetails` prop pattern so the modal doesn't need to know which hook to call internally.

### Anti-Pattern 4: Adding `mediaType` Column to Watchlist Now

**What people do:** Preemptively add `mediaType: text("media_type").default("movie")` to the watchlist schema.

**Why it's wrong:** Requires a Drizzle migration + RLS policy update + server action changes + type changes — none of which are needed for the `/series` page to work. TMDB movie and TV IDs are in separate integer namespaces with no overlap, so the existing `(userId, tmdbId)` unique constraint is safe.

**Do this instead:** Add `mediaType` only when the Library page needs to display "TV" badges or filter by type. Defer the migration.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| TMDB `/trending/tv/week` | `tmdbFetch<TVListResponse>` in `lib/tmdb.ts` | Same auth header, same ISR revalidate 300s |
| TMDB `/tv/{id}?append_to_response=credits,watch/providers` | Same `append_to_response` pattern as movies | `credits` returns same `MovieCredits` shape; `watch/providers` returns same `WatchProvidersResponse` shape |
| TMDB `/search/tv` | Same query param pattern as `/search/movie` | |
| TMDB `/discover/tv` | Same `with_genres`, `sort_by`, `page` params as `/discover/movie` | TV has additional genre IDs: Talk (10767), Reality (10764), News (10763), Soap (10766), Kids (10762) |

### TV-Specific TMDB Genre IDs (Not in Current `GENRES` Map)

The existing `GENRES` constant in `lib/constants.ts` covers movie genres. TV has overlapping genre IDs plus TV-only additions. Extend `GENRES` or create a separate `TV_GENRES` constant. Recommendation: create `TV_GENRES` in `lib/constants.ts` to avoid polluting the movie genre filter on the Discover page.

```typescript
// lib/constants.ts — add alongside GENRES
export const TV_GENRES: Record<number, string> = {
  // Overlapping with movies (same IDs):
  28: "Action & Adventure", // Note: TV uses "Action & Adventure" not "Action"
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi & Fantasy",
  10752: "War & Politics",
  // TV-only:
  10759: "Action & Adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
  37: "Western",
};
```

**Confidence: MEDIUM** — TV genre IDs verified from TMDB documentation training data. Verify exact IDs at implementation time against TMDB's `/genre/tv/list` endpoint.

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `hooks/use-tv.ts` ↔ `components/series/series-content.tsx` | Props (`Movie[]`) via normalized data | No direct coupling |
| `components/movies/movie-detail-modal.tsx` ↔ `hooks/use-tv.ts` | `tvDetails` prop passed from `series-content.tsx` | Modal does not import `use-tv.ts` directly |
| `drizzle/schema.ts` | Unchanged | TV shows added to watchlist as `tmdbId` with no `mediaType` column |
| `app-navbar.tsx` ↔ new `/series` route | Add nav link | `pathname.startsWith("/series")` for active state |

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Current approach fine — TMDB ISR caching handles load |
| 1k-100k users | Add Redis for TMDB response caching (not in-memory ISR) — but only if TMDB rate limits become an issue |
| 100k+ users | TMDB has a generous rate limit (50 requests/second) — TV discovery at this scale would not require architectural changes |

---

## Sources

- Direct inspection of `lib/tmdb.ts`, `types/movie.ts`, `app/api/movies/route.ts`, `hooks/use-movies.ts`, `components/movies/movie-card.tsx`, `components/movies/movie-row.tsx`, `components/movies/movie-detail-modal.tsx`, `components/movies/discover-content.tsx`, `drizzle/schema.ts`, `app/(app)/discover/page.tsx`, `components/layout/app-navbar.tsx` (HIGH confidence — primary source)
- TMDB API v3 TV endpoints: field names, response shapes (HIGH confidence — stable, well-established API surface verified against training data)
- TanStack Query v5 patterns — `queryFn` as normalization boundary (HIGH confidence — Context7/official docs pattern)

---
*Architecture research for: TV series discovery integration into Moodflix*
*Researched: 2026-02-19*

# Phase 5: TV Series Page + Modal - Research

**Researched:** 2026-02-22
**Domain:** Next.js App Router page composition, TV-specific modal extension, component reuse
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Hero banner at top of `/series` page — full-width backdrop from a trending TV show
- Hero banner is clickable — opens the TV detail modal for the featured show
- Row labels: "Trending TV Shows", "Korean Drama", "Chinese Drama", "Top Rated Series"
- Four rows in order: Trending TV Shows, Korean Drama, Chinese Drama, Top Rated Series
- Each row has horizontal scroll with arrow navigation (same pattern as discover page)
- TV detail modal: overview only (no episode list or season selector)
- TV detail modal: watch providers shown for user's region (same regional detection as movie modal)
- TV cards: bookmark + check buttons visible (same as movie cards)
- Navbar link labeled "Series" (short form)

### Claude's Discretion
- Hero show selection method (trending #1 vs daily rotation)
- Search/filter on /series page
- Status badge color scheme
- TV-specific info placement in modal
- "Created by" label handling
- Card visual TV indicator
- Navbar link position and icon
- Mobile navigation treatment
- Loading skeleton design
- Empty state handling

### Deferred Ideas (OUT OF SCOPE)
- Episode list/season browser in TV modal
- TV Watchlist Schema Migration (must go in a separate phase before Phase 5 IF watchlist is wanted)

### IMPORTANT CONSTRAINT CONFLICT (Researcher Note)
The CONTEXT.md decisions section says TV cards should have watchlist buttons. However, the authoritative REQUIREMENTS.md (`TV-01`) and ROADMAP.md (Phase 5 success criterion 5) both explicitly state: **"TV show cards do NOT show watchlist add/remove buttons in v0.3 (read-only discovery)"**. The accepted requirements take precedence over discussion notes. The planner must clarify with the user OR default to the locked requirements (no watchlist buttons for TV in v0.3).

The `additional_context` passed to this research phase also echoes the requirements: criterion 5 states "TV show cards do not show watchlist add/remove buttons." This is the governing constraint.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TV-01 | TV Series Discovery Page — `/series` with four curated rows, TV detail modal with seasons/episodes/status/creator, read-only (no watchlist buttons), loading skeleton | Phase 4 data layer is complete; all hooks, API routes, and types exist and are ready to consume. The UI layer is the only remaining work. |
</phase_requirements>

---

## Summary

Phase 4 delivered 100% of the TV data infrastructure. Phase 5 is a pure UI composition task with one non-trivial extension: adding `mediaType`-aware branching to the existing `MovieDetailModal`. Every API route, TanStack Query hook, type, and utility is already in place.

The `/series` page follows the same Server Component → Client Component pattern as `/discover`: an async Server Component (page.tsx) fetches initial data via `lib/tmdb.ts` functions, passes it to a `SeriesContent` client component that manages modal state, and re-uses `MovieRow` with normalized TV data directly. The hero banner needs a click handler to open the modal, which means it cannot be the static `HeroBanner` component (that component has a hardcoded "Discover More" CTA link). A new `SeriesHeroBanner` variant or a prop-based extension is required.

The modal extension (`movieType` prop) is the highest-complexity task in this phase. The existing `MovieDetailModal` calls `useMovieDetails` (movie-specific) and renders movie fields. The TV variant must call `useTVDetails`, render `number_of_seasons`, `number_of_episodes`, `status` badge, and `created_by` instead of director — while sharing all the cast, watch providers, and overlay UI.

**Primary recommendation:** Compose the series page from existing components with minimal modification. Extend `MovieDetailModal` with a `mediaType` prop + internal branching rather than creating a separate modal component. This keeps the codebase DRY and reduces test surface.

---

## Standard Stack

### Core (already installed — Phase 4 complete)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| `@tanstack/react-query` | ^5 | Client-side TV data fetching | DONE — `hooks/use-tv.ts` |
| `framer-motion` | ^11 | Animations (hero, card hover) | DONE — used in `MovieCard`, `HeroBanner` |
| `lucide-react` | latest | Icons (Tv icon for navbar) | DONE — installed via shadcn |
| `next/image` | built-in | Optimized image rendering | DONE |
| `@radix-ui/react-dialog` | via shadcn | Modal foundation | DONE |

### Data Layer (Phase 4 complete — DO NOT REBUILD)

| File | What it provides | Confidence |
|------|-----------------|------------|
| `types/tv.ts` | `TVShow`, `TVDetails`, `TVDetailsResponse`, `normalizeTVShow()` | HIGH — file verified |
| `lib/tmdb.ts` | `getTrendingTV()`, `getTopRatedTV()`, `discoverKoreanDramas()`, `discoverChineseDramas()`, `getTVDetails()` | HIGH — file verified |
| `app/api/tv/route.ts` | `GET /api/tv?category=trending|top_rated|korean_drama|chinese_drama` | HIGH — file verified |
| `app/api/tv/[id]/route.ts` | `GET /api/tv/[id]` — returns `TVDetailsResponse` with `watchProviders`, `watchCountry`, `mediaType: "tv"` | HIGH — file verified |
| `hooks/use-tv.ts` | `useTrendingTV()`, `useTopRatedTV()`, `useKoreanDramas()`, `useChineseDramas()`, `useTVDetails()` | HIGH — file verified |
| `lib/constants.ts` | `TV_GENRES` record | HIGH — verified, already contains TV-specific IDs |

### No new packages needed

All required packages are already installed. This phase adds zero new `npm install` commands.

---

## Architecture Patterns

### Recommended Project Structure (new files only)

```
app/(app)/series/
├── page.tsx           # Server Component — SSR fetch + metadata
└── loading.tsx        # Route skeleton matching discover pattern

components/series/
└── series-content.tsx # Client Component — state, modal, rows

components/movies/
└── movie-detail-modal.tsx  # EXTEND existing — add mediaType prop
```

Navbar change: `components/layout/app-navbar.tsx` — add "Series" nav link.

### Pattern 1: Server Component Fetches SSR Data, Passes to Client

Exactly mirrors `/discover/page.tsx` pattern.

```typescript
// app/(app)/series/page.tsx
import type { Metadata } from "next";
import { getTrendingTV, getTopRatedTV, discoverKoreanDramas, discoverChineseDramas } from "@/lib/tmdb";
import { normalizeTVShow } from "@/types/tv";
import { SeriesContent } from "@/components/series/series-content";

export const metadata: Metadata = {
  title: "Series",
  description: "Browse trending and top-rated TV shows from around the world.",
};

export default async function SeriesPage() {
  const [trending, korean, chinese, topRated] = await Promise.all([
    getTrendingTV(),
    discoverKoreanDramas(),
    discoverChineseDramas(),
    getTopRatedTV(),
  ]);

  return (
    <div className="space-y-8">
      <SeriesContent
        trending={trending.results.map(normalizeTVShow)}
        korean={korean.results.map(normalizeTVShow)}
        chinese={chinese.results.map(normalizeTVShow)}
        topRated={topRated.results.map(normalizeTVShow)}
      />
    </div>
  );
}
```

**Why SSR fetch:** Initial data arrives with the page (no spinner on first load). Consistent with discover page. `lib/tmdb.ts` functions use `next: { revalidate: 300 }` already.

**Source:** Observed pattern in `app/(app)/discover/page.tsx` (verified in codebase).

### Pattern 2: SeriesContent Client Component

Manages `selectedMovie: Movie | null` state. Uses `useTVDetails` in the modal (via `mediaType` prop).

```typescript
// components/series/series-content.tsx
"use client";

import { useState } from "react";
import type { Movie } from "@/types/movie";
import { SeriesHeroBanner } from "./series-hero-banner"; // or inline
import { MovieRow } from "@/components/movies/movie-row";
import { MovieDetailModal } from "@/components/movies/movie-detail-modal";

interface SeriesContentProps {
  trending: Movie[];
  korean: Movie[];
  chinese: Movie[];
  topRated: Movie[];
}

export function SeriesContent({ trending, korean, chinese, topRated }: SeriesContentProps) {
  const [selectedShow, setSelectedShow] = useState<Movie | null>(null);
  const featuredShow = trending.find((t) => t.backdrop_path) ?? trending[0];

  return (
    <div className="space-y-8">
      {featuredShow && (
        <SeriesHeroBanner show={featuredShow} onClick={() => setSelectedShow(featuredShow)} />
      )}

      <MovieRow title="Trending TV Shows" movies={trending} onMovieClick={setSelectedShow} />
      <MovieRow title="Korean Drama" movies={korean} onMovieClick={setSelectedShow} />
      <MovieRow title="Chinese Drama" movies={chinese} onMovieClick={setSelectedShow} />
      <MovieRow title="Top Rated Series" movies={topRated} onMovieClick={setSelectedShow} />

      <MovieDetailModal
        movie={selectedShow}
        mediaType="tv"
        onClose={() => setSelectedShow(null)}
      />
    </div>
  );
}
```

### Pattern 3: Hero Banner — Clickable Variant

The existing `HeroBanner` component has a hardcoded `<Link href="/discover">` CTA and no `onClick` prop. It cannot open a modal. Two options:

**Option A (recommended):** Create `SeriesHeroBanner` component in `components/series/` — adapts the hero pattern for TV with `onClick` prop instead of a navigation link. Avoids modifying the movies hero (risk of regression on home page).

**Option B:** Add optional `onHeroClick?: () => void` prop to the existing `HeroBanner` and conditionally render a button vs. a link. More reuse but adds complexity to a component used on home page.

**Recommendation: Option A.** The hero content differs meaningfully (TV show has no `release_date` year visible, uses `first_air_date` from normalized data; CTA is a button not a link). A new component is cleaner and carries no regression risk.

```typescript
// components/series/series-hero-banner.tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import type { Movie } from "@/types/movie";
import { getBackdropUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { TV_GENRES } from "@/lib/constants";

interface SeriesHeroBannerProps {
  show: Movie;
  onClick: () => void;
}

export function SeriesHeroBanner({ show, onClick }: SeriesHeroBannerProps) {
  const shouldReduceMotion = useReducedMotion();
  const year = show.release_date?.slice(0, 4) || ""; // first_air_date via normalizeTVShow
  const displayGenres = show.genre_ids
    .slice(0, 3)
    .map((id) => TV_GENRES[id])
    .filter(Boolean);

  return (
    <div
      className="relative -mx-4 -mt-8 h-[50vh] min-h-[400px] max-h-[600px] overflow-hidden cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      aria-label={`View details for ${show.title}`}
    >
      {/* backdrop + gradients — same as HeroBanner */}
      ...
      <Button size="lg" className="gap-2" onClick={onClick}>
        <Info className="h-5 w-5" />
        More Info
      </Button>
    </div>
  );
}
```

**Source:** Observed `HeroBanner` pattern in `components/movies/hero-banner.tsx` (verified).

### Pattern 4: Modal Extension with mediaType Prop

The existing `MovieDetailModal` is fully featured for movies. The TV extension requires:

1. A `mediaType?: "movie" | "tv"` prop
2. Conditional hook: when `mediaType === "tv"`, call `useTVDetails(id)` instead of `useMovieDetails(id)`
3. TV-specific fields rendered conditionally: `number_of_seasons`, `number_of_episodes`, `status` badge, `created_by` (instead of director)
4. Movie-only fields hidden for TV: `runtime`, tagline (tagline exists on TVDetails but can be shown if present)

**Implementation strategy — internal branching:**

```typescript
// Extend MovieDetailModal props
interface MovieDetailModalProps {
  movie: Movie | null;
  onClose: () => void;
  mediaType?: "movie" | "tv";  // NEW
}

export function MovieDetailModal({ movie, onClose, mediaType = "movie" }: MovieDetailModalProps) {
  const isTV = mediaType === "tv";

  // Conditional hook calls — React rules: both hooks always called, but only one is `enabled`
  const movieDetailsQuery = useMovieDetails(isTV ? null : (movie?.id ?? null));
  const tvDetailsQuery = useTVDetails(isTV ? (movie?.id ?? null) : null);

  const details = isTV ? tvDetailsQuery.data : movieDetailsQuery.data;
  const isLoading = isTV ? tvDetailsQuery.isLoading : movieDetailsQuery.isLoading;
  const isPlaceholderData = isTV ? tvDetailsQuery.isPlaceholderData : movieDetailsQuery.isPlaceholderData;

  // TV-specific derived data
  const creators = isTV && details ? (details as TVDetailsResponse).created_by ?? [] : [];
  const numberOfSeasons = isTV && details ? (details as TVDetailsResponse).number_of_seasons : null;
  const numberOfEpisodes = isTV && details ? (details as TVDetailsResponse).number_of_episodes : null;
  const showStatus = isTV && details ? (details as TVDetailsResponse).status : null;

  // Movie-specific
  const director = !isTV ? details?.credits?.crew?.find((c) => c.job === "Director") : null;
  const runtime = !isTV && details ? formatRuntime((details as MovieDetailsResponse).runtime) : "";
  ...
}
```

**IMPORTANT:** React hooks must not be called conditionally. Both `useMovieDetails` and `useTVDetails` are called every render but `enabled: id !== null` ensures only the relevant one fires. This is the correct pattern — see verified hook implementations in `hooks/use-movies.ts` and `hooks/use-tv.ts`.

**Source:** Verified `useMovieDetails` and `useTVDetails` both use `enabled: id !== null` pattern (hooks files verified).

### Pattern 5: Navbar Link Addition

The `AppNavbar` defines `navLinks` as a static array. Add "Series" entry:

```typescript
// components/layout/app-navbar.tsx
import { Home, Compass, Bookmark, Tv } from "lucide-react";

const navLinks = [
  { href: "/home", label: "Home", icon: Home, exact: true },
  { href: "/discover", label: "Discover", icon: Compass, exact: false },
  { href: "/series", label: "Series", icon: Tv, exact: false },  // NEW
  { href: "/library", label: "Library", icon: Bookmark, exact: false },
];
```

`Tv` is available in lucide-react (already installed). Label "Series" confirmed by user. Position: between Discover and Library.

**Source:** Verified `components/layout/app-navbar.tsx` structure (file verified).

### Pattern 6: Loading Skeleton

Match discover loading pattern with hero skeleton added:

```typescript
// app/(app)/series/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function SeriesLoading() {
  return (
    <div className="space-y-8">
      {/* Hero skeleton */}
      <Skeleton className="-mx-4 -mt-8 h-[50vh] min-h-[400px] max-h-[600px] rounded-none" />

      {/* 4 rows */}
      {Array.from({ length: 4 }).map((_, rowIndex) => (
        <div key={rowIndex} className="space-y-3">
          <Skeleton className="h-7 w-40" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton
                key={i}
                className="flex-shrink-0 w-[185px] aspect-[2/3] rounded-lg"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Source:** Observed discover pattern in `app/(app)/discover/loading.tsx` (verified).

### Anti-Patterns to Avoid

- **Calling hooks conditionally:** Never `if (isTV) { useTVDetails(...) }` — React hooks rules violation
- **Creating a duplicate modal:** Do not create `TVDetailModal` — it duplicates ~500 lines of working modal code. Use `mediaType` prop branching.
- **Calling `useMovieDetails` for TV IDs:** TMDB movie endpoint called with a TV ID returns 404. The conditional `enabled: id !== null` pattern gates correctly.
- **Using `GENRES` for TV genre badge display:** TV shows return TV-specific genre IDs (10759, 10762–10768) which are NOT in the `GENRES` constant. Use `TV_GENRES` for the hero and card overlays.
- **Passing raw `TVShow` to components:** Always run `normalizeTVShow()` before passing to `Movie`-typed components (`MovieCard`, `MovieRow`).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Horizontal scroll row with arrows | Custom scroll component | `MovieRow` — already exists | Fully built with arrow detection, scroll behavior, skeleton state |
| Poster card UI | Custom card | `MovieCard` — works with normalized TV data | Accepts `Movie` type; `normalizeTVShow()` handles the conversion |
| Modal dialog foundation | Custom dialog | Extend existing `MovieDetailModal` | Avoids ~500 line duplication; watch providers, cast, library actions all work |
| Regional watch provider detection | Custom IP lookup | `getCountryFromHeaders()` in `lib/country.ts` | Already used by `/api/tv/[id]/route.ts` |
| TV API proxy routes | Custom routes | `/api/tv/route.ts` and `/api/tv/[id]/route.ts` | Complete — all four TV categories + details endpoint exist |
| TV TanStack Query hooks | Custom hooks | `hooks/use-tv.ts` | All four category hooks + `useTVDetails` exist and tested |

**Key insight:** Phase 4 was explicitly designed to make Phase 5 a pure UI composition task. Every data primitive exists. The only net-new code is the page, loading skeleton, hero banner variant, series-content orchestrator, and modal extension.

---

## Common Pitfalls

### Pitfall 1: Genre Badge Display for TV Shows

**What goes wrong:** Using `GENRES` constant (movie genres) to display genre badges on TV cards and in the hero. TV genre IDs (10759, 10762–10768) are not in `GENRES`, so `.map((id) => GENRES[id]).filter(Boolean)` returns an empty array — no genre badges appear.

**Why it happens:** `normalizeTVShow()` copies `genre_ids` from the TV show, but the existing card and hero use `GENRES` (movies-only) to resolve names.

**How to avoid:** In `SeriesHeroBanner` and anywhere TV genre names are needed, import and use `TV_GENRES` from `lib/constants.ts`. Note that genre IDs 28, 18, 35, etc. (drama, action) overlap between TV and movies — these resolve correctly from `GENRES`. Only TV-exclusive genres (10759+) are missing.

**Warning signs:** Genre badges section renders empty on hover overlay.

### Pitfall 2: `useWatchlistTmdbIds` Runs for TV Cards (Acceptable, Not a Bug)

**What goes wrong:** `MovieCard` calls `useWatchlistTmdbIds()` unconditionally. For TV show cards (with no schema migration done), the hook returns movie entries only. No TV show will match `entry.tmdbId === movie.id` (because TMDB movie IDs and TV IDs CAN overlap numerically). A TV show with TMDB ID 1396 would incorrectly match a movie with TMDB ID 1396 in the watchlist check.

**Why it happens:** The watchlist table has no `media_type` column yet (deferred to v0.4). The `useWatchlistTmdbIds` query returns all entries regardless of type.

**How to avoid per requirements:** Since TV-01 requires read-only TV cards (no watchlist buttons), the `MovieCard` component should not show buttons for TV items. Options:
- Pass a `readOnly` prop to `MovieCard` that hides the bookmark/check buttons
- OR, simpler: accept that watchlist buttons appear for TV shows that happen to share an ID with a movie in the user's library (rare, usually harmless, and the buttons just mutate an incorrect watchlist entry)
- RECOMMENDED: Add `readOnly?: boolean` prop to `MovieCard` that gates the watchlist action buttons. This prevents the cross-contamination edge case and fulfills the read-only requirement cleanly.

**Warning signs:** Watchlist buttons appearing on TV cards, or a movie incorrectly showing as "In Library" when it's actually a TV show with the same TMDB ID.

### Pitfall 3: TV Status Strings (TMDB is Case-Sensitive)

**What goes wrong:** Hardcoding `"Cancelled"` (double-L) when TMDB returns `"Canceled"` (single-L American spelling) causes the status badge color mapping to miss.

**TMDB TV status values (verified from TMDB community forums):**
- `"Returning Series"` — currently airing, more seasons expected
- `"Planned"` — announced, not yet in production
- `"In Production"` — actively filming
- `"Ended"` — concluded naturally
- `"Canceled"` — cancelled (American spelling, single-L)
- `"Pilot"` — only a pilot episode exists

**How to avoid:** When implementing the status badge color map, use the exact strings above. The badge display label can differ from the key (e.g., display "Cancelled" to the user, match on `"Canceled"` from API).

**Source:** TMDB community forum (MEDIUM confidence) — verified by multiple TMDB developer forum posts. The official API reference page did not render status enum values.

**Warning signs:** Status badge defaults to neutral/unknown color for most shows.

### Pitfall 4: HeroBanner `-mx-4 -mt-8` Negative Margins

**What goes wrong:** The hero banner uses `-mx-4 -mt-8` to break out of the container padding and go full-width. If the `page.tsx` wraps children in extra `<div>` elements before passing to `SeriesContent`, the hero banner's negative margins may not reach the correct parent boundary.

**Why it happens:** The app layout (`layout.tsx`) applies `container mx-auto px-4 py-8` to the main content wrapper. The `-mx-4 -mt-8` offsets these exactly. Extra nesting breaks the math.

**How to avoid:** Keep `page.tsx` minimal — pass content directly to `SeriesContent` without additional wrapper divs. Mirror the exact pattern from `discover/page.tsx` which does not wrap `DiscoverContent` in extra spacing divs.

**Source:** Verified by reading `app/(app)/layout.tsx` and `components/movies/hero-banner.tsx` (HIGH confidence).

### Pitfall 5: Type Narrowing for `TVDetailsResponse` vs `MovieDetailsResponse` in Modal

**What goes wrong:** Inside the extended `MovieDetailModal`, accessing `details.number_of_seasons` when `details` is typed as `MovieDetailsResponse` causes TypeScript errors. The `details` variable type depends on which hook ran.

**How to avoid:** Import both types. When `isTV`, cast/assert to `TVDetailsResponse` before accessing TV-specific fields:

```typescript
import type { TVDetailsResponse } from "@/types/tv";
import type { MovieDetailsResponse } from "@/types/movie";

// Inside the component:
const tvDetails = isTV ? (details as TVDetailsResponse | undefined) : undefined;
const movieDetails = !isTV ? (details as MovieDetailsResponse | undefined) : undefined;

const creator = tvDetails?.created_by?.[0]?.name ?? null;
const numberOfSeasons = tvDetails?.number_of_seasons ?? null;
const runtime = movieDetails ? formatRuntime(movieDetails.runtime) : "";
```

**Warning signs:** TypeScript errors like "Property 'number_of_seasons' does not exist on type 'MovieDetailsResponse'".

---

## Code Examples

Verified patterns from codebase inspection:

### normalizeTVShow usage (converts TV to Movie type)
```typescript
// Source: types/tv.ts (verified)
import { normalizeTVShow } from "@/types/tv";

// In page.tsx SSR fetch:
const trending = await getTrendingTV();
const normalizedTrending = trending.results.map(normalizeTVShow);
// normalizedTrending is Movie[] — compatible with MovieRow and MovieCard
```

### useTVDetails hook signature
```typescript
// Source: hooks/use-tv.ts (verified)
export function useTVDetails(id: number | null) {
  return useQuery({
    queryKey: tvKeys.details(id!),
    queryFn: () => fetchTVDetails(id!),
    enabled: id !== null,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
// Returns TVDetailsResponse | undefined
```

### TVDetailsResponse fields available for modal
```typescript
// Source: types/tv.ts (verified)
type TVDetailsResponse = TVDetailsWithExtras & {
  watchProviders: WatchProviderResult | null;
  watchCountry: string;
  mediaType: "tv";
};

// TVDetails (extends TVShow) has:
// - status: string  ("Returning Series" | "Ended" | "Canceled" | ...)
// - number_of_seasons: number
// - number_of_episodes: number
// - created_by: TVCreatedBy[]  (each has .name)
// - tagline: string | null
// - genres: { id: number; name: string }[]
// - credits: MovieCredits (same structure as movies — cast/crew work identically)
// - "watch/providers": WatchProvidersResponse (already extracted to watchProviders by API route)
```

### TV API route confirms regional provider extraction
```typescript
// Source: app/api/tv/[id]/route.ts (verified)
return Response.json({
  ...details,
  watchProviders: providers,  // Already extracted for user's region
  watchCountry: country,
  mediaType: "tv" as const,   // Discriminant field
});
```

### MovieRow accepts normalized Movie[] — no changes needed
```typescript
// Source: components/movies/movie-row.tsx (verified)
interface MovieRowProps {
  title: string;
  movies: Movie[];        // TV shows normalized to Movie[] work here
  isLoading?: boolean;
  isUpdating?: boolean;
  onMovieClick?: (movie: Movie) => void;
}
```

### Status badge color recommendation
```typescript
// Recommendation based on TMDB status strings (MEDIUM confidence)
function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "Returning Series": return "default";     // primary color (active/positive)
    case "Ended":            return "secondary";   // neutral
    case "Canceled":         return "destructive"; // red (negative)
    case "In Production":    return "outline";     // subtle
    case "Planned":          return "outline";
    case "Pilot":            return "outline";
    default:                 return "secondary";
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Separate TV modal component | `mediaType` prop + conditional hook pattern | Single modal handles both media types; avoids duplication |
| Individual per-show API calls on hover | Preload via `enabled: id !== null` + cache | Modal opens immediately when same show clicked twice |
| Genre lookup using movie genres for TV | TV_GENRES constant in constants.ts | Already implemented in Phase 4 |

**Phase 4 completed (do not rebuild):**
- `TV_GENRES` in `lib/constants.ts` — confirmed present
- `normalizeTVShow()` in `types/tv.ts` — confirmed present
- All four TV TMDB fetch functions — confirmed present in `lib/tmdb.ts`
- All four TV category hooks + `useTVDetails` — confirmed present in `hooks/use-tv.ts`
- `/api/tv/route.ts` — confirmed present, handles all four categories
- `/api/tv/[id]/route.ts` — confirmed present, includes regional provider extraction

---

## Open Questions

1. **Watchlist buttons on TV cards: CONTEXT.md vs REQUIREMENTS.md conflict**
   - What we know: CONTEXT.md (user discussion) says watchlist buttons. REQUIREMENTS.md and ROADMAP success criteria say read-only (no buttons).
   - What's unclear: Which is the governing source of truth for the planner.
   - Recommendation: Default to REQUIREMENTS.md (no watchlist buttons). This is consistent with the `additional_context` passed to this phase which also says no buttons (success criterion 5). If the planner needs watchlist support, a schema migration phase must be inserted before Phase 5.

2. **TV genre badge display on MovieCard hover overlay**
   - What we know: `MovieCard` uses `GENRES` constant for genre badge names. TV genre IDs (10759+) don't exist in `GENRES`.
   - What's unclear: Whether TV-exclusive genre IDs appear in TMDB responses for trending/drama shows, or if the common genre IDs (18=Drama) dominate.
   - Recommendation: For the series page specifically, the MovieCard hover overlay will show blanks for TV-only genres. This is acceptable for v0.3. A future enhancement could pass a `genreMap` prop to `MovieCard`. For now, genre IDs like 18 (Drama) appear in both movie and TV genres and will display correctly.

3. **Hero featured show selection method**
   - What we know: User left this as Claude's discretion. Trending #1 (first item with backdrop) is simplest.
   - Recommendation: Use `trending.find((t) => t.backdrop_path) ?? trending[0]` in `SeriesContent`. This is deterministic (no `Math.random()`), always picks a show with a valid backdrop, and avoids a daily rotation (which would require date logic in a client component or additional SSR logic).

---

## Sources

### Primary (HIGH confidence)
- `types/tv.ts` — TV type definitions, `normalizeTVShow()`, `TVDetailsResponse` structure
- `lib/tmdb.ts` — All TV TMDB fetch functions verified
- `app/api/tv/route.ts` — TV list API route verified
- `app/api/tv/[id]/route.ts` — TV detail API route verified
- `hooks/use-tv.ts` — All TV hooks verified
- `hooks/use-movies.ts` — `enabled: id !== null` pattern verified
- `components/movies/movie-detail-modal.tsx` — Full modal code verified
- `components/movies/movie-row.tsx` — Props interface verified
- `components/movies/hero-banner.tsx` — Hero pattern verified
- `components/layout/app-navbar.tsx` — navLinks structure verified
- `app/(app)/discover/page.tsx` — SSR pattern verified
- `app/(app)/discover/loading.tsx` — Loading skeleton pattern verified
- `lib/constants.ts` — `TV_GENRES` constant verified as present
- `.planning/REQUIREMENTS.md` — TV-01 requirements verified
- `.planning/ROADMAP.md` — Phase 5 success criteria verified

### Secondary (MEDIUM confidence)
- TMDB community forums (themoviedb.org/talk) — TV status string values ("Returning Series", "Ended", "Canceled", etc.) — cross-referenced by multiple forum posts

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified in codebase
- Architecture: HIGH — all patterns directly observed in existing code
- TV status values: MEDIUM — from TMDB community forums, not official enum docs
- Pitfalls: HIGH — derived from direct code inspection

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (stable TMDB API, stable Next.js 16 patterns)

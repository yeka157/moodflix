---
phase: quick-2
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/tmdb.ts
  - lib/tmdb-cache.ts
  - types/movie.ts
  - app/api/movies/[id]/route.ts
  - lib/availability.ts
  - components/movies/movie-detail-page.tsx
  - components/movies/movie-detail-modal.tsx
  - components/movies/tv-detail-page.tsx
autonomous: true
requirements: [QUICK-2]

must_haves:
  truths:
    - "Movie in theaters with no digital release shows 'In theaters now' message"
    - "Movie with ended theatrical run and no streaming shows 'Not yet on streaming' message"
    - "Movie/TV with providers elsewhere but not user's country shows 'Not available in your region'"
    - "TV shows use first_air_date and status for contextual messaging"
    - "Movies/TV with watch providers still show provider tabs normally (no regression)"
  artifacts:
    - path: "lib/availability.ts"
      provides: "Pure function to determine availability status from release dates and provider data"
      exports: ["getAvailabilityStatus", "AvailabilityStatus"]
    - path: "types/movie.ts"
      provides: "ReleaseDateResult and MovieReleaseDates types for TMDB release_dates response"
      contains: "ReleaseDateResult"
    - path: "lib/tmdb.ts"
      provides: "Updated getMovieDetails with release_dates in append_to_response"
      contains: "release_dates"
  key_links:
    - from: "lib/availability.ts"
      to: "components/movies/movie-detail-page.tsx"
      via: "getAvailabilityStatus import"
      pattern: "getAvailabilityStatus"
    - from: "lib/availability.ts"
      to: "components/movies/movie-detail-modal.tsx"
      via: "getAvailabilityStatus import"
      pattern: "getAvailabilityStatus"
    - from: "lib/availability.ts"
      to: "components/movies/tv-detail-page.tsx"
      via: "getAvailabilityStatus import"
      pattern: "getAvailabilityStatus"
---

<objective>
Replace the generic "Not available for streaming in your region" message with smart contextual status messages based on TMDB release dates and TV show status.

Purpose: Users seeing a movie detail with no streaming providers currently get no useful information. By using TMDB release_dates data (movies) and status/first_air_date (TV), we can show one of three contextual messages: "In theaters now", "Not yet on streaming -- check back later", or "Not available in your region".

Output: Updated availability messaging in all 3 detail views (movie page, modal, TV page) powered by a shared utility function.
</objective>

<execution_context>
@/Users/kevin/.claude/get-shit-done/workflows/execute-plan.md
@/Users/kevin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md
@types/movie.ts
@types/tv.ts
@lib/tmdb.ts
@lib/tmdb-cache.ts
@app/api/movies/[id]/route.ts
@app/api/tv/[id]/route.ts
@app/(app)/movie/[id]/page.tsx
@app/(app)/tv/[id]/page.tsx
@components/movies/movie-detail-page.tsx
@components/movies/movie-detail-modal.tsx
@components/movies/tv-detail-page.tsx

<interfaces>
<!-- Key types and contracts the executor needs -->

From types/movie.ts:
```typescript
export type MovieDetailsWithExtras = MovieDetails & {
  credits: MovieCredits;
  "watch/providers": WatchProvidersResponse;
};

export type MovieDetailsResponse = MovieDetailsWithExtras & {
  watchProviders: WatchProviderResult | null;
  watchCountry: string;
};
```

From types/tv.ts:
```typescript
export type TVDetails = TVShow & {
  genres: { id: number; name: string }[];
  status: string;  // "Returning Series", "Ended", "Canceled", etc.
  // ...
};

export type TVDetailsResponse = TVDetailsWithExtras & {
  watchProviders: WatchProviderResult | null;
  watchCountry: string;
  mediaType: "tv";
};
```

From lib/tmdb.ts:
```typescript
export async function getMovieDetails(id: number) {
  return tmdbFetch<MovieDetailsWithExtras>(`/movie/${id}`, {
    append_to_response: "credits,watch/providers",
  });
}
```

Movie detail page props:
```typescript
interface MovieDetailPageContentProps {
  details: MovieDetailsWithExtras;
  watchProviders: WatchProviderResult | null;
  recommendations: Movie[];
  country: string;
}
```

TV detail page props:
```typescript
interface TVDetailPageContentProps {
  details: TVDetailsWithExtras;
  watchProviders: WatchProviderResult | null;
  country: string;
}
```

The modal fetches details via API routes (`/api/movies/[id]` and `/api/tv/[id]`) through TanStack Query hooks (`useMovieDetails`, `useTVDetails`). The API routes spread the full TMDB response, so any new fields added to `append_to_response` will automatically flow through to the modal.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add release_dates to TMDB fetch and create availability utility</name>
  <files>types/movie.ts, lib/tmdb.ts, lib/tmdb-cache.ts, lib/availability.ts</files>
  <action>
1. **types/movie.ts** -- Add TMDB release_dates types:
```typescript
export type ReleaseDateEntry = {
  certification: string;
  descriptors: string[];
  iso_639_1: string;
  note: string;
  release_date: string;  // ISO date string
  type: number;          // 1=Premiere, 2=Theatrical Limited, 3=Theatrical, 4=Digital, 5=Physical, 6=TV
};

export type ReleaseDateResult = {
  iso_3166_1: string;    // Country code
  release_dates: ReleaseDateEntry[];
};

export type MovieReleaseDatesResponse = {
  id: number;
  results: ReleaseDateResult[];
};
```

Update `MovieDetailsWithExtras` to include the new field:
```typescript
export type MovieDetailsWithExtras = MovieDetails & {
  credits: MovieCredits;
  "watch/providers": WatchProvidersResponse;
  release_dates?: MovieReleaseDatesResponse;
};
```
Make `release_dates` optional so existing cached data without it still works.

2. **lib/tmdb.ts** -- Update `getMovieDetails` to include `release_dates` in `append_to_response`:
```typescript
append_to_response: "credits,watch/providers,release_dates"
```

3. **lib/tmdb-cache.ts** -- The cache stores full TMDB responses. The `getCachedMovieDetails` function calls `getMovieDetails` on cache miss, so newly fetched data will include `release_dates`. No structural changes needed to the cache layer -- the JSONB column already stores the full response. But verify that the cache read path deserializes the full object (it should since it stores the raw TMDB response).

4. **lib/availability.ts** -- Create a new pure utility module with:

```typescript
import type { ReleaseDateResult } from "@/types/movie";
import type { WatchProviderResult } from "@/types/movie";

export type AvailabilityStatus =
  | { type: "available" }           // Has providers -- show normal tabs
  | { type: "in_theaters" }         // Recent theatrical, no digital yet
  | { type: "not_yet_streaming" }   // Theatrical ended, no digital/streaming
  | { type: "not_in_region" };      // No providers in user's country

export function getMovieAvailabilityStatus(opts: {
  watchProviders: WatchProviderResult | null;
  releaseDates?: ReleaseDateResult[];
  country: string;
  releaseDate?: string;  // Movie release_date field as fallback
}): AvailabilityStatus
```

Logic:
- If `watchProviders` has any flatrate/rent/buy entries, return `{ type: "available" }`.
- Extract user's country release dates from `releaseDates` array (match `iso_3166_1` to `country`). Fall back to US releases if country not found.
- Check for theatrical release (type 2 or 3). Check for digital release (type 4) or physical (type 5) or TV (type 6).
- If theatrical exists but no digital/physical/TV release:
  - Parse the theatrical release date. If within last 120 days (typical theatrical window), return `{ type: "in_theaters" }`.
  - If older than 120 days, return `{ type: "not_yet_streaming" }`.
- If no release_dates data at all, fall back to the movie's `release_date` field:
  - If within last 120 days, return `{ type: "in_theaters" }`.
  - If older, return `{ type: "not_in_region" }`.
- Default: return `{ type: "not_in_region" }`.

Also export a simpler function for TV:
```typescript
export function getTVAvailabilityStatus(opts: {
  watchProviders: WatchProviderResult | null;
  status: string;          // TVDetails.status
  firstAirDate?: string;   // TVShow.first_air_date
}): AvailabilityStatus
```

TV logic:
- If has providers, return `{ type: "available" }`.
- If status is "In Production" or "Planned" or "Pilot", return `{ type: "not_yet_streaming" }`.
- If status is "Returning Series" and first_air_date is within the last year, return `{ type: "not_yet_streaming" }` (still airing, streaming may come later).
- Default: return `{ type: "not_in_region" }`.
  </action>
  <verify>
    <automated>cd /Users/kevin/Repository/moodflix && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>Types compile cleanly. `lib/availability.ts` exports `getMovieAvailabilityStatus` and `getTVAvailabilityStatus`. `getMovieDetails` now fetches `release_dates` alongside credits and watch providers.</done>
</task>

<task type="auto">
  <name>Task 2: Update all 3 detail views with contextual availability messages</name>
  <files>components/movies/movie-detail-page.tsx, components/movies/movie-detail-modal.tsx, components/movies/tv-detail-page.tsx</files>
  <action>
Replace the generic "Not available for streaming in your region" `<p>` element in all 3 files with a shared inline pattern using the availability utility.

**For movie-detail-page.tsx:**
- Import `getMovieAvailabilityStatus` from `@/lib/availability`.
- Before the watch providers section, compute:
  ```typescript
  const availability = getMovieAvailabilityStatus({
    watchProviders,
    releaseDates: details.release_dates?.results,
    country,
    releaseDate: details.release_date,
  });
  ```
- Replace the `else` branch (lines ~388-391) that currently shows "Not available for streaming in your region" with:
  ```tsx
  ) : (
    <div className="text-sm text-muted-foreground space-y-1">
      {availability.type === "in_theaters" && (
        <p>In theaters now — not yet available for streaming</p>
      )}
      {availability.type === "not_yet_streaming" && (
        <p>Not yet on streaming — check back later</p>
      )}
      {availability.type === "not_in_region" && (
        <p>Not available for streaming in your region</p>
      )}
    </div>
  )}
  ```
  Import `Film, Clock, Globe` from lucide-react. Add icons before each message:
  - `in_theaters`: `<Film className="inline h-4 w-4 mr-1.5 align-text-bottom" />`
  - `not_yet_streaming`: `<Clock className="inline h-4 w-4 mr-1.5 align-text-bottom" />`
  - `not_in_region`: `<Globe className="inline h-4 w-4 mr-1.5 align-text-bottom" />`

**For movie-detail-modal.tsx:**
- The modal handles both movie and TV. It already has `isTV` boolean and conditionally uses `useMovieDetails` or `useTVDetails`.
- For movies: same pattern as above, compute `getMovieAvailabilityStatus` using the details from the API response (which includes `release_dates` since the API route spreads the full TMDB response).
- For TV: compute `getTVAvailabilityStatus` using `details.status` and `details.first_air_date` from the TV response.
- The modal accesses details via `movieDetails` or `tvDetails` data objects. Compute availability status conditionally:
  ```typescript
  const availability = isTV
    ? getTVAvailabilityStatus({
        watchProviders,
        status: (tvDetails as TVDetailsResponse)?.status ?? "",
        firstAirDate: (tvDetails as TVDetailsResponse)?.first_air_date,
      })
    : getMovieAvailabilityStatus({
        watchProviders,
        releaseDates: (movieDetails as MovieDetailsResponse & { release_dates?: MovieReleaseDatesResponse })?.release_dates?.results,
        country: (movieDetails as MovieDetailsResponse)?.watchCountry ?? "US",
        releaseDate: (movieDetails as MovieDetailsResponse)?.release_date,
      });
  ```
- Replace the `else` branch (~line 776-779) with the same 3-state message pattern.

**For tv-detail-page.tsx:**
- Import `getTVAvailabilityStatus` from `@/lib/availability`.
- Compute: `const availability = getTVAvailabilityStatus({ watchProviders, status: details.status, firstAirDate: details.first_air_date });`
- Replace the `else` branch (~line 472-475) with the same 3-state message pattern (TV will only ever show `not_yet_streaming` or `not_in_region`, never `in_theaters`).

**Important:** Keep the existing `hasStream`, `hasRent`, `hasBuy` logic and `<Tabs>` rendering completely unchanged. Only modify the `else` fallback branch.
  </action>
  <verify>
    <automated>cd /Users/kevin/Repository/moodflix && npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>All 3 detail views show contextual availability messages. Movies with recent theatrical release show "In theaters now". Movies past theatrical window with no streaming show "Not yet on streaming". All others show "Not available in your region". TV shows use status-based logic. Build passes with no errors.</done>
</task>

</tasks>

<verification>
1. `npm run build` passes with no TypeScript or lint errors
2. Open a movie currently in theaters (e.g., a new release) -- should show "In theaters now" with Film icon
3. Open a movie that was in theaters months ago but has no streaming providers -- should show "Not yet on streaming" with Clock icon
4. Open a movie/TV show with no providers in your region -- should show "Not available in your region" with Globe icon
5. Open a movie WITH streaming providers -- should show normal provider tabs (no regression)
6. Check the modal view for both movies and TV shows -- same contextual messages appear
</verification>

<success_criteria>
- Zero TypeScript errors on build
- Three distinct contextual messages replace the single generic message
- Each message has an appropriate lucide icon
- TV shows use status-based logic (not release_dates)
- Movies use TMDB release_dates with country-aware fallback
- No regression: movies/TV with providers still show provider tabs normally
</success_criteria>

<output>
After completion, create `.planning/quick/2-improve-ux-for-movies-with-no-watch-prov/2-SUMMARY.md`
</output>

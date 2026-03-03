# Phase 11: Discovery UX - Research

**Researched:** 2026-03-03
**Domain:** TV search integration, sidebar label edit, TMDB rating display
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **TV Search on /series**: Mirror `/discover` search exactly — same bar position, same debounced live results, same interaction pattern. Standalone text search — ignores genre toggle filters; typing a query replaces all browse rows. Clearing the query restores the previous genre/browse view. Search results displayed as a poster grid (matching `/discover` search results layout).
- **Rating Display Format**: Show rating on detail pages only (movie and TV) — cards stay clean with just poster/title. Replace existing star rating entirely with "X.X/10" numeric format — no stars alongside. Hide rating completely (no element rendered) when `vote_count <= 10`.
- **Sidebar Label Rename**: Rename "Discover" to "Movies" — label text only. Route `/discover` unchanged. No tooltip/aria changes, no other nav label tweaks.

### Claude's Discretion

- No-results empty state messaging for TV search
- Visual treatment of X.X/10 on detail pages (icon pairing, typography, placement)
- Search bar visual styling details

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DISC-01 | TV series page has a search bar for searching TV shows — typing a query returns matching TV shows, replacing the browse rows while the query is active | TV search hook needed (`useTVSearchInfinite`); `/api/tv` route needs `query` param; `SeriesGridContent` pattern is the template |
| DISC-02 | Sidebar nav label "Discover" renamed to "Movies" (route /discover unchanged) | Two files contain the "Discover" label: `app-sidebar.tsx` (line 35) and `bottom-tab-bar.tsx` (line 17) — one-line edit each |
| DISC-03 | TMDB rating displayed as "X.X/10" format instead of ambiguous star rating — only shown when vote_count > 10 | Both detail pages already compute `rating = details.vote_average?.toFixed(1)` and render `{rating} ★`; `vote_count` is present in both `MovieDetails` and `TVDetails` types |
</phase_requirements>

---

## Summary

Phase 11 is three narrow, targeted changes with no new routes, pages, or data sources. All the infrastructure already exists — the phase is primarily about wiring a TV search hook and API endpoint, updating two label strings, and changing the rating badge format in two components.

**Task 1 (DISC-01)** is the only substantive engineering work. The `/discover` page uses `useMovieSearchInfinite` backed by `/api/movies?query=...`. The `/series` page's `SeriesGridContent` currently has no search. The pattern to replicate is well-defined: debounced input → `useInfiniteQuery` → replace browse rows when query is active. The TMDB `/search/tv` endpoint exists and the existing `tmdbFetch` helper handles it cleanly. The only missing pieces are: (a) a `searchTV` function in `lib/tmdb.ts`, (b) a query handler in `/api/tv/route.ts`, and (c) a `useTVSearchInfinite` hook in `hooks/use-tv.ts`.

**Task 2 (DISC-02)** is a one-line text change in two layout component files. The `navLinks` array in `app-sidebar.tsx` has `label: "Discover"` at line 35 and `bottom-tab-bar.tsx` has the same at line 17. Both must be updated to `"Movies"`.

**Task 3 (DISC-03)** is a conditional render change in two detail page components. Both `movie-detail-page.tsx` (line 286) and `tv-detail-page.tsx` (line 364) currently render `{rating} ★` inside a `<Badge>`. The fix is: wrap in a conditional that checks `details.vote_count > 10`, and change the content from `{rating} ★` to `{rating}/10`.

**Primary recommendation:** Implement as three sequential tasks. DISC-01 requires the most files (4: tmdb.ts, api/tv/route.ts, hooks/use-tv.ts, series-grid-content.tsx); DISC-02 and DISC-03 are single-file-group edits.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TanStack Query (`@tanstack/react-query`) | already installed | infinite query + debounced search | already used for all movie/TV data fetching |
| `use-debounce` | already installed | 300ms debounce on search input | already used in `DiscoverGridContent` |
| `react-infinite-scroll-hook` | already installed | sentinel-based infinite scroll | already used in both `DiscoverGridContent` and `SeriesGridContent` |
| `lucide-react` | already installed | Search, X, Loader2, AlertCircle icons | already used in `DiscoverGridContent` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TMDB `/search/tv` endpoint | TMDB API v3 | TV show full-text search | When user enters a search query on /series page |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Adding search to `/api/tv` route | Creating a new `/api/tv/search` route | Single route is cleaner; matches how movie search is handled in `/api/movies` |
| Inline search state in `SeriesGridContent` | Extracting to a new `series-search.tsx` component | Inline matches how `DiscoverGridContent` is structured; no reason to split |

**Installation:** No new packages required — all dependencies are already present.

---

## Architecture Patterns

### Recommended Project Structure

No new files/folders needed for DISC-02 or DISC-03. For DISC-01, changes touch:

```
lib/
  tmdb.ts                        # add searchTV() function
app/api/tv/
  route.ts                       # add ?query= handler
hooks/
  use-tv.ts                      # add useTVSearchInfinite hook + tvKeys.search
components/series/
  series-grid-content.tsx        # add search bar + search-active state + search results path
```

### Pattern 1: TV Search Infinite Hook (mirrors useMovieSearchInfinite)

**What:** TanStack `useInfiniteQuery` with `enabled: query.length >= 2`, `placeholderData: keepPreviousData`, 2-minute stale time.
**When to use:** When `debouncedQuery.length >= 2` — same threshold as movie search.

```typescript
// hooks/use-tv.ts addition
export const tvKeys = {
  // ... existing keys
  search: (query: string) => [...tvKeys.all, "search", query] as const,
};

async function fetchTVSearch(query: string, page: number): Promise<TVListResponse> {
  const res = await fetch(`/api/tv?query=${encodeURIComponent(query)}&page=${page}`);
  if (!res.ok) throw new Error("Failed to search TV shows");
  return res.json();
}

export function useTVSearchInfinite(query: string) {
  return useInfiniteQuery({
    queryKey: [...tvKeys.search(query), "infinite"],
    queryFn: async ({ pageParam }) => {
      const data = await fetchTVSearch(query, pageParam);
      return { ...data, results: data.results.map(normalizeTVShow) };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    enabled: query.length >= 2,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}
```

### Pattern 2: TMDB TV Search Function (mirrors searchMovies)

```typescript
// lib/tmdb.ts addition
export async function searchTV(query: string, page = 1) {
  return tmdbFetch<TVListResponse>("/search/tv", {
    query,
    page: String(page),
    include_adult: "false",
  });
}
```

### Pattern 3: /api/tv route — add query handler

```typescript
// app/api/tv/route.ts — add before action check
const query = searchParams.get("query");

if (query) {
  const data = await searchTV(query, page);
  return Response.json(data);
}
```

### Pattern 4: SeriesGridContent — search integration

The key behavioral requirement from CONTEXT.md: typing a query replaces ALL browse rows (not just the grid at the bottom). The `SeriesPage` server component renders both `<SeriesContent>` (the curated rows) and `<SeriesGridContent>` (the filter grid). The search bar lives inside `SeriesGridContent`.

Two approaches for "search replaces browse rows":

**Option A (recommended):** Lift search state to `SeriesPage` and pass `isSearchActive` as a prop to `SeriesContent` to hide it. However, `SeriesPage` is a Server Component — can't hold client state.

**Option B (recommended, cleaner):** Move the search bar out of `SeriesGridContent` and place it directly in a new `SeriesPageContent` client wrapper component that manages search state. When `isSearchActive`, it renders only the search results (hiding both `SeriesContent` rows and `SeriesGridContent`). When not active, it renders `SeriesContent` + `SeriesGridContent` normally.

**Option C (simplest, still valid):** Keep search inside `SeriesGridContent` but accept that searching only replaces the grid section, not the curated rows above. However, CONTEXT.md says "typing a query replaces all browse rows" — so the curated rows must also be hidden.

The decision between B and C is marked as Claude's discretion for the "search bar position". Given the explicit CONTEXT.md wording that all browse rows should be replaced, **Option B is the correct architecture**: create a `SeriesPageContent` client wrapper that coordinates the header+curated rows+grid visibility based on search state.

```typescript
// components/series/series-page-content.tsx (new client wrapper)
"use client";

export function SeriesPageContent({ trending, korean, chinese, topRated }) {
  const [inputValue, setInputValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debouncedSetQuery = useDebouncedCallback((v) => setDebouncedQuery(v), 300);
  const isSearchActive = debouncedQuery.length >= 2;

  return (
    <div>
      {/* Search bar — always visible */}
      <SearchBar ... />

      {/* Curated rows — hidden when search active */}
      {!isSearchActive && (
        <SeriesContent trending={trending} ... />
      )}

      {/* Browse All section header — hidden when search active */}
      {!isSearchActive && <h2>Browse All</h2>}

      {/* Grid content — passes search state down */}
      <SeriesGridContent
        searchQuery={debouncedQuery}
        isSearchActive={isSearchActive}
      />
    </div>
  );
}
```

Alternatively, simpler: `SeriesGridContent` manages its own search state and, when search is active, the parent curated rows are hidden by passing a shared state variable. The cleanest split is the `SeriesPageContent` wrapper approach.

### Pattern 5: Rating Display (DISC-03)

**Current code** in both detail pages:
```tsx
// line 286 movie-detail-page.tsx, line 364 tv-detail-page.tsx
<Badge variant="secondary" className="text-sm px-3 py-1">
  {rating} ★
</Badge>
```

**Required replacement:**
```tsx
{(details.vote_count ?? 0) > 10 && (
  <Badge variant="secondary" className="text-sm px-3 py-1">
    {rating}/10
  </Badge>
)}
```

The `vote_count` field is present on both `MovieDetails` (line 37 of `types/movie.ts`) and `TVShow` (line 17 of `types/tv.ts`), so no type changes needed.

### Pattern 6: Sidebar Label Rename (DISC-02)

Two files contain the `navLinks` array with `label: "Discover"`:

1. `components/layout/app-sidebar.tsx` line 35: `label: "Discover"` → `label: "Movies"`
2. `components/layout/bottom-tab-bar.tsx` line 17: `label: "Discover"` → `label: "Movies"`

The route (`href: "/discover"`) and icon (`Compass`) do not change. Per CONTEXT.md, no aria/tooltip changes.

### Anti-Patterns to Avoid

- **Do not add search to `SeriesGridContent` and hide curated rows via CSS**: Search state must be lifted to coordinate visibility of both the curated row section and the grid section.
- **Do not use a completely separate search route**: Pattern in this codebase is to add `?query=` to existing category API routes (matches `/api/movies` pattern).
- **Do not render `{rating}/10` unconditionally**: Must check `vote_count > 10` — new entries and obscure titles with < 10 votes would show meaningless ratings.
- **Do not show rating badge as `0.0/10`**: The existing fallback `?? "0.0"` must be inside the `vote_count > 10` guard — if the guard passes but vote_average is 0, "0.0/10" is still misleading. Since TMDB won't have `vote_count > 10` with `vote_average === 0` in practice, the existing fallback is safe.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Debounced search input | Custom setTimeout logic | `useDebouncedCallback` from `use-debounce` | Already installed, handles cleanup and cancellation correctly |
| Infinite scroll sentinel | IntersectionObserver manual hook | `react-infinite-scroll-hook` | Already installed, same pattern as discover grid |
| Deduplication of TV search results | Custom logic | Same `dedupeShows` pattern from `SeriesGridContent` | TMDB can return duplicates across pages; pattern already exists in codebase |

**Key insight:** The entire search pattern (debounce → infinite query → dedupe → sentinel) already exists in `DiscoverGridContent`. Copy the pattern, adapt for TV types.

---

## Common Pitfalls

### Pitfall 1: Search State Isolation vs. Shared Hide Logic

**What goes wrong:** Placing the search bar inside `SeriesGridContent` means the curated rows (`SeriesContent`) above it remain visible even when search is active — violating the CONTEXT.md requirement that "typing a query replaces all browse rows."
**Why it happens:** `SeriesGridContent` is a child of `SeriesPage`, and state doesn't flow upward.
**How to avoid:** Create a `SeriesPageContent` client wrapper component that owns search state and conditionally renders `SeriesContent` and the "Browse All" heading when not searching.
**Warning signs:** If you find yourself passing props down from a Server Component to manage client state, you've hit this issue.

### Pitfall 2: vote_count May Be 0 or Undefined on Certain Responses

**What goes wrong:** `vote_count` is defined in the types but TMDB occasionally returns `0` for brand-new entries. Using `vote_count > 10` correctly handles both `0` and undefined (via `?? 0`).
**Why it happens:** TMDB populates `vote_count` from user submissions; new entries have 0.
**How to avoid:** Use `(details.vote_count ?? 0) > 10` — the nullish coalescing handles any undefined case, though TypeScript types currently define it as non-optional `number`.
**Warning signs:** Rating badge rendering `0.0/10` for real entries.

### Pitfall 3: TVListResponse vs. MovieListResponse type mismatch in search results

**What goes wrong:** `useTVSearchInfinite` returns `TVListResponse` pages but the grid (`MovieGrid`) expects `Movie[]`. The `normalizeTVShow` mapper already handles this in the existing `useDiscoverTV` — it must also run in the search query function.
**Why it happens:** TV shows have different field names (`name` vs `title`, `first_air_date` vs `release_date`).
**How to avoid:** Apply `data.results.map(normalizeTVShow)` inside the `queryFn` of `useTVSearchInfinite`, matching the pattern in `useDiscoverTV`.
**Warning signs:** TypeScript errors on `MovieGrid` props or undefined `title` on rendered cards.

### Pitfall 4: Bottom tab bar also has "Discover" label

**What goes wrong:** Only updating `app-sidebar.tsx` and forgetting `bottom-tab-bar.tsx` — mobile users still see "Discover" in the bottom navigation.
**Why it happens:** The label is duplicated across two independent nav components.
**How to avoid:** Update both files in the same task. Both contain a `navLinks` array with `label: "Discover"` for the `/discover` route.
**Warning signs:** Desktop shows "Movies" but mobile bottom bar still shows "Discover".

### Pitfall 5: Search bar replaces only the grid, not "Browse All" heading

**What goes wrong:** When search is active, the "Browse All" `<h2>` heading and description paragraph in `SeriesPage` remain visible above search results.
**Why it happens:** The `SeriesPage` JSX renders `<h2>Browse All</h2>` directly, separate from `SeriesGridContent`.
**How to avoid:** The `SeriesPageContent` wrapper component must also hide the "Browse All" heading section when `isSearchActive` is true.
**Warning signs:** "Browse All / Filter and sort all TV shows" heading visible above TV search results.

---

## Code Examples

Verified patterns from codebase:

### Existing movie search pattern (reference for TV search)

```typescript
// Source: hooks/use-movies.ts (lines 214-226)
export function useMovieSearchInfinite(query: string) {
  return useInfiniteQuery({
    queryKey: [...movieKeys.search(query), "infinite"],
    queryFn: ({ pageParam }) => fetchMovieSearch(query, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    enabled: query.length >= 2,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}
```

### Existing deduplication pattern (reuse for TV search results)

```typescript
// Source: components/series/series-grid-content.tsx (lines 58-80)
function dedupeShows(pages: { results: Movie[] }[] | undefined): Movie[] {
  if (!pages) return [];
  const seen = new Set<number>();
  const result: Movie[] = [];
  for (const page of pages) {
    for (const show of page.results) {
      if (!seen.has(show.id)) {
        seen.add(show.id);
        result.push(show);
      }
    }
  }
  return result;
}
```

### Existing search bar UI pattern (copy from DiscoverGridContent)

```tsx
// Source: components/movies/discover-grid-content.tsx (lines 143-171)
<div className="max-w-full sm:max-w-xl">
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
    <Input
      type="text"
      placeholder="Search for movies..."
      value={inputValue}
      onChange={handleInputChange}
      className="h-12 text-base pl-10 pr-10"
    />
    {inputValue && (
      <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10"
        onClick={handleClear} disabled={searchQuery.isFetching} aria-label="Clear search">
        {searchQuery.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
      </Button>
    )}
  </div>
</div>
```

### Rating badge — current (to replace)

```tsx
// Source: components/movies/movie-detail-page.tsx line 285-288
//         components/movies/tv-detail-page.tsx line 363-365
<Badge variant="secondary" className="text-sm px-3 py-1">
  {rating} ★
</Badge>
```

### Rating badge — new format

```tsx
{(details.vote_count ?? 0) > 10 && (
  <Badge variant="secondary" className="text-sm px-3 py-1">
    {rating}/10
  </Badge>
)}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Star rating display (`{rating} ★`) | Numeric format (`{rating}/10`) with vote_count guard | Phase 11 | Users see the actual score scale; low-sample entries hidden |
| No search on /series | TV search with same UX as /discover | Phase 11 | Users can find specific TV shows by name |
| "Discover" sidebar label | "Movies" sidebar label | Phase 11 | Label accurately describes the page content |

---

## Open Questions

1. **Should the TV search placeholder say "Search TV shows..." or "Search series..."?**
   - What we know: The page is named "Series"; `/discover` uses "Search for movies..."
   - What's unclear: User-facing language preference
   - Recommendation: Use "Search TV shows..." — it's more universally understood than "series"

2. **Should rating display include an icon (e.g., Star from lucide-react) alongside "X.X/10"?**
   - What we know: CONTEXT.md leaves visual treatment to Claude's discretion
   - What's unclear: Whether a small star or no icon looks better in the Badge context
   - Recommendation: Keep it text-only ("7.8/10") — cleaner than mixing icon + text inside a small Badge; the "/10" suffix makes the scale self-evident

3. **When TV search results are displayed as a grid, should clicking a card navigate to `/tv/[id]` or open a drawer?**
   - What we know: The `/discover` movie search opens a `MovieSearchDrawer` on click; CONTEXT.md says "search results displayed as a poster grid (matching /discover search results layout)"
   - What's unclear: Whether "matching /discover layout" means drawer behavior or link navigation
   - Recommendation: Use `hrefPrefix="/tv/"` for link-based navigation, matching the `SeriesGridContent` discover grid. The `/discover` movie search drawer is a movie-specific component (`MovieSearchDrawer`) that doesn't exist for TV. Direct navigation is simpler and consistent with the existing TV card behavior elsewhere.

---

## Sources

### Primary (HIGH confidence)

- Direct codebase inspection — `components/movies/discover-grid-content.tsx` — complete search pattern
- Direct codebase inspection — `components/layout/app-sidebar.tsx` lines 26-51 — label location
- Direct codebase inspection — `components/layout/bottom-tab-bar.tsx` lines 8-33 — label location
- Direct codebase inspection — `components/movies/movie-detail-page.tsx` line 286 — rating display
- Direct codebase inspection — `components/movies/tv-detail-page.tsx` line 364 — rating display
- Direct codebase inspection — `types/movie.ts` line 37, `types/tv.ts` line 17 — `vote_count` field presence
- Direct codebase inspection — `hooks/use-tv.ts`, `lib/tmdb.ts` — missing `searchTV` function confirmed
- Direct codebase inspection — `app/api/tv/route.ts` — no `?query=` handler confirmed

### Secondary (MEDIUM confidence)

- TMDB API v3 docs (training knowledge, cross-verified with codebase usage): `/search/tv` endpoint accepts `query`, `page`, `include_adult` params — same interface as `/search/movie`

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies already installed and in use
- Architecture: HIGH — patterns copied from existing codebase; no new concepts
- Pitfalls: HIGH — identified from direct code inspection, not speculation

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (stable codebase)

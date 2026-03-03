# Phase 10: TV Watchlisting & Watchlist UX - Research

**Researched:** 2026-03-03
**Domain:** TanStack Query cache management, media-type-aware watchlist hooks, library UX filtering
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Type Badge Design**
- Small pill/tag overlaid on the poster, top-left corner
- Text labels: "TV" and "Movie"
- Both types always show their badge (not TV-only)
- Appears on library cards (scope for other pages is Claude's discretion)

**TV Detail Page Actions**
- Action icons (bookmark, watched/CircleCheck, like/dislike, remove) match the movie detail page exactly — same icons, same positions, same behavior
- Only 2 statuses exist: **Want to Watch** and **Watched** (no "Watching" status)
- Same icon placement as `/movie/[id]` (fixed bottom action bar)
- Show TV-specific metadata: number of seasons and episode count

**Instant Sync Behavior**
- Optimistic updates — icon updates immediately, rolls back on server failure
- Subtle transition animation (color fade or scale pulse) when a card's state syncs
- All status/rating changes keep the card visible in the current grid — card stays in place, flags update
- Only explicit "remove" hides the card
- Animated fade-out when a card is removed from the library

**Library Filtering UX**
- Two-row layout: media type filter row above, status tabs below
- Media type options: All / Movies / TV Shows
- Type filter applies globally; status tabs filter within the selected type
- Show item counts on each type filter — e.g. "All (24)", "Movies (18)", "TV Shows (6)"

### Claude's Discretion
- Badge pill color scheme (same muted style for both, or distinct tints per type)
- Badge scope beyond library cards (whether to show on home/discover/series pages)
- Media type filter row style (pill toggle group, segmented control, or other)
- Empty state design and CTAs for filtered views with 0 items
- Exact transition animation implementation for sync feedback
- Loading skeleton adjustments for new filter controls

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TVWL-01 | User can add a TV show to their library from `/tv/[id]` | `TVDetailPageContent` needs watchlist hooks wired in with `mediaType: "tv"` |
| TVWL-02 | User can mark a TV show as "watched" from `/tv/[id]` | Same hook calls as movie detail page, `status: "watched"` |
| TVWL-03 | User can like/dislike a TV show from `/tv/[id]` | `useRateWatchlistItem` — identical to movie page |
| TVWL-04 | User can remove a TV show from their library | `useRemoveFromWatchlist` — identical to movie page |
| TVWL-05 | Library cards for TV shows link to `/tv/[id]` (not `/movie/[id]`) | `WatchlistCard` reads `item.mediaType` to choose href |
| TVWL-06 | Library cards display "TV" or "Movie" type badge | New overlay pill on `WatchlistCard` poster image |
| WLUX-01 | Watchlist state (bookmark/watched icons) updates instantly on all movie/TV cards across pages | `useWatchlistTmdbIds` + invalidation on mutate — already works for movies, needs media-type disambiguation |
| WLUX-02 | Adding/changing status does not remove the card from current grid | `useUpdateWatchlistStatus` optimistic update already keeps card in all-list cache; library filter logic must not remove cards on status change |
| WLUX-03 | Library page has media type filter (All / Movies / TV Shows) alongside status tabs | New state in `WatchlistContent`, counts derived from full unfiltered data |
</phase_requirements>

---

## Summary

Phase 10 is a surface-area expansion phase built on a solid, already-working foundation. The schema migration (Phase 9) is complete: `media_type` column exists with `DEFAULT 'movie'`, the unique constraint is `watchlist_user_tmdb_media_unique` on `(userId, tmdbId, mediaType)`, and all server actions already accept and return `mediaType`. The TypeScript types (`WatchlistItem.mediaType`, `WatchlistTmdbEntry.mediaType`) are also correct.

The main work splits into three areas. First, wire up the TV detail page (`TVDetailPageContent`) with watchlist mutations — this is a near-copy of `MovieDetailPageContent`'s fixed bottom action bar, with `mediaType: "tv"` passed to `addToWatchlist`. Second, fix three correctness issues in existing hooks: `useWatchlistCheck` is not media-type-aware (a TV show and a movie can share the same TMDB ID), `useWatchlistTmdbIds` lookup in `MovieCard` does not filter by media type (a TV entry would incorrectly light up a movie card with the same TMDB ID), and `WatchlistCard` hardcodes `/movie/[id]` for the link. Third, add the library type filter row with item counts.

The "instant cross-page sync" requirement (WLUX-01) is already the architectural approach: `useWatchlistTmdbIds` is a shared TanStack Query key that all cards subscribe to. Every mutation calls `queryClient.invalidateQueries({ queryKey: watchlistKeys.all })` on settle. This means when you add a TV show from `/tv/[id]`, the `tmdbIds` cache refetches, and every `MovieCard` on every page re-renders. The only missing piece is ensuring TV cards on the series page also use `useWatchlistTmdbIds` correctly (which they do via `MovieCard`).

**Primary recommendation:** Wire `TVDetailPageContent` with watchlist mutations, fix the media-type disambiguation in `useWatchlistCheck` and `useWatchlistTmdbIds` lookups, update `WatchlistCard` links, and add the type filter row to `WatchlistContent`. No new libraries needed.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TanStack Query | `^5.x` (already installed) | Cache management, optimistic updates, cross-page sync | Already used for all watchlist mutations; shared query keys are the sync mechanism |
| Framer Motion | `^11.x` (already installed) | Fade-out animation on card removal, sync pulse animation | Already used in `WatchlistContent` AnimatePresence and `MovieCard` |
| shadcn/ui ToggleGroup | already installed (`toggle-group.tsx` exists) | Media type filter pill row | Already in codebase; used on Discover page |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `sonner` | already installed | Toast feedback on add/remove | Already used in every mutation handler |
| `lucide-react` | already installed | Bookmark, CircleCheck, ThumbsUp, ThumbsDown icons | Matches existing icon pattern exactly |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ToggleGroup for type filter | shadcn Tabs | Tabs already used for status — second Tabs row is visually confusing; ToggleGroup reads as a filter control |
| Client-side count derivation | Server-side counts | Client counts from cached `useWatchlist()` data are instant; server roundtrip adds latency |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended Project Structure

No new directories needed. All changes are additive to existing files:

```
hooks/
  use-watchlist.ts          ← Fix media-type disambiguation in check/tmdbIds lookups
actions/
  watchlist.ts              ← Fix getWatchlistItemByTmdbId to accept mediaType param
types/
  watchlist.ts              ← Add WatchlistMediaFilter type
components/
  movies/
    tv-detail-page.tsx      ← Wire watchlist mutations (bottom action bar)
  watchlist/
    watchlist-content.tsx   ← Add media type filter row
    watchlist-card.tsx      ← Fix href, add type badge
```

### Pattern 1: Media-Type Aware Watchlist Check

**What:** `useWatchlistCheck` currently queries `getWatchlistItemByTmdbId(tmdbId)` with no media type filter. Since the unique constraint is now `(userId, tmdbId, mediaType)`, a user can have both a movie and a TV show with the same TMDB ID. The check hook must include `mediaType` to return the correct item.

**When to use:** On every detail page (`/movie/[id]`, `/tv/[id]`) and the modal.

**Impact on existing code:**
- `getWatchlistItemByTmdbId` in `actions/watchlist.ts` needs a `mediaType` param
- `useWatchlistCheck` needs a `mediaType` param
- `watchlistKeys.check` needs to include `mediaType` in the key
- `MovieDetailPageContent`, `MovieDetailModal`, and the new `TVDetailPageContent` actions all need to pass the correct `mediaType`

**Example:**
```typescript
// actions/watchlist.ts
export async function getWatchlistItemByTmdbId(
  tmdbId: number,
  mediaType: MediaType = "movie",
): Promise<WatchlistItem | null> {
  const userId = await getAuthUserId();
  if (!userId) return null;

  const rows = await db
    .select()
    .from(watchlist)
    .where(
      and(
        eq(watchlist.userId, userId),
        eq(watchlist.tmdbId, tmdbId),
        eq(watchlist.mediaType, mediaType),
      ),
    )
    .limit(1);

  return rows.length > 0 ? serializeItem(rows[0]) : null;
}

// hooks/use-watchlist.ts
export const watchlistKeys = {
  ...
  check: (tmdbId: number, mediaType: MediaType = "movie") =>
    [...watchlistKeys.all, "check", tmdbId, mediaType] as const,
};

export function useWatchlistCheck(tmdbId: number, mediaType: MediaType = "movie") {
  return useQuery({
    queryKey: watchlistKeys.check(tmdbId, mediaType),
    queryFn: () => getWatchlistItemByTmdbId(tmdbId, mediaType),
    enabled: tmdbId > 0,
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
```

**Callers to update:**
- `MovieDetailPageContent`: `useWatchlistCheck(details.id)` → `useWatchlistCheck(details.id, "movie")`
- `MovieDetailModal`: `useWatchlistCheck(movie?.id ?? 0)` → `useWatchlistCheck(movie?.id ?? 0, mediaType)` (already has `mediaType` prop)
- New TV actions: `useWatchlistCheck(details.id, "tv")`

**Optimistic update in `useAddToWatchlist`:** The `setQueryData` call that writes to the `check` cache must also use the new key signature:
```typescript
queryClient.setQueryData<WatchlistItem>(
  watchlistKeys.check(newItem.tmdbId, newItem.mediaType ?? "movie"),
  { ... }
);
```
And the rollback:
```typescript
queryClient.setQueryData(
  watchlistKeys.check(newItem.tmdbId, newItem.mediaType ?? "movie"),
  context.previousCheck,
);
```

### Pattern 2: Media-Type Disambiguation in MovieCard

**What:** `MovieCard` uses `useWatchlistTmdbIds()` and does `tmdbEntries?.find((e) => e.tmdbId === movie.id)`. If a user has a TV show with TMDB ID 1234, and a movie grid shows a movie also with TMDB ID 1234 (unlikely but possible with TMDB's shared ID space across media types), the movie card would incorrectly appear bookmarked.

**Current code in `movie-card.tsx`:**
```typescript
const entry = tmdbEntries?.find((e) => e.tmdbId === movie.id);
```

**Fix:** Also filter by `mediaType`. `MovieCard` is always used for movies on the Movies/Discover/Home pages, and for TV shows on the Series page. The `MovieCard` component has no `mediaType` prop today.

**Decision needed (Claude's discretion):** Add a `mediaType?: "movie" | "tv"` prop to `MovieCard` and pass it wherever the card is used for TV content, OR derive it from context. Simpler approach: add the prop with default `"movie"` and update the Series page to pass `mediaType="tv"`.

```typescript
// movie-card.tsx
interface MovieCardProps {
  movie: Movie;
  mediaType?: "movie" | "tv";  // NEW
  ...
}

const entry = tmdbEntries?.find(
  (e) => e.tmdbId === movie.id && e.mediaType === (mediaType ?? "movie")
);
```

**Where to pass `mediaType="tv"`:** Series page's `MovieRow` → `MovieCard` calls. The `MovieRow` component renders `MovieCard` — it needs a `mediaType` prop threaded through.

### Pattern 3: WatchlistCard Link Routing

**What:** `WatchlistCard` currently hardcodes `/movie/${item.tmdbId}` for both poster and title links. TV items need to link to `/tv/${item.tmdbId}`.

**Fix:**
```typescript
const href = item.mediaType === "tv"
  ? `/tv/${item.tmdbId}`
  : `/movie/${item.tmdbId}`;
```

Apply to both the `Link` on the poster and the `Link` on the title.

### Pattern 4: Type Badge on WatchlistCard

**What:** Small pill overlay at top-left of the poster image in `WatchlistCard`.

**Positioning:** The poster `Link` already has `relative` overflow-hidden — the badge goes inside as an absolutely positioned element:

```tsx
<Link href={href} className="relative h-28 w-[75px] shrink-0 overflow-hidden rounded-md bg-muted block">
  <Image ... />
  {/* Type badge — top-left overlay */}
  <span className="absolute top-1 left-1 z-10 rounded px-1 py-0.5 text-[9px] font-semibold leading-none bg-black/70 text-white">
    {item.mediaType === "tv" ? "TV" : "Movie"}
  </span>
</Link>
```

Claude's discretion on color: distinct tints (`bg-blue-900/80 text-blue-200` for TV, `bg-black/70 text-white` for Movie) reads more cleanly than identical muted style, while keeping both subtle.

### Pattern 5: TV Detail Page Watchlist Actions

**What:** `TVDetailPageContent` currently has a placeholder notice "TV show tracking coming soon". Replace with the same fixed bottom action bar from `MovieDetailPageContent`.

**Key differences from movie page:**
1. Pass `mediaType: "tv"` to all `addMutation.mutate(...)` calls
2. Use `details.name` (not `details.title`) for the `title` field
3. Use `details.poster_path` as-is (same field name as movie)
4. The undo toast's `addMutation.mutate` must also include `mediaType: "tv"`

**Action bar structure** (identical to movie page):
- Bookmark button (Add to Library / In Library toggle)
- CircleCheck button (Mark Watched / Watched toggle)
- ThumbsUp / ThumbsDown (only shown when `isInLibrary`)
- Trailer link button (optional, same as movie page)

**`useWatchlistCheck` call:**
```typescript
const { data: watchlistItem, isLoading: isCheckingWatchlist } =
  useWatchlistCheck(details.id, "tv");
```

### Pattern 6: Library Media Type Filter

**What:** Add a media type filter above the existing status tabs in `WatchlistContent`.

**State management:**
```typescript
type WatchlistMediaFilter = "all" | "movie" | "tv";
const [mediaFilter, setMediaFilter] = useState<WatchlistMediaFilter>("all");
```

**Data approach:** Fetch the full unfiltered list (`useWatchlist()` with no status) always, then derive counts and apply filters client-side. This avoids multiple simultaneous queries and gives instant count updates.

```typescript
// Always fetch ALL items (no status filter on the query)
const { data: allItems, isLoading } = useWatchlist();

// Derive counts
const movieCount = allItems?.filter(i => i.mediaType === "movie").length ?? 0;
const tvCount = allItems?.filter(i => i.mediaType === "tv").length ?? 0;
const totalCount = allItems?.length ?? 0;

// Apply both filters client-side
const filteredItems = useMemo(() => {
  let items = allItems ?? [];
  if (mediaFilter !== "all") {
    items = items.filter(i => i.mediaType === mediaFilter);
  }
  if (activeTab !== "all") {
    items = items.filter(i => i.status === activeTab);
  }
  return items;
}, [allItems, mediaFilter, activeTab]);
```

**WLUX-02 compliance:** Status changes must NOT remove a card from the current view. Because we now filter entirely client-side from a stable list, the only time a card disappears is when the item is deleted from the DB (the `exit` animation fires via `AnimatePresence`). Status changes update the item in the cache in place — no removal.

**Current issue in `WatchlistContent`:** The component currently calls `useWatchlist(statusFilter)` where `statusFilter` is derived from `activeTab`. This means when `activeTab = "watched"`, the query fetches only `status = "watched"` from the server. If the user changes a card's status on the watched tab, the current optimistic update in `useUpdateWatchlistStatus` already handles this by moving items between cached list keys. But WLUX-02 says the card must NOT be removed when changing status — the current server-filtered approach would cause a disappear+reappear flicker between server refetches. The fix is to always fetch all items and filter client-side, which makes card stability trivial.

**Filter row UI using ToggleGroup:**
```tsx
<ToggleGroup
  type="single"
  value={mediaFilter}
  onValueChange={(v) => { if (v) setMediaFilter(v as WatchlistMediaFilter); }}
  className="justify-start"
>
  <ToggleGroupItem value="all" className="text-xs h-8 px-3">
    All ({totalCount})
  </ToggleGroupItem>
  <ToggleGroupItem value="movie" className="text-xs h-8 px-3">
    Movies ({movieCount})
  </ToggleGroupItem>
  <ToggleGroupItem value="tv" className="text-xs h-8 px-3">
    TV Shows ({tvCount})
  </ToggleGroupItem>
</ToggleGroup>
```

**Layout:** Filter row (ToggleGroup) on top, status Tabs row below. Both are `justify-start`.

### Pattern 7: Optimistic Update Cache Key Consistency

**What:** When `useAddToWatchlist`'s `onMutate` writes to the check cache, it uses `watchlistKeys.check(newItem.tmdbId)`. After the key signature change (Pattern 1), this must become `watchlistKeys.check(newItem.tmdbId, newItem.mediaType ?? "movie")`.

Similarly, `useRemoveFromWatchlist` calls `queryClient.setQueryData(watchlistKeys.check(params.tmdbId), null)` — this must become `watchlistKeys.check(params.tmdbId, params.mediaType ?? "movie")`. This means the `remove` mutation params need to carry `mediaType`.

**Current `useRemoveFromWatchlist` signature:**
```typescript
mutationFn: (params: { id: string; tmdbId: number }) => removeFromWatchlist(params.id),
```

**Updated signature:**
```typescript
mutationFn: (params: { id: string; tmdbId: number; mediaType?: MediaType }) =>
  removeFromWatchlist(params.id),
```

All callers of `removeMutation.mutate(...)` need to pass `mediaType`:
- `WatchlistCard.handleRemove`
- `MovieDetailPageContent.handleRemove`
- `TVDetailPageContent.handleRemove` (new)
- `MovieDetailModal.handleRemove`
- `MovieCard.handleBookmarkClick` / `handleCheckClick`

The undo toast's `addMutation.mutate` in `WatchlistCard` already has the item object available — pass `mediaType: item.mediaType`. In `MovieCard` the undo `addMutation.mutate` currently doesn't pass `mediaType` (defaults to "movie") — since `MovieCard` is always for movies, this is fine.

### Anti-Patterns to Avoid

- **Don't fetch separate queries per media type for counts.** Derive counts client-side from the single `useWatchlist()` result.
- **Don't add a `mediaType` param to the status-filtered `useWatchlist(status?)` query.** Status-filtered queries are for potential future SSR prefetching. Add filtering client-side.
- **Don't create a new `useTVWatchlistCheck` hook.** Update the existing `useWatchlistCheck` with an optional `mediaType` param (default `"movie"`). This keeps backward compatibility for all existing movie callers.
- **Don't add the `MediaTypeBadge` to every card globally.** The decision is library cards only (per locked decisions). Other pages remain at Claude's discretion — keep it out of `MovieCard` for now to avoid scope creep.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-page icon sync | Custom event bus / context | TanStack Query shared key + invalidation | Already wired; `watchlistKeys.tmdbIds()` is the single source of truth for all card icons across the app |
| Animated card removal | CSS transitions + manual DOM manipulation | Framer Motion `AnimatePresence` + `exit` variant | Already used in `WatchlistContent`; just works when items leave the array |
| Filter state | Redux / Zustand | Local `useState` in `WatchlistContent` | Filter is purely local UI state — no cross-component sharing needed |
| Item counts | Separate DB count queries | `.filter().length` on cached data | Instant, no network, consistent with display |

---

## Common Pitfalls

### Pitfall 1: Stale Check Cache After Add/Remove

**What goes wrong:** After adding a TV show from the `/tv/[id]` page, the bookmark icon doesn't update because the check cache key `["watchlist", "check", id]` was written during `onMutate` but with the old key (no `mediaType`). The settled `invalidateQueries` refetches the new key, so the icon eventually updates — but there's a flash of wrong state.

**Why it happens:** `watchlistKeys.check(tmdbId)` is called in two places: (1) `useAddToWatchlist`'s `onMutate` writes to it, (2) `useWatchlistCheck` reads from it. If the key shape differs between writer and reader, the optimistic write is invisible to the reader.

**How to avoid:** Update `watchlistKeys.check`, `useWatchlistCheck`, `useAddToWatchlist.onMutate`, and `useRemoveFromWatchlist.onMutate` in the same commit.

**Warning signs:** The icon takes ~1 server roundtrip to update (250-500ms delay) instead of updating instantly.

### Pitfall 2: WatchlistContent WLUX-02 Regression with Status-Filtered Queries

**What goes wrong:** If `WatchlistContent` continues to call `useWatchlist(statusFilter)` with a server-side status filter, changing a card's status on the "Want to Watch" tab makes it disappear from the list (the server refetch no longer returns it in that status bucket), violating WLUX-02.

**Why it happens:** The optimistic update in `useUpdateWatchlistStatus` does move items between list caches, but the `onSettled` `invalidateQueries` triggers a server refetch that reasserts the server-filtered result. Items "come back" after the refetch, but the card flickers out and back in.

**How to avoid:** Switch `WatchlistContent` to always fetch the full list (`useWatchlist()` with no status arg) and filter client-side.

**Warning signs:** Cards briefly disappear from their current tab when you change their status.

### Pitfall 3: mediaType Defaulting in Remove Mutation

**What goes wrong:** When `MovieCard` calls `removeMutation.mutate({ id: entry.id, tmdbId: movie.id })` without `mediaType`, the `onMutate` calls `queryClient.setQueryData(watchlistKeys.check(params.tmdbId, params.mediaType ?? "movie"), null)`. If `params.mediaType` is undefined and `entry.mediaType` is actually "tv" (because the card is being used on a TV row), the check cache for the TV key is never cleared — the icon stays "bookmarked" until the invalidation refetch.

**How to avoid:** Pass `mediaType: entry.mediaType` from the remove callers wherever `entry` is available. In `MovieCard`, `entry` is the `WatchlistTmdbEntry` from `useWatchlistTmdbIds` — it already has `mediaType`.

**Warning signs:** After removing a TV card, the bookmark icon persists for a brief moment before the refetch clears it.

### Pitfall 4: TV Card `mediaType` Not Passed Through MovieRow

**What goes wrong:** `MovieRow` renders `MovieCard` components. The series page uses `MovieRow` for TV content. If `MovieRow` doesn't accept and forward a `mediaType` prop, all TV cards default to `"movie"` in the TMDB ID lookup, silently showing wrong watchlist state for any TV show that happens to share a TMDB ID with a movie entry.

**How to avoid:** Add `mediaType?: "movie" | "tv"` to `MovieRow`'s props (default `"movie"`), forward it to each `MovieCard`. Update all series page `MovieRow` usages to pass `mediaType="tv"`.

**Warning signs:** TV cards on the series page don't light up after you bookmark a show from `/tv/[id]`.

### Pitfall 5: WatchlistCard Undo Toast Media Type

**What goes wrong:** After removing a TV item, the "Undo" toast calls `addMutation.mutate({ tmdbId, title, posterPath, status })` without `mediaType`. The item gets re-added as `mediaType: "movie"` (the default). The re-added item then links to `/movie/[id]` instead of `/tv/[id]`.

**How to avoid:** The `WatchlistCard.handleRemove` undo must include `mediaType: item.mediaType`.

```typescript
addMutation.mutate({
  tmdbId: item.tmdbId,
  title: item.title,
  posterPath: item.posterPath,
  status: previousStatus,
  mediaType: item.mediaType,  // ← required
});
```

---

## Code Examples

### TV Detail Page Watchlist Section

```typescript
// components/movies/tv-detail-page.tsx — add these imports
import {
  useWatchlistCheck,
  useAddToWatchlist,
  useRemoveFromWatchlist,
  useUpdateWatchlistStatus,
  useRateWatchlistItem,
} from "@/hooks/use-watchlist";
import { Bookmark, CircleCheck, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Inside TVDetailPageContent:
const { data: watchlistItem, isLoading: isCheckingWatchlist } =
  useWatchlistCheck(details.id, "tv");
const addMutation = useAddToWatchlist();
const removeMutation = useRemoveFromWatchlist();
const statusMutation = useUpdateWatchlistStatus();
const rateMutation = useRateWatchlistItem();

const isInLibrary = !!watchlistItem;
const isWantToWatch = watchlistItem?.status === "want_to_watch";
const isWatched = watchlistItem?.status === "watched";

// Fixed bottom bar (identical to movie page):
// bottom-16 md:bottom-0 left-0 right-0 md:left-[60px] — matches sidebar offset
```

### Library Media Type Filter

```typescript
// types/watchlist.ts — add:
export type WatchlistMediaFilter = "all" | "movie" | "tv";

// components/watchlist/watchlist-content.tsx:
const [mediaFilter, setMediaFilter] = useState<WatchlistMediaFilter>("all");
const { data: allItems, isLoading } = useWatchlist(); // no status filter

const movieCount = allItems?.filter(i => i.mediaType === "movie").length ?? 0;
const tvCount = allItems?.filter(i => i.mediaType === "tv").length ?? 0;

const displayItems = useMemo(() => {
  let items = allItems ?? [];
  if (mediaFilter !== "all") items = items.filter(i => i.mediaType === mediaFilter);
  if (activeTab !== "all") items = items.filter(i => i.status === activeTab);
  return items;
}, [allItems, mediaFilter, activeTab]);
```

### Updated watchlistKeys.check Signature

```typescript
// hooks/use-watchlist.ts
export const watchlistKeys = {
  all: ["watchlist"] as const,
  list: (status?: WatchlistStatus) =>
    [...watchlistKeys.all, "list", status ?? "all"] as const,
  tmdbIds: () => [...watchlistKeys.all, "tmdbIds"] as const,
  check: (tmdbId: number, mediaType: MediaType = "movie") =>
    [...watchlistKeys.all, "check", tmdbId, mediaType] as const,
};
```

---

## State of the Art

| Old Approach | Current Approach | Impact for Phase 10 |
|--------------|------------------|---------------------|
| Status-filtered server query per tab | All-items fetch + client-side filter | Required for WLUX-02 (no card removal on status change) |
| `check` key = `[..., tmdbId]` | `check` key = `[..., tmdbId, mediaType]` | Required for correct TV/movie disambiguation |
| `remove` params = `{ id, tmdbId }` | `remove` params = `{ id, tmdbId, mediaType }` | Required for correct check cache invalidation |

---

## Open Questions

1. **Should `MovieCard` receive `mediaType` or derive it from context?**
   - What we know: `MovieCard` is used for both movies and TV shows (series page passes `Movie`-shaped normalized TV objects)
   - What's unclear: There's no ambient "this is a TV context" — the component itself doesn't know
   - Recommendation: Add explicit `mediaType?: "movie" | "tv"` prop with default `"movie"`. Thread through `MovieRow` → `MovieCard`. Series page `MovieRow` usages pass `mediaType="tv"`. This is explicit and zero-ambiguity.

2. **WatchlistContent: one query or two (status-filtered)?**
   - What we know: WLUX-02 requires cards to stay in place on status change. Current architecture fetches per-status.
   - What's unclear: Whether the all-items-then-filter approach causes any perf issue for large libraries
   - Recommendation: Single `useWatchlist()` (no status) + client-side filter. At library scale (hundreds of items max), this is negligible. The behavior correctness is worth it.

3. **ToggleGroup vs custom pills for media type filter?**
   - What we know: `toggle-group.tsx` exists in the codebase (used on Discover page), so shadcn/ui ToggleGroup is available
   - Recommendation: Use `ToggleGroup` — consistent with Discover page pattern, no new component needed.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — `hooks/use-watchlist.ts`, `actions/watchlist.ts`, `drizzle/schema.ts`, `types/watchlist.ts`, `types/tv.ts` — current implementation state fully verified
- Direct codebase inspection — `components/movies/movie-detail-page.tsx` — action bar pattern to replicate for TV
- Direct codebase inspection — `components/movies/tv-detail-page.tsx` — current state (placeholder notice), no watchlist hooks wired
- Direct codebase inspection — `components/watchlist/watchlist-content.tsx`, `watchlist-card.tsx` — current library page implementation

### Secondary (MEDIUM confidence)
- TanStack Query cache key design — standard practice verified against existing patterns in codebase (all mutations use `onMutate` + `onError` rollback + `onSettled` invalidation)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; verified all existing packages
- Architecture: HIGH — all patterns derived from reading actual existing code
- Pitfalls: HIGH — all pitfalls identified from reading the exact current code paths

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (stable codebase; only stale if TanStack Query v6 releases or schema changes)

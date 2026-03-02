# Architecture Patterns

**Domain:** v0.4 Watchlist & Polish — TV watchlisting, watchlist UX fixes, discovery UX, AI polish, AI logging, My Top 100
**Researched:** 2026-02-28
**Confidence:** HIGH (direct codebase inspection of all affected files)

---

## Context: What This Research Answers

This document answers how six feature groups integrate into the existing Moodflix architecture:

1. **TV watchlisting** — schema migration (`media_type` column), unique constraint change, type propagation
2. **Watchlist UX fixes** — instant sync, card persistence, movie/series filter
3. **Discovery UX** — TV search, rename Discover → Movies, rating display as X/10
4. **AI polish** — origin country TMDB filtering, off-topic guardrails
5. **AI conversation logging** — full conversation storage for analytics
6. **My Top 100** — personal curated list, new schema table, new routes

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         App Routes (App Router)                      │
│  /home   /discover(→Movies)   /series   /library   /settings        │
│  /movie/[id]   /tv/[id]   /library/top-100 (NEW)                    │
├─────────────────────────────────────────────────────────────────────┤
│                      Client Components                               │
│  WatchlistContent (MODIFIED)   WatchlistCard (MODIFIED)             │
│  TVDetailPageContent (MODIFIED — add watchlist buttons)             │
│  MovieDetailPageContent (NO CHANGE)                                  │
│  MoodSection (NO CHANGE)   LibraryContent (NO CHANGE)               │
│  TopHundredContent (NEW)                                             │
├─────────────────────────────────────────────────────────────────────┤
│                      Server Actions                                  │
│  actions/watchlist.ts (MODIFIED — media_type field throughout)      │
│  actions/top-hundred.ts (NEW)                                        │
├─────────────────────────────────────────────────────────────────────┤
│                      TanStack Query Hooks                            │
│  hooks/use-watchlist.ts (MODIFIED — media_type in keys + types)     │
│  hooks/use-top-hundred.ts (NEW)                                      │
├─────────────────────────────────────────────────────────────────────┤
│                      API Routes                                      │
│  /api/ai/recommend (MODIFIED — guardrails, country filter, logging) │
├─────────────────────────────────────────────────────────────────────┤
│                      Database (Drizzle ORM)                          │
│  watchlist table (MODIFIED — +media_type column, unique constraint) │
│  ai_recommendations (MODIFIED — +full conversation messages column) │
│  top_hundred (NEW table)                                             │
├─────────────────────────────────────────────────────────────────────┤
│                      External                                        │
│  TMDB API   Supabase Auth   Google Gemini (AI SDK v5)               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Feature 1: TV Watchlisting (Schema Migration)

### The Core Problem

The current schema has a unique constraint `watchlist_user_tmdb_unique` on `(userId, tmdbId)`. TMDB movie and TV IDs are in separate integer ID spaces — a movie with `id=1396` and a TV show with `id=1396` are different content. Without `media_type`, the watchlist cannot distinguish them. The unique constraint must change from `(userId, tmdbId)` to `(userId, tmdbId, mediaType)`.

### Schema Change

```typescript
// drizzle/schema.ts — MODIFIED

export const mediaTypeEnum = pgEnum("media_type", ["movie", "tv"]);  // NEW

export const watchlist = pgTable(
  "watchlist",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    tmdbId: integer("tmdb_id").notNull(),
    mediaType: mediaTypeEnum("media_type").notNull().default("movie"),  // NEW COLUMN
    title: text("title").notNull(),
    posterPath: text("poster_path"),
    status: watchlistStatusEnum("status").default("want_to_watch"),
    rating: integer("rating"),
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow(),
    watchedAt: timestamp("watched_at", { withTimezone: true }),
  },
  (table) => [
    // CHANGED: was (table.userId, table.tmdbId) — now includes mediaType
    unique("watchlist_user_tmdb_media_unique").on(table.userId, table.tmdbId, table.mediaType),
  ],
);
```

### Migration Sequence

The Drizzle migration must be additive to avoid data loss:

1. Add `media_type` column with `DEFAULT 'movie'` — existing rows become `'movie'` automatically
2. Drop old constraint `watchlist_user_tmdb_unique`
3. Add new constraint `watchlist_user_tmdb_media_unique` on `(userId, tmdbId, mediaType)`
4. Set `NOT NULL` on the column after backfill is confirmed

The `DEFAULT 'movie'` handles all existing rows without manual data surgery. No existing watchlist items will break.

### Type Propagation

Every type that touches the watchlist must gain `mediaType`:

```typescript
// types/watchlist.ts — MODIFIED

export type MediaType = "movie" | "tv";  // NEW

export type WatchlistItem = {
  id: string;
  userId: string;
  tmdbId: number;
  mediaType: MediaType;  // NEW
  title: string;
  posterPath: string | null;
  status: WatchlistStatus;
  rating: number | null;
  addedAt: string;
  watchedAt: string | null;
};

export type WatchlistTmdbEntry = {
  id: string;
  tmdbId: number;
  mediaType: MediaType;  // NEW — critical for card state lookups
  status: WatchlistStatus;
};

export type AddToWatchlistInput = {
  tmdbId: number;
  mediaType: MediaType;  // NEW
  title: string;
  posterPath: string | null;
  status?: WatchlistStatus;
};
```

### Actions: `actions/watchlist.ts` Changes

Every server action needs `media_type` awareness:

| Action | Change |
|--------|--------|
| `serializeItem` | Add `mediaType: row.mediaType` to returned object |
| `getWatchlist` | Accept optional `mediaType?: MediaType` filter param |
| `getWatchlistTmdbIds` | Return `mediaType` in each entry |
| `getWatchlistItemByTmdbId` | Add `mediaType` to WHERE clause: `and(userId, tmdbId, mediaType)` |
| `addToWatchlist` | Accept `data.mediaType`, write it to DB; update unique conflict message |
| `removeFromWatchlist` | No change — uses `watchlistItemId` (UUID), not tmdbId |
| `updateWatchlistStatus` | No change — uses UUID |
| `rateWatchlistItem` | No change — uses UUID |

Critical: `getWatchlistItemByTmdbId` must now take `(tmdbId: number, mediaType: MediaType)` — without `mediaType`, a movie and TV show with the same numeric ID would clash. Update all callers.

### Hook Changes: `hooks/use-watchlist.ts`

Query key factory needs `mediaType` dimension:

```typescript
// hooks/use-watchlist.ts — MODIFIED

export const watchlistKeys = {
  all: ["watchlist"] as const,
  list: (status?: WatchlistStatus, mediaType?: MediaType) =>
    [...watchlistKeys.all, "list", status ?? "all", mediaType ?? "all"] as const,
  tmdbIds: () => [...watchlistKeys.all, "tmdbIds"] as const,
  check: (tmdbId: number, mediaType: MediaType) =>
    [...watchlistKeys.all, "check", tmdbId, mediaType] as const,  // CHANGED
};
```

The `check` key change is the most disruptive — every call to `watchlistKeys.check(tmdbId)` becomes `watchlistKeys.check(tmdbId, mediaType)`. Callers: `movie-detail-page.tsx`, `tv-detail-page.tsx`, optimistic update logic in `useAddToWatchlist`.

Optimistic update in `useAddToWatchlist.onMutate` must populate `mediaType` in the fake entry:

```typescript
// In useAddToWatchlist.onMutate:
queryClient.setQueryData<WatchlistTmdbEntry[]>(
  watchlistKeys.tmdbIds(),
  (old) => [
    ...(old ?? []),
    {
      id: "",
      tmdbId: newItem.tmdbId,
      mediaType: newItem.mediaType,  // NEW
      status: newItem.status ?? "want_to_watch",
    },
  ],
);
```

### TV Detail Page: Adding Watchlist Buttons

`TVDetailPageContent` currently renders no watchlist controls. This is the primary feature gap. The pattern to follow is `movie-detail-page.tsx` which already uses `useWatchlistCheck`, `useAddToWatchlist`, `useRemoveFromWatchlist`, `useUpdateWatchlistStatus`, `useRateWatchlistItem`.

Add to `TVDetailPageContent`:

```typescript
// components/movies/tv-detail-page.tsx — MODIFIED (add watchlist section)

const tvId = details.id;
const tvTitle = details.name;
const tvPoster = details.poster_path;

const { data: watchlistItem } = useWatchlistCheck(tvId, "tv");  // mediaType="tv"
const addMutation = useAddToWatchlist();
const removeMutation = useRemoveFromWatchlist();
const statusMutation = useUpdateWatchlistStatus();
const rateMutation = useRateWatchlistItem();
```

The watchlist action buttons (Bookmark, CircleCheck, ThumbsUp, ThumbsDown) are already built in `movie-detail-page.tsx`. Extract them into a shared component or copy the pattern into `tv-detail-page.tsx`. Given the current file structure, copy is lower risk than extraction (no risk of breaking the movie detail page mid-milestone).

### WatchlistCard: Adding `media_type` Awareness

`WatchlistCard` renders a poster that links to `/movie/${item.tmdbId}`. With TV shows in the watchlist, this must route to `/tv/${item.tmdbId}` for TV items.

```typescript
// components/watchlist/watchlist-card.tsx — MODIFIED

const detailHref = item.mediaType === "tv"
  ? `/tv/${item.tmdbId}`
  : `/movie/${item.tmdbId}`;

// Replace hardcoded `/movie/${item.tmdbId}` with `detailHref` in Link and anchor
```

Also display a "TV" or "Movie" type badge to help users identify content type at a glance.

---

## Feature 2: Watchlist UX Fixes

### Instant Sync (BACKLOG-16)

**Problem:** Watchlist state (bookmark/watched icons) on movie cards in `/home` and `/discover` does not update until the next page refresh after a mutation from the detail page.

**Root cause:** `useWatchlistTmdbIds` has `staleTime: 30_000`. After `addToWatchlist`, `onSettled` calls `invalidateQueries({ queryKey: watchlistKeys.all })` which marks the query stale, but the refetch only happens when the component re-renders with focus. If the user navigates back to the card without a window focus event, the card shows the pre-mutation state.

**Fix:** In `useAddToWatchlist.onSettled` and all mutation `onSettled` handlers, change invalidation to trigger an immediate refetch:

```typescript
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: watchlistKeys.all });
  // Force immediate refetch of tmdbIds so cards update without window focus:
  queryClient.refetchQueries({ queryKey: watchlistKeys.tmdbIds() });
},
```

The optimistic update already covers the instant visual response. The forced refetch ensures the server-confirmed state arrives promptly.

### Card Persistence (BACKLOG-23)

**Problem:** After marking a movie as "watched" in the library tab, the card disappears from the "Want to Watch" tab but does not appear in the "Watched" tab until the user switches tabs and back (or refreshes).

**Root cause:** The `useWatchlistTmdbIds` cache and `watchlistKeys.list("watched")` cache are not updated atomically. The item is removed from `want_to_watch` list immediately (optimistic), but the `watched` list cache only receives the item when it invalidates and refetches.

**Fix:** The existing `useUpdateWatchlistStatus.onMutate` already handles this — it directly updates both the `want_to_watch` and `watched` list caches optimistically. The bug is that it looks up the item from `watchlistKeys.list()` (the "all" list) which may be stale.

The fix is to use the `WatchlistItem` from the check cache (`watchlistKeys.check(tmdbId, mediaType)`) as the fallback source when the all-list cache is empty or doesn't contain the item:

```typescript
// Prefer check cache if all-list doesn't have the item yet
const item = previousLists[JSON.stringify(watchlistKeys.list())]?.find(i => i.id === params.id)
  ?? previousCheck;
```

### Library Movie/Series Filter (BACKLOG-32)

**Problem:** Library shows all items. Users need to filter to see only movies or only TV shows.

**Solution:** Add a "Media Type" filter to `WatchlistContent` alongside the existing status tabs.

`WatchlistContent` currently calls `useWatchlist(statusFilter)`. Extend the hook to accept `mediaType?`:

```typescript
// hooks/use-watchlist.ts
export function useWatchlist(status?: WatchlistStatus, mediaType?: MediaType) {
  return useQuery({
    queryKey: watchlistKeys.list(status, mediaType),
    queryFn: () => getWatchlist(status, mediaType),
    ...
  });
}
```

In `WatchlistContent`, add a filter UI using shadcn `ToggleGroup` (already used in the discover page for genre filtering):

```typescript
// components/watchlist/watchlist-content.tsx — MODIFIED
const [mediaFilter, setMediaFilter] = useState<MediaType | "all">("all");
const mediaTypeFilter: MediaType | undefined = mediaFilter === "all" ? undefined : mediaFilter;
const { data: items } = useWatchlist(statusFilter, mediaTypeFilter);
```

The `getWatchlist` server action accepts the new filter:

```typescript
// actions/watchlist.ts
export async function getWatchlist(
  status?: WatchlistStatus,
  mediaType?: MediaType,
): Promise<WatchlistItem[]> {
  const conditions = and(
    eq(watchlist.userId, userId),
    status ? eq(watchlist.status, status) : undefined,
    mediaType ? eq(watchlist.mediaType, mediaType) : undefined,
  );
  ...
}
```

---

## Feature 3: Discovery UX

### TV Search (BACKLOG-31)

**Problem:** The `/series` page has no search input. Users must rely on browsing rows only.

**Solution:** The `/series` page renders `SeriesContent` (a client component). Add a `SearchInput` to `SeriesContent` mirroring the search in `DiscoverContent`. The TV search uses the existing `searchTV` function from `lib/tmdb.ts` via `/api/tv?query=...`.

Add `useSearchTV` hook to `hooks/use-tv.ts`:

```typescript
export function useSearchTV(query: string) {
  return useInfiniteQuery({
    queryKey: tvKeys.search(query),
    queryFn: ({ pageParam = 1 }) => fetchTVSearch(query, pageParam),
    enabled: query.length > 1,
    ...
  });
}
```

This is a pure addition — no existing code changes.

### Rename Discover → Movies (BACKLOG-31)

**Scope:** UI label change, not a route rename. The route stays `/discover` (changing the route would break bookmarks and is out of scope for a polish milestone).

Files to update:
- `components/layout/sidebar.tsx` (or `app-navbar.tsx`) — nav link label "Discover" → "Movies"
- `app/(app)/discover/page.tsx` — page metadata title
- `app/(app)/home/page.tsx` — feature cards array ("Discover Movies" label)
- Any hardcoded "Discover" strings in `DiscoverContent`

This is a text substitution pass — no logic changes.

### Rating Display Fix (BACKLOG-25)

**Problem:** Rating stored as `vote_average` (0-10 float from TMDB) is displayed inconsistently. Some places show `8.5 ★`, others show raw values.

**Solution:** Standardize on `X/10` format throughout. Create a shared `formatRating` utility:

```typescript
// lib/utils.ts — ADD
export function formatRating(voteAverage: number | null | undefined): string {
  if (!voteAverage || voteAverage === 0) return "N/A";
  return `${voteAverage.toFixed(1)}/10`;
}
```

Apply in:
- `movie-detail-page.tsx` — replace `rating ★` with `formatRating(details.vote_average)`
- `tv-detail-page.tsx` — same
- `movie-card.tsx` — if rating is shown on hover overlay
- `watchlist-card.tsx` — N/A (watchlist shows like/dislike, not TMDB rating)

---

## Feature 4: AI Polish — Origin Country Filtering

### Problem

When a user says "Korean drama" or "Japanese anime," the AI correctly sets `media_type: "tv"` and genre IDs. But `discoverTVByGenre` in `lib/tmdb.ts` does not pass `with_origin_country` — the results include all nationalities.

### Solution: Extend `suggest_genres` Tool Output

Add an optional `origin_country` field to the `suggest_genres` tool's `inputSchema`:

```typescript
// app/api/ai/recommend/route.ts — MODIFIED

inputSchema: z.object({
  genres: z.array(z.object({
    id: z.number(),
    name: z.string(),
  })).min(1).max(3),
  moodSummary: z.string(),
  media_type: z.enum(["movie", "tv"]).default("movie"),
  origin_country: z.string().optional()
    .describe("ISO 3166-1 alpha-2 country code (e.g. 'KR' for Korea, 'JP' for Japan). Only set when user explicitly requests content from a specific country."),
}),
```

Update the system prompt to instruct the model when to set `origin_country`:

```
When the user requests content from a specific country (e.g. "Korean drama", "Japanese anime",
"French film"), set origin_country to the ISO 3166-1 alpha-2 code (KR, JP, FR, etc.).
Do NOT set origin_country unless the user explicitly requests a specific nationality.
```

### Propagation to TMDB Discover

The `suggest_genres` tool's return value flows to the `home/recommendations` page via URL params. Update the URL construction in `MoodSection.handleShowMovies`:

```typescript
// components/ai/mood-section.tsx — MODIFIED

const handleShowMovies = () => {
  if (!genreSuggestion) return;
  const genreIds = genreSuggestion.genres.map(g => g.id).join(",");
  const mood = encodeURIComponent(genreSuggestion.moodSummary);
  const mediaType = genreSuggestion.media_type ?? "movie";
  // Add country param:
  const country = genreSuggestion.origin_country
    ? `&country=${genreSuggestion.origin_country}`
    : "";
  router.push(`/home/recommendations?genres=${genreIds}&mood=${mood}&type=${mediaType}${country}`);
};
```

Update `discoverTV` in `lib/tmdb.ts` to accept `with_origin_country`:

```typescript
// lib/tmdb.ts — MODIFIED
export async function discoverTV(opts: {
  genreIds?: string;
  sortBy?: string;
  year?: string;
  originCountry?: string;  // NEW
  page?: number;
} = {}) {
  const params: Record<string, string> = { ... };
  if (opts.originCountry) params.with_origin_country = opts.originCountry;
  ...
}
```

The recommendations page reads `?country=` from the URL and passes it to `discoverTV`. No new routes needed.

### Update `GenreSuggestion` Type

```typescript
// types/ai.ts — MODIFIED
export type GenreSuggestion = {
  genres: Array<{ id: number; name: string }>;
  moodSummary: string;
  media_type: "movie" | "tv";
  origin_country?: string;  // NEW
  confirmed: boolean;
};
```

---

## Feature 5: AI Guardrails (Off-Topic Restriction)

### Problem

Users can send messages like "write me a poem" or "what's 2+2?" and the AI will respond helpfully instead of staying on the movie/TV topic.

### Solution: System Prompt Addition

No new infrastructure needed. Add a guardrail instruction to the existing system prompt in `app/api/ai/recommend/route.ts`:

```
STRICT SCOPE: You ONLY help users find movies and TV shows based on their mood.
If the user asks about anything unrelated to movies, TV shows, or entertainment,
respond with exactly: "I can only help you find movies and TV shows that match
your mood. What are you in the mood to watch?"
Do NOT engage with, answer, or expand on any off-topic requests.
```

This is a prompt engineering change — zero code infrastructure changes. Place the guardrail instruction at the top of the system prompt before all other instructions, so it takes priority.

**Trade-off:** Prompt-only guardrails can be bypassed by jailbreak attempts. For a hobby SaaS, this is acceptable. A production system would add a classification step or content filter API call, but that adds latency and cost.

---

## Feature 6: AI Conversation Logging

### Problem

`aiRecommendations` currently stores only the final mood prompt and the genre suggestion output. There is no record of the full conversation (all user/assistant turns), which makes it impossible to analyze what conversation patterns lead to recommendations.

### Schema Change

Extend the existing `ai_recommendations` table:

```typescript
// drizzle/schema.ts — MODIFIED

export const aiRecommendations = pgTable("ai_recommendations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),          // UNCHANGED — last user message (for backward compat)
  recommendations: jsonb("recommendations").notNull(), // UNCHANGED — genre suggestion output
  messages: jsonb("messages"),               // NEW — full conversation array, nullable for old rows
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
```

The `messages` column is `jsonb` and nullable so existing rows are unaffected. No data migration needed.

### Route Change: `app/api/ai/recommend/route.ts`

In the `suggest_genres.execute` function where the DB insert happens, pass the full message array:

```typescript
// app/api/ai/recommend/route.ts — MODIFIED (in suggest_genres.execute)

db.insert(aiRecommendations)
  .values({
    userId,
    prompt: moodPrompt,
    recommendations: validatedParams,
    messages: uiMessages,  // NEW — store full conversation
  })
  .catch(() => {
    // Non-critical: silently fail
  });
```

`uiMessages` is already in scope at the point of the tool's `execute` call (it's captured from the POST handler's outer scope). The conversation is stored as a JSONB array — the AI SDK `UIMessage[]` format, which is serializable.

**Storage consideration:** Each conversation is typically 2-6 messages, each 50-200 tokens. At 10 requests/day per free user, storage growth is negligible for a hobby project. No pagination or cleanup mechanism needed initially.

---

## Feature 7: My Top 100

### Schema: New Table

```typescript
// drizzle/schema.ts — ADD

export const topHundred = pgTable(
  "top_hundred",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    tmdbId: integer("tmdb_id").notNull(),
    mediaType: mediaTypeEnum("media_type").notNull().default("movie"),
    title: text("title").notNull(),
    posterPath: text("poster_path"),
    rank: integer("rank").notNull(),           // 1-100
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique("top_hundred_user_tmdb_unique").on(table.userId, table.tmdbId, table.mediaType),
    // Rank must be unique per user (no two items at rank 5)
    unique("top_hundred_user_rank_unique").on(table.userId, table.rank),
  ],
);
```

The `rank` column enables ordered display and drag-to-reorder. The unique constraint on `(userId, rank)` enforces list integrity — no duplicate ranks.

### New Types: `types/top-hundred.ts`

```typescript
export type TopHundredItem = {
  id: string;
  userId: string;
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
  rank: number;
  addedAt: string;
};

export type AddToTopHundredInput = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
  rank?: number;  // If omitted, appended at end (next available rank)
};

export type ReorderTopHundredInput = {
  itemId: string;
  newRank: number;
};
```

### New Server Actions: `actions/top-hundred.ts`

```typescript
// actions/top-hundred.ts (NEW)
// getTopHundred() → TopHundredItem[] ordered by rank
// addToTopHundred(data) → TopHundredItem (auto-assigns next rank if not provided)
// removeFromTopHundred(itemId) → void
// reorderTopHundred(itemId, newRank) → shifts other items to maintain sequence
```

The reorder operation is a multi-row update. Use Drizzle's transaction support:

```typescript
await db.transaction(async (tx) => {
  // Shift items between old and new rank
  // Update the target item's rank
});
```

### New Hook: `hooks/use-top-hundred.ts`

Follows the same TanStack Query pattern as `hooks/use-watchlist.ts`:
- `useTopHundred()` — list query
- `useAddToTopHundred()` — mutation with optimistic insert
- `useRemoveFromTopHundred()` — mutation with optimistic remove
- `useReorderTopHundred()` — mutation with optimistic reorder

### New Route: `/library/top-100`

Place under the existing `/library` route group for navigation consistency.

```
app/(app)/library/
  page.tsx          # Existing watchlist/library
  top-100/
    page.tsx        # NEW — My Top 100
    loading.tsx     # NEW
```

URL: `/library/top-100` (not `/top-100` at root — keeps it scoped to the library section).

### New Component: `components/library/top-hundred-content.tsx`

Renders the ranked list. Two views:
- **Display mode:** Numbered list with poster, title, media type badge
- **Edit mode:** Drag-to-reorder (use `@hello-pangea/dnd` or CSS-based rank swap with +/- buttons)

**Recommendation on drag-to-reorder:** Defer drag-and-drop for v0.4. Use simple "move up / move down" arrow buttons instead. Drag-and-drop requires a DnD library that must not conflict with Framer Motion. For 100 items, arrow buttons are functional and have no new dependencies.

### Navigation Integration

Add a "Top 100" link in the library section. Two options:
1. As a sidebar item under `/library` (separate nav entry)
2. As a tab within the library page itself

Recommendation: Tab within `/library/page.tsx` (a "Top 100" tab alongside "All", "Want to Watch", "Watched"). This avoids adding another top-level nav item to the already full sidebar. But it means `WatchlistContent` and `TopHundredContent` share the `/library` page with a tab switcher. Implement as a top-level tab array update in `WatchlistContent`, rendering `TopHundredContent` when the "Top 100" tab is active.

---

## Component Boundaries: New vs Modified

| Component | Status | Description |
|-----------|--------|-------------|
| `drizzle/schema.ts` | MODIFIED | `+media_type` on watchlist, `+messages` on ai_recommendations, new `top_hundred` table |
| `types/watchlist.ts` | MODIFIED | `+MediaType`, `+mediaType` on all types |
| `types/ai.ts` | MODIFIED | `+origin_country` on `GenreSuggestion` |
| `types/top-hundred.ts` | NEW | `TopHundredItem`, `AddToTopHundredInput`, `ReorderTopHundredInput` |
| `lib/tmdb.ts` | MODIFIED | `discoverTV` gets `+originCountry` option; `discoverMoviesByGenre` unchanged |
| `lib/utils.ts` | MODIFIED | `+formatRating()` utility |
| `actions/watchlist.ts` | MODIFIED | All actions gain `mediaType` awareness |
| `actions/top-hundred.ts` | NEW | CRUD for top 100 list |
| `hooks/use-watchlist.ts` | MODIFIED | `+mediaType` in keys, types, mutations |
| `hooks/use-top-hundred.ts` | NEW | TanStack Query hooks for Top 100 |
| `app/api/ai/recommend/route.ts` | MODIFIED | `+origin_country` in tool schema, guardrail prompt, `+messages` in DB insert |
| `components/watchlist/watchlist-content.tsx` | MODIFIED | `+mediaType` filter toggle, Top 100 tab |
| `components/watchlist/watchlist-card.tsx` | MODIFIED | Route to `/tv/[id]` for TV items, type badge |
| `components/movies/tv-detail-page.tsx` | MODIFIED | Add watchlist buttons (bookmark, watched, like/dislike) |
| `components/movies/movie-detail-page.tsx` | NO CHANGE | Already fully functional |
| `components/ai/mood-section.tsx` | MODIFIED | `+origin_country` in URL param construction |
| `components/library/top-hundred-content.tsx` | NEW | Ranked list display + rank editing |
| `app/(app)/library/top-100/page.tsx` | NEW | Route shell for Top 100 |
| `app/(app)/library/top-100/loading.tsx` | NEW | Skeleton |
| Sidebar / nav label | MODIFIED | "Discover" → "Movies" label only |

---

## Data Flow Changes

### TV Watchlisting Flow (NEW)

```
[User on /tv/[id] page]
    ↓ clicks bookmark button (NEW in TVDetailPageContent)
[useAddToWatchlist().mutate({ tmdbId, mediaType: "tv", title, posterPath })]
    ↓ optimistic update: adds to tmdbIds cache with mediaType: "tv"
    ↓ optimistic update: sets watchlistKeys.check(tmdbId, "tv")
[addToWatchlist server action]
    ↓ INSERT into watchlist with media_type = 'tv'
    ↓ unique constraint: (userId, tmdbId, 'tv') — no collision with movie of same ID
[onSettled: invalidate + refetch watchlistKeys.all]
    ↓ /library shows TV show with correct link /tv/[id]
```

### AI Mood with Country Filter Flow (MODIFIED)

```
[User: "I want Korean drama"]
    ↓ POST /api/ai/recommend
[Gemini: suggest_genres tool called with origin_country: "KR", media_type: "tv", genres: [18]]
    ↓ tool.execute: insert to ai_recommendations with messages=full_conversation
[Return to client: genreSuggestion with origin_country: "KR"]
    ↓ handleShowMovies in MoodSection
[router.push("/home/recommendations?genres=18&mood=...&type=tv&country=KR")]
    ↓ recommendations page reads country param
[discoverTV({ genreIds: "18", originCountry: "KR" })]
    ↓ TMDB /discover/tv?with_genres=18&with_origin_country=KR
[Korean drama results]
```

### Top 100 Reorder Flow (NEW)

```
[User presses ↑ on item at rank 5]
[useReorderTopHundred().mutate({ itemId, newRank: 4 })]
    ↓ optimistic: swap ranks 4 and 5 in cache
[reorderTopHundred server action]
    ↓ db.transaction: update rank=4 item to rank=5, then target to rank=4
[onSettled: invalidate top-hundred query]
```

---

## Integration Points

### TMDB API

| New Parameter | Endpoint | Notes |
|---------------|----------|-------|
| `with_origin_country=KR` | `/discover/tv` | TMDB supports ISO 3166-1 alpha-2 codes. HIGH confidence — documented TMDB parameter. |
| `with_original_language=ko` | `/discover/tv` | More precise than country for language-specific content. Consider adding alongside `with_origin_country`. |

**Recommendation:** Use `with_origin_country` (not `with_original_language`) as the primary filter. K-dramas are `KR`, not just `ko` language — some Korean-language shows air internationally. Country of origin is the more accurate signal for the "K-drama" use case.

### Drizzle ORM / Supabase

The `media_type` column uses a new pg enum `media_type`. Drizzle will generate a migration that:
1. Creates the enum type
2. Adds the column
3. Drops old constraint
4. Adds new constraint

After `npm run db:generate`, review the generated SQL before applying. The migration is reversible (can drop column + enum + restore old constraint) but doing so would lose any TV watchlist entries added after migration.

RLS policies need updating. The existing policy `watchlist_rls` (in `drizzle/rls-policies.sql`) allows `SELECT/INSERT/UPDATE/DELETE WHERE auth.uid() = user_id`. Since the new `media_type` column is non-null with a default, existing RLS policies continue to work without changes — no explicit filter on `media_type` is needed in the policy itself.

The new `top_hundred` table needs its own RLS policy added to `drizzle/rls-policies.sql`.

---

## Build Order

Build in this order — each step unblocks the next:

### Step 1: Schema + Types (Foundation — No UI Risk)
1. `drizzle/schema.ts` — Add `mediaTypeEnum`, `media_type` column to watchlist, `messages` to `ai_recommendations`, new `top_hundred` table
2. `npm run db:generate` — Generate migration
3. Review migration SQL — confirm `DEFAULT 'movie'` backfill and constraint rename
4. `npm run db:migrate` — Apply migration
5. `types/watchlist.ts` — Add `MediaType`, propagate `mediaType` field
6. `types/ai.ts` — Add `origin_country` to `GenreSuggestion`
7. `types/top-hundred.ts` — New file

### Step 2: Server Actions + Hooks (Data Layer — TypeScript will enforce completeness)
8. `actions/watchlist.ts` — Add `mediaType` throughout; `getWatchlistItemByTmdbId` takes `mediaType` param
9. `actions/top-hundred.ts` — New file: `getTopHundred`, `addToTopHundred`, `removeFromTopHundred`, `reorderTopHundred`
10. `lib/utils.ts` — Add `formatRating()` utility
11. `lib/tmdb.ts` — Add `originCountry` option to `discoverTV`
12. `hooks/use-watchlist.ts` — Update key factory, add `mediaType` to all mutation inputs
13. `hooks/use-top-hundred.ts` — New file

### Step 3: AI Route (Self-Contained — No UI Dependencies)
14. `app/api/ai/recommend/route.ts` — Add guardrail to system prompt, `origin_country` to tool schema, full messages to DB insert

### Step 4: TV Watchlisting UI (Now That Data Layer Is Ready)
15. `components/movies/tv-detail-page.tsx` — Add watchlist buttons (import same hooks as movie-detail-page)
16. `components/watchlist/watchlist-card.tsx` — Route to `/tv/[id]` for TV items, add type badge
17. `components/ai/mood-section.tsx` — Add `origin_country` to URL param

### Step 5: Library UX Fixes
18. `components/watchlist/watchlist-content.tsx` — Add media type filter toggle, fix card persistence
19. `hooks/use-watchlist.ts` `onSettled` — Add forced refetch for instant sync fix

### Step 6: Discovery UX
20. Sidebar/nav — Rename "Discover" → "Movies" label
21. `app/(app)/discover/page.tsx` — Update metadata title
22. `app/(app)/home/page.tsx` — Update feature card label
23. Apply `formatRating()` in `movie-detail-page.tsx`, `tv-detail-page.tsx`

### Step 7: Top 100
24. `components/library/top-hundred-content.tsx` — New component
25. `app/(app)/library/top-100/page.tsx` — New route
26. `app/(app)/library/top-100/loading.tsx` — Skeleton
27. `components/watchlist/watchlist-content.tsx` — Add "Top 100" tab
28. RLS policy update for `top_hundred` table in Supabase Dashboard

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Changing the Unique Constraint Without a DEFAULT

**What goes wrong:** Running `ALTER TABLE watchlist ADD COLUMN media_type media_type NOT NULL` without a default fails immediately because existing rows cannot satisfy NOT NULL.

**Prevention:** Always add with `DEFAULT 'movie'` first, let it backfill, then (optionally) tighten the constraint.

### Anti-Pattern 2: Using `watchlistKeys.check(tmdbId)` Without `mediaType` After Migration

**What goes wrong:** A movie with `tmdbId=1396` and a TV show with `tmdbId=1396` would share the same TanStack Query cache key. Adding one to the watchlist would appear to add the other.

**Prevention:** The key factory change to `watchlistKeys.check(tmdbId, mediaType)` is enforced at the type level. TypeScript will flag all callers missing the second argument.

### Anti-Pattern 3: Storing Messages in a Separate Table

**What goes wrong:** Creating a `ai_conversation_messages` table with one row per message is over-engineered for analytics on a hobby app. Joins are expensive; querying a single conversation requires `WHERE conversation_id = ?` with ordering.

**Prevention:** Store the entire `UIMessage[]` array as a JSONB column on `ai_recommendations`. For analytics, query the JSONB column with PostgreSQL's `->` and `->>` operators. Restructure only if query patterns prove this insufficient (they won't for a hobby project).

### Anti-Pattern 4: Adding Drag-to-Reorder in v0.4

**What goes wrong:** DnD libraries (`@dnd-kit/core`, `@hello-pangea/dnd`) conflict with Framer Motion layout animations. The `top-hundred-content.tsx` will likely use Framer Motion for list entry animations. Mixing two animation systems for the same DOM elements causes z-index conflicts and double-animation jank.

**Prevention:** Use simple "move up / move down" buttons for rank changes in v0.4. Add drag-to-reorder in a dedicated v0.5 polish pass after the list animation behavior is confirmed stable.

### Anti-Pattern 5: Renaming `/discover` Route

**What goes wrong:** The backlog says "rename Discover → Movies" — if interpreted as a route change to `/movies`, it breaks all existing bookmarks, og-image routes, and the NProgress bar which uses `pathname.startsWith("/discover")`.

**Prevention:** Only rename the UI label in the sidebar and page title metadata. The route `/discover` stays as-is.

---

## Scalability Considerations

| Concern | Current (hobby) | At 10k users |
|---------|----------------|--------------|
| `getWatchlistTmdbIds` query | Full table scan per user (small tables) | Add index on `watchlist(user_id)` — already implicitly indexed by FK |
| `top_hundred` reorder transaction | Single user, sequential updates | Optimistic locking needed if concurrent edits possible — not a concern for personal lists |
| AI conversation JSONB storage | ~1-5 KB per row | At 10k users × 10 req/day × 30 days = 3M rows, ~3-15 GB — consider pruning old rows after 90 days |
| TMDB `with_origin_country` filter | No performance concern | TMDB handles server-side; not a client-side concern |

---

## Sources

- Direct inspection of `drizzle/schema.ts`, `actions/watchlist.ts`, `hooks/use-watchlist.ts`, `types/watchlist.ts`, `components/watchlist/watchlist-content.tsx`, `components/watchlist/watchlist-card.tsx`, `components/movies/tv-detail-page.tsx`, `components/movies/movie-detail-page.tsx`, `app/api/ai/recommend/route.ts`, `components/ai/mood-section.tsx`, `lib/tmdb.ts`, `app/(app)/library/page.tsx`, `app/(app)/home/page.tsx` (HIGH confidence — primary source)
- TMDB API `with_origin_country` parameter: documented in TMDB discover endpoint (MEDIUM confidence — stable API surface, verify at implementation against TMDB docs)
- TanStack Query v5 optimistic update patterns with `onMutate`/`onSettled` (HIGH confidence — consistent with existing codebase patterns)
- Drizzle ORM additive migration strategy with DEFAULT backfill (HIGH confidence — standard PostgreSQL DDL pattern)

---

*Architecture research for: v0.4 Watchlist & Polish milestone*
*Researched: 2026-02-28*

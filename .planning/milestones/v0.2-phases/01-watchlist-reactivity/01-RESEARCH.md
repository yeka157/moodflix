# Phase 1: Watchlist Reactivity - Research

**Researched:** 2026-02-17
**Confidence:** HIGH
**Skip research rationale:** N/A — full research performed

## Findings

### 1. Root Cause: Missing Optimistic Updates

**`hooks/use-watchlist.ts`** is the core file. Analysis of each mutation hook:

| Hook | Has `onMutate`? | Updates tmdbIds? | Updates list caches? | Updates check cache? |
|------|----------------|------------------|---------------------|---------------------|
| `useAddToWatchlist` | YES | YES (append) | NO | NO |
| `useRemoveFromWatchlist` | YES | YES (filter) | YES (filter all 3 list keys) | NO |
| `useUpdateWatchlistStatus` | NO | NO | NO | NO |
| `useRateWatchlistItem` | NO | NO | NO | NO |

**Root cause:** `useUpdateWatchlistStatus` and `useRateWatchlistItem` only have `onSettled` with `invalidateQueries`. Combined with `staleTime: 30_000` on the tmdbIds query, invalidation alone doesn't produce instant UI updates — the stale data is served for up to 30 seconds.

**Fix pattern:** Add `onMutate` handlers following the existing `useRemoveFromWatchlist` pattern (the best reference in the codebase). Must update ALL related caches: `tmdbIds`, `list("all")`, `list("want_to_watch")`, `list("watched")`, and `check(tmdbId)`.

### 2. TmdbIds Query Returns Only IDs

**Current:** `getWatchlistTmdbIds()` returns `number[]` — just TMDB IDs without status info.

**Problem:** Movie cards use `tmdbIds?.includes(movie.id)` to show a bookmark icon, but can't differentiate between "want to watch" and "watched" states (BACKLOG-18 blocker).

**Fix:** Change return type to `Map<number, WatchlistStatus>` (or serialized equivalent since server actions can't return Maps). Options:
- Return `{ tmdbId: number; status: WatchlistStatus }[]` from server action
- Convert to `Map` in the hook via `select`
- Update `movie-card.tsx` to use the map for icon differentiation

**Server action change in `actions/watchlist.ts`:**
```typescript
// Current:
export async function getWatchlistTmdbIds(): Promise<number[]> {
  // returns rows.map(r => r.tmdbId)
}

// New:
export async function getWatchlistTmdbIds(): Promise<{ tmdbId: number; status: WatchlistStatus }[]> {
  // returns rows.map(r => ({ tmdbId: r.tmdbId, status: r.status }))
}
```

### 3. Schema Migration: Remove `watching` Status

**Current schema (`drizzle/schema.ts` line 12-16):**
```typescript
export const watchlistStatusEnum = pgEnum("watchlist_status", [
  "want_to_watch",
  "watching",  // TO BE REMOVED
  "watched",
]);
```

**Migration steps:**
1. Convert existing `watching` rows to `want_to_watch` in DB
2. Remove `watching` from the pgEnum
3. Generate migration with `npm run db:generate`
4. Apply with `npm run db:migrate`

**Note:** `serializeItem()` in `actions/watchlist.ts` already handles `watching` → `want_to_watch` conversion (line 25), which is a safety net during migration.

**Gotcha:** PostgreSQL enum value removal requires `ALTER TYPE ... RENAME VALUE` or recreation. Drizzle Kit may generate this, but verify the migration SQL manually.

### 4. Route Rename: `/watchlist` → `/library`

**Files requiring path changes:**

| File | Change |
|------|--------|
| `app/(app)/watchlist/page.tsx` | Rename directory to `library/` |
| `app/(app)/watchlist/loading.tsx` | Rename directory to `library/` |
| `components/layout/app-navbar.tsx` (line 42-44) | `/watchlist` → `/library`, label "Watchlist" → "Library" |
| `lib/supabase/middleware.ts` (line 33) | Protected prefix `/watchlist` → `/library` |
| `actions/watchlist.ts` (lines 104, 130, 160, 182) | `revalidatePath("/watchlist")` → `revalidatePath("/library")` |
| `components/watchlist/watchlist-content.tsx` | Update heading text |
| `components/watchlist/watchlist-card.tsx` | Update "Remove from Watchlist" label |
| `components/movies/movie-detail-modal.tsx` | Update button/label text |
| `components/movies/movie-card.tsx` | Update toast messages |

### 5. Movie Card Icon System

**Current (`movie-card.tsx`):** Single bookmark icon in top-right corner. Shows on hover for non-saved movies, always visible for saved movies.

**Required:** Two distinct icons per CONTEXT.md decisions:
- **Bookmark** = want to watch (outline when inactive, filled when active)
- **CircleCheck** = watched (outline when inactive, filled green when active)

**Approach:**
- Show both icons stacked vertically on hover (bookmark on top, check below)
- Only the active icon stays visible when not hovering
- Click bookmark = add as "want to watch" (or toggle off if already want_to_watch)
- Click check = mark as "watched" (or toggle off if already watched)
- Switching state (want→watched or watched→want) updates via `useUpdateWatchlistStatus`

### 6. Detail Modal Redesign

**Current:** Dropdown menu for status selection + separate like/dislike buttons.

**Required per CONTEXT.md:** Separate "Add to Library" and "Mark as Watched" buttons side by side:
- Not in library: Two buttons — "Add to Library" (bookmark) + "Mark as Watched" (check)
- Want to watch: "In Library" button (filled bookmark, click to remove) + "Mark as Watched" button
- Watched: "Add to Library" button + "Watched" button (filled check, click to revert)
- Like/dislike buttons remain after either action

### 7. Library Page Adjustments

**Current (`watchlist-content.tsx`):** Heading "Your Watchlist", tabs: All / Want to Watch / Watched.

**Changes:**
- Heading: "My Library" (or "Library" — Claude's discretion)
- Tabs: Keep All / Want to Watch / Watched (3-tab structure works well for the two-bucket model)
- Empty state: Update CTA text from "watchlist" to "library" language
- Route: `/library`
- Library cards: Update "Remove from Watchlist" → "Remove from Library"

### 8. Feedback System

Per CONTEXT.md decisions:
- **Add/toggle success:** Icon animation only (no toast) — scale bounce + fill transition
- **Status change (want→watched):** Silent — icon update is sufficient
- **Error handling:** Error toast + optimistic rollback
- **Remove from library:** Toast with undo button via Sonner's `action` option
- **Like/dislike:** Color change + subtle bounce animation

**Sonner undo toast pattern:**
```typescript
toast("Removed from library", {
  action: {
    label: "Undo",
    onClick: () => addMutation.mutate(/* re-add the item */),
  },
  duration: 5000,
});
```

### 9. Add-to-Watchlist Server Action

**Current:** `addToWatchlist` already accepts optional `status` parameter (defaults to `want_to_watch`). This means "Mark as Watched" for a new movie can reuse the same action with `status: "watched"`.

### 10. Query Key Architecture

The existing `watchlistKeys` factory is well-designed:
```typescript
watchlistKeys.all       → ["watchlist"]           // invalidate everything
watchlistKeys.list(s)   → ["watchlist", "list", s] // specific status list
watchlistKeys.tmdbIds() → ["watchlist", "tmdbIds"] // all IDs + statuses
watchlistKeys.check(id) → ["watchlist", "check", id] // single item lookup
```

All keys nest under `watchlistKeys.all`, so `invalidateQueries({ queryKey: watchlistKeys.all })` in `onSettled` correctly triggers background refetches for all queries. The issue is that without `onMutate`, the UI waits for the refetch to complete.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| PostgreSQL enum removal migration fails | MEDIUM | HIGH | Test migration SQL locally, prepare manual ALTER TYPE fallback |
| Optimistic update race condition on rapid clicks | LOW | MEDIUM | Cancel in-flight queries in onMutate, disable buttons during pending |
| Route rename breaks deep links / bookmarks | LOW | LOW | Add redirect from `/watchlist` → `/library` in middleware |

## Implementation Order

Recommended order for the planner:

1. **Schema migration** — Remove `watching` enum value (prerequisite for type safety)
2. **Server action: tmdbIds** — Return status alongside IDs
3. **Hook fixes** — Add optimistic updates to all mutations, update tmdbIds type
4. **Type updates** — Update `WatchlistStatus` type (already done — no `watching`)
5. **Route rename** — `/watchlist` → `/library` across all files
6. **Movie card icons** — Dual icon system with status differentiation
7. **Detail modal** — Replace dropdown with separate action buttons
8. **Library page** — Update headings, labels, empty states
9. **Feedback system** — Icon animations, undo toast, remove success toasts

---

*Research completed: 2026-02-17*
*Confidence: HIGH — all findings based on actual codebase analysis*

# Architecture Research

**Domain:** Movie watchlist cache architecture & page transitions
**Researched:** 2026-02-17
**Confidence:** HIGH

## Standard Architecture

### System Overview — Watchlist Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     UI Components                            │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌──────────┐ │
│  │ MovieCard │  │ DetailMdl │  │ WatchList │  │ HomeMovs │ │
│  │ (bookmark │  │ (watchlst │  │ (list +   │  │ (cards)  │ │
│  │  + eye)   │  │  controls)│  │  tabs)    │  │          │ │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └────┬─────┘ │
│        │              │              │              │       │
├────────┴──────────────┴──────────────┴──────────────┴───────┤
│                  TanStack Query Cache                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ ["watchlist", │  │ ["watchlist", │  │ ["watchlist", │      │
│  │  "tmdbIds"]  │  │  "check", N] │  │  "list", S]  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
├─────────────────────────────────────────────────────────────┤
│                  Mutations (useMutation)                      │
│  addToWatchlist | removeFromWatchlist | updateStatus | rate  │
├─────────────────────────────────────────────────────────────┤
│                  Server Actions                              │
│  actions/watchlist.ts → Drizzle ORM → Supabase PostgreSQL   │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Query Keys Consumed |
|-----------|----------------|---------------------|
| `MovieCard` | Show bookmark/watched icons, quick add | `watchlistKeys.tmdbIds()` |
| `MovieDetailModal` | Full watchlist controls (add/remove/status/rating) | `watchlistKeys.check(tmdbId)` |
| `WatchlistContent` | List items, filter by status tab | `watchlistKeys.list(status)` |
| `WatchlistCard` | Item actions (status dropdown, like/dislike, remove) | via parent props |

## Root Cause Analysis — Current Bugs

### Bug: Mutations don't propagate (BACKLOG-16, 17, 19)

**Current pattern (broken):**

```
useUpdateWatchlistStatus / useRateWatchlistItem:
  onMutate: (nothing — no optimistic update)
  onSettled: invalidateQueries({ queryKey: watchlistKeys.all })
```

**Why it feels laggy:**
1. No `onMutate` optimistic update → UI waits for server round-trip
2. `invalidateQueries` triggers refetch, but component doesn't re-render until refetch completes
3. `staleTime: 30_000` on `useWatchlistTmdbIds` means even after invalidation, the query may serve stale data for up to 30 seconds

**Fix pattern:**

```typescript
useUpdateWatchlistStatus:
  onMutate: async (params) => {
    // 1. Cancel in-flight queries
    await queryClient.cancelQueries({ queryKey: watchlistKeys.all })

    // 2. Snapshot previous state for rollback
    const previousCheck = queryClient.getQueryData(watchlistKeys.check(tmdbId))
    const previousList = queryClient.getQueryData(watchlistKeys.list())

    // 3. Optimistically update ALL related caches
    queryClient.setQueryData(watchlistKeys.check(tmdbId), ...)
    queryClient.setQueryData(watchlistKeys.list(), ...)
    queryClient.setQueryData(watchlistKeys.list(oldStatus), ...)
    queryClient.setQueryData(watchlistKeys.list(newStatus), ...)

    return { previousCheck, previousList }
  }
  onError: rollback from context
  onSettled: invalidateQueries (refetch truth from server)
```

### Bug: Same icon for all statuses (BACKLOG-18)

**Current:** `useWatchlistTmdbIds()` returns `number[]` — just IDs, no status info.

**Fix:** Change to return `Map<number, WatchlistStatus>` or `{ tmdbId: number, status: WatchlistStatus }[]` so MovieCard can differentiate between "want to watch" (bookmark) and "watched" (eye/check).

### Feature: Quick "Mark as Watched" (BACKLOG-15)

**Current:** MovieCard only has bookmark button → always adds as `want_to_watch`.

**Fix:** Add second button (eye icon) that calls `addToWatchlist({ ..., status: "watched" })`. The `addToWatchlist` server action already accepts an optional `status` parameter (or needs one added).

## Architectural Patterns

### Pattern 1: Comprehensive Optimistic Updates

**What:** Update ALL query caches that could display the changed data in `onMutate`
**When to use:** Any mutation that affects data displayed in multiple components
**Trade-offs:** More complex `onMutate` code, but instant UI response

**Example:**
```typescript
onMutate: async (newStatus) => {
  await queryClient.cancelQueries({ queryKey: watchlistKeys.all });

  // Update the per-movie check cache
  queryClient.setQueryData(
    watchlistKeys.check(tmdbId),
    (old) => old ? { ...old, status: newStatus } : old
  );

  // Update the "all" list
  queryClient.setQueryData(
    watchlistKeys.list(),
    (old) => old?.map(item =>
      item.id === id ? { ...item, status: newStatus } : item
    )
  );

  // Update tmdbIds map (if we change the return type)
  // ...
}
```

### Pattern 2: Framer Motion Page Transitions in App Router

**What:** Wrap route content in `AnimatePresence` at the layout level
**When to use:** Transitions between sibling routes (`/home`, `/discover`, `/watchlist`)
**Trade-offs:** Requires client component wrapper; exit animations need `mode="wait"`

**Example:**
```typescript
// app/(app)/layout.tsx — add transition wrapper
"use client";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

### Pattern 3: Status-Aware Movie Card Icons

**What:** Use different icons and colors based on watchlist status
**When to use:** Any component that shows watchlist state for a movie

**Icon mapping:**
| Status | Icon | Style |
|--------|------|-------|
| Not in watchlist | Bookmark (outline) | `opacity-0 group-hover:opacity-100` |
| `want_to_watch` | Bookmark (filled) | `bg-primary text-primary-foreground` |
| `watched` | Eye (filled) | `bg-green-600 text-white` |
| `watching` | Play (filled) | `bg-blue-600 text-white` |

## Data Flow

### Mutation Flow (Fixed)

```
[User taps "Mark as Watched"]
    ↓
[onMutate] → optimistically update tmdbIds, check, list caches
    ↓ (instant — UI updates immediately)
[mutationFn] → server action → Drizzle INSERT → PostgreSQL
    ↓
[onSettled] → invalidateQueries → refetch truth from server
    ↓
[Cache updated] → if server state matches optimistic, no visible change
                 → if server state differs, UI corrects silently
```

### Query Key Hierarchy

```
["watchlist"]                          ← parent key for invalidation
    ├── ["watchlist", "tmdbIds"]       ← Map<tmdbId, status> for card icons
    ├── ["watchlist", "check", 12345]  ← single movie watchlist state
    ├── ["watchlist", "list", "all"]   ← all watchlist items
    ├── ["watchlist", "list", "want_to_watch"]
    ├── ["watchlist", "list", "watching"]
    └── ["watchlist", "list", "watched"]
```

## Suggested Build Order

1. **Fix optimistic updates** (BACKLOG-16, 17, 19) — foundation for everything else
2. **Change tmdbIds to return status map** (BACKLOG-18 prerequisite)
3. **Add "Mark as Watched" button** (BACKLOG-15) — uses fixed optimistic updates
4. **Update card icons** (BACKLOG-18) — uses status map
5. **Page transitions** (POLISH-01) — independent, can parallel with 1-4
6. **Responsive testing** (POLISH-03) — after UI changes stabilize
7. **Accessibility audit** (POLISH-04) — after all UI is final
8. **Final build/lint** (POLISH-05) — last step

## Anti-Patterns

### Anti-Pattern 1: Polling Instead of Optimistic Updates

**What people do:** Set `refetchInterval: 1000` to "fix" stale data
**Why it's wrong:** Wastes bandwidth, still has 1s delay, N+1 server calls
**Do this instead:** Proper optimistic updates in `onMutate`

### Anti-Pattern 2: Separate State for UI vs Cache

**What people do:** `useState` for "isInWatchlist" alongside TanStack Query
**Why it's wrong:** Two sources of truth diverge, causes ghost states
**Do this instead:** Derive all UI state from query cache

### Anti-Pattern 3: Over-Invalidating

**What people do:** `queryClient.invalidateQueries()` (no key filter — invalidates EVERYTHING)
**Why it's wrong:** Refetches all queries including movie lists, trending, etc.
**Do this instead:** `invalidateQueries({ queryKey: watchlistKeys.all })` — scoped to watchlist

## Sources

- TanStack Query v5 docs — Optimistic Updates guide
- Framer Motion docs — AnimatePresence, layout animations
- Next.js App Router docs — layout and template components
- Netflix, Letterboxd — observed UX patterns

---
*Architecture research for: movie watchlist cache architecture & page transitions*
*Researched: 2026-02-17*

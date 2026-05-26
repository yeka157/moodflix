# Spotlight Search + Notifications Inbox — Design Spec

**Date:** 2026-05-26
**Status:** Approved (pending review)
**Scope:** Wire two dead topbar buttons (search + bell). Ship as two sequential PRs.

## Problem

After the post-revamp `AppTopBar` was added (commit `ec6579e`), two prominent topbar buttons render but do nothing useful:

- **Search button** — visually styled as an input but is a `<Link href="/discover">`. Cmd+K shortcut also routes to `/discover`. There is no command palette anywhere in the app.
- **Notification bell** — plain `<button>` with no `onClick`, no dropdown, no badge. Pure decoration. Per-movie `BellNotifyButton` on detail pages already subscribes users to release pushes, but the topbar bell offers no inbox to view what was sent.

## Goals

1. Replace topbar search with a **macOS Spotlight-style command palette** for fast film/series navigation.
2. Wire the topbar bell to a **notifications inbox** that logs every release push as a viewable, mark-as-read item.
3. Ship as two independent PRs so spotlight (no DB work) lands first.

## Non-Goals

- People (actor/director) search — out of scope; movies + TV only.
- AI-event or system notifications in v1 — schema reserves a `type` enum column but only `release` is populated.
- Realtime websocket updates for unread count — polling is sufficient for v1.
- Replacing the existing `/discover` page's inline search input — discover is for browsing with filters; palette is for fast keyboard navigation.
- Visual regression / Playwright automation — project has no test runner.

## Decisions

| Decision | Choice | Reasoning |
|---|---|---|
| Search scope | Movies + TV (TMDB multi-search, persons filtered out) | Library + actions = scope creep for v1 |
| Result layout | Combined list with `FILM` / `TV` badges per row | Closest to Spotlight feel; one keyboard nav list |
| Trigger | Topbar pill click + Cmd/Ctrl+K | No mobile tab — topbar already touch-accessible; bottom bar already at 5 items |
| Empty state | Recent searches (localStorage) + Trending (existing endpoint) | Hides Recent gracefully on first run, free discovery hook |
| Enter behavior | Enter → nav to detail; Cmd/Ctrl+Enter → add to library inline | Spotlight default + one power shortcut |
| Bell surface | Popover on desktop, full `/notifications` page on mobile + "See all" link | Familiar Linear / Vercel pattern |
| Notification storage | New `notifications` table (full inbox) | Enables unread badge + read state |
| Notification types v1 | `release` only; enum reserved for `ai_event`, `system` | YAGNI; schema extensible |
| Mark-as-read | Auto-mark visible items on open + manual "Mark all read" | Linear / GitHub pattern |
| Live updates | TanStack Query 30s refetch when window focused | Supabase realtime is overkill for v1 |
| Ship order | Sequential — PR-1 Spotlight, PR-2 Notifications | Spotlight has zero DB dependency, ships faster |

## Architecture

### PR-1: Spotlight Palette — New & Modified Files

```
components/search/
  search-palette.tsx           — Dialog wrapping <Command>, controlled open state
  search-palette-trigger.tsx   — Topbar pill button; owns Cmd/Ctrl+K listener
  search-recent.ts             — localStorage helpers (get/add/clear), max 8 entries
  trending-section.tsx         — renders trending movies + TV (uses existing trending endpoint)
  recent-section.tsx           — renders recent queries
  results-section.tsx          — renders multi-search results

hooks/use-search-multi.ts      — TanStack Query, debounced 300ms, enabled when q.length >= 2
lib/tmdb.ts                    — add searchMulti(query: string) function
types/movie.ts                 — add MultiSearchResult discriminated union (movie | tv)

app/api/movies/multi/route.ts  — TMDB /search/multi proxy, filters persons, 5min ISR

components/layout/app-topbar.tsx  — modified: replace search <Link> with <SearchPaletteTrigger />
```

### PR-2: Notifications Inbox — New & Modified Files

```
drizzle/schema.ts              — add notifications table + notificationTypeEnum
drizzle/migrations/0010_*      — generated migration
drizzle/rls-policies.sql       — append SELECT policy for notifications (user_id = auth.uid())

types/notification.ts          — Notification, NotificationType
actions/notifications.ts       — list, markAsRead, markAllAsRead, markVisibleAsRead, getUnreadCount
hooks/use-notifications.ts     — infinite query + unread count query

components/notifications/
  notification-bell.tsx        — bell button + unread badge; renders desktop popover and mobile link via CSS breakpoints (no JS media query)
  notification-list.tsx        — shared list (variant: popover | page)
  notification-row.tsx         — single row (poster, title, body, time-ago, unread dot)

app/(app)/notifications/page.tsx     — mobile + "See all" route; SSR initial 20 rows
app/(app)/notifications/loading.tsx  — skeleton

app/api/notifications/push/route.ts  — modified: insert notification row alongside push send

components/layout/app-topbar.tsx     — modified: replace dead <button> with <NotificationBell />

components/ui/popover.tsx            — added via shadcn CLI
components/ui/command.tsx            — added via shadcn CLI (PR-1, listed here for completeness)
```

## Detailed Design

### Spotlight Palette (PR-1)

**Component contract**

`<SearchPaletteTrigger />` renders the topbar pill (visual match to current Link). Owns the global `keydown` listener for `Cmd/Ctrl+K`. Toggles a single shared `open` state — implemented via a React context provider at the topbar level, or a tiny zustand store (`useSearchOpen`).

`<SearchPalette />` is a shadcn `<Dialog>` wrapping cmdk's `<Command>`. Width: `640px` desktop, full-width on mobile (`sm:max-w-[640px]`). Body region scrollable to `max-h-[60vh]`. Footer shows keyboard hints: `↑↓ navigate · ↵ open · ⌘↵ add · esc close` (hidden on mobile).

**Open flow**

1. User clicks topbar pill OR presses Cmd/Ctrl+K
2. Dialog opens, backdrop dims, focus trapped, `<CommandInput>` autofocused
3. Closes on Esc, outside click, or row select

**Body states**

| State | Render |
|---|---|
| `q === ""` + no recent | `<TrendingSection />` only |
| `q === ""` + has recent | `<RecentSection />` then `<TrendingSection />` |
| `q.length >= 2` + loading | Previous results visible + top-right spinner |
| `q.length >= 2` + results | `<ResultsSection results={data} />` |
| `q.length >= 2` + zero results | Centered "No matches for '{query}'" |
| Fetch error | Keep previous results; no toast (silent retry on next keystroke) |

**Recent storage (`search-recent.ts`)**

```ts
type RecentEntry = { q: string; ts: number };
const STORAGE_KEY = "moodflix:search:recent";
const MAX_RECENT = 8;

function getRecent(): RecentEntry[];        // returns [] on parse error
function addRecent(query: string): void;    // dedup by q, prepend, slice to MAX
function clearRecent(): void;
```

Purely local — no server sync. On user logout, no special wipe (data is per-browser anyway and contains no PII).

**TMDB hook (`use-search-multi.ts`)**

```ts
useQuery({
  queryKey: ["tmdb", "multi", debouncedQuery],
  queryFn: ({ signal }) =>
    fetch(`/api/movies/multi?q=${encodeURIComponent(debouncedQuery)}`, { signal })
      .then((r) => r.json() as Promise<{ results: MultiSearchResult[] }>),
  enabled: debouncedQuery.length >= 2,
  staleTime: 60_000,
});
```

`useDebounce` (already installed) wraps the input value, 300ms.

**Row render**

- Poster thumb 32×48, lazy load, fallback `/placeholder-poster.svg`
- Badge: red (`bg-primary`) `FILM` or muted `TV`
- Title (`line-clamp-1`) + year (`text-muted-foreground`, `tabular-nums`)
- Selected row: red-tinted background (`bg-primary/10`), 2px primary border-left
- `onSelect`: `router.push(href)` → close palette → `addRecent(currentQuery)` if query non-empty

**Keyboard map**

| Key | Action |
|---|---|
| `↑` / `↓` | Move selection (cmdk native) |
| `↵` Enter | Open detail page |
| `⌘↵` / `Ctrl+↵` | Inline add to library (toast confirms) |
| `Esc` | Close palette |
| `⌘K` / `Ctrl+K` | Toggle palette open |

Cmd+Enter intercepted via `onKeyDown` on the `<CommandInput>`. Calls existing `useAddToWatchlist` mutation with `{ tmdbId, mediaType, title, posterPath }`. Optimistic update; on success toast `Added "${title}" to library`; on failure toast error.

**Mobile**

- Topbar pill still visible
- Palette renders as full-screen sheet (Dialog default behavior at small breakpoints)
- Recent + trending stack vertically
- Cmd+Enter shortcut hidden (no inline add — tap-and-hold or row arrow could be future scope)
- Tap row → nav

**Multi-search API route (`app/api/movies/multi/route.ts`)**

- Server route, requires auth (matches existing `/api/movies` pattern)
- Query param `q` (URL-encoded), max 200 chars (request validation via Zod)
- Calls TMDB `/search/multi`, filters `media_type === "person"`, maps to `MultiSearchResult`:
  ```ts
  type MultiSearchResult = {
    id: number;
    mediaType: "movie" | "tv";
    title: string;          // normalized (TV uses `name`)
    year: string | null;    // normalized (TV uses `first_air_date`)
    posterPath: string | null;
    overview: string | null;
  };
  ```
- Returns `{ results: MultiSearchResult[] }` (max 20)
- Cache: `revalidate = 300` (5 min ISR)
- On TMDB failure: log server-side, return `{ results: [] }` with HTTP 200
- Rate limit: 60 req/min per user via existing `lib/rate-limit.ts`

### Notifications Inbox (PR-2)

**Schema (`drizzle/schema.ts`)**

```ts
export const notificationTypeEnum = pgEnum("notification_type", [
  "release",
  "ai_event",
  "system",
]);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull().default("release"),
    title: text("title").notNull(),
    body: text("body"),
    posterPath: text("poster_path"),
    href: text("href"),
    tmdbId: integer("tmdb_id"),
    mediaType: text("media_type"),                                    // "movie" | "tv" | null
    readAt: timestamp("read_at", { withTimezone: true }),             // null = unread
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("notifications_user_unread_idx").on(t.userId, t.readAt),
    index("notifications_user_created_idx").on(t.userId, t.createdAt),
  ]
);
```

**RLS policy (append to `drizzle/rls-policies.sql`)**

```sql
alter table notifications enable row level security;
create policy "Users can view own notifications" on notifications
  for select using (auth.uid() = user_id);
-- No insert/update/delete from client — server actions only via Drizzle direct connection
```

**Migration**

- `npm run db:generate` → produces `drizzle/migrations/0010_<name>.sql`
- `npm run db:migrate` to apply
- RLS policy applied manually in Supabase SQL Editor (per existing `drizzle/rls-policies.sql` convention)

**Server actions (`actions/notifications.ts`)**

```ts
listNotifications(opts: { limit?: number; cursor?: string }): Promise<{ items: Notification[]; nextCursor: string | null }>
getUnreadCount(): Promise<number>
markAsRead(notificationId: string): Promise<void>
markAllAsRead(): Promise<void>
markVisibleAsRead(ids: string[]): Promise<void>   // batched update where id in (...) and userId = ?
```

All scoped to `auth.getUser()`, redirect to `/login` if null. Drizzle queries include explicit `eq(notifications.userId, user.id)` since Drizzle bypasses Supabase RLS via direct connection.

**TanStack Query hooks (`hooks/use-notifications.ts`)**

```ts
useNotifications()       // useInfiniteQuery, cursor pagination, 20 per page
useUnreadCount()         // useQuery, refetchInterval: 30_000 when focused, refetchOnWindowFocus: true
useMarkRead()            // useMutation, optimistic update
useMarkAllRead()         // useMutation, optimistic
useMarkVisibleAsRead()   // useMutation, debounced caller-side
```

**Live updates strategy**: Polling. `useUnreadCount` refetches every 30s while window focused, pauses when blurred. Other tabs get reconciled on focus return. Acceptable lag for v1; can swap to Supabase realtime later without breaking the hook contract.

**Push route modification (`app/api/notifications/push/route.ts`)**

For each `notification_subscriptions` row matched to a release push:
1. Build notification payload (title, body, poster, href)
2. `INSERT INTO notifications (user_id, type, title, body, poster_path, href, tmdb_id, media_type) VALUES (...)`
3. `webpush.sendNotification(subscription, payload)`
4. On step-3 failure: log to console (and Sentry if wired), do not roll back row — notification stays in inbox even if push delivery fails

**Backfill**: None. Existing `notification_subscriptions.lastNotifiedAt` indicates past pushes but title/body/href cannot be reliably reconstructed. Inbox starts empty for existing users; new pushes onward populate.

**Bell component (`notification-bell.tsx`)**

CSS breakpoints (not JS media query) — avoids SSR hydration mismatch and the need for a `useMediaQuery` hook (not in codebase).

```tsx
const { data: unread = 0 } = useUnreadCount();
const ariaLabel = `Notifications${unread ? `, ${unread} unread` : ""}`;
const badge = unread > 0 && <Badge>{unread > 9 ? "9+" : unread}</Badge>;

return (
  <>
    {/* Mobile: direct link to page */}
    <Link
      href="/notifications"
      aria-label={ariaLabel}
      className="md:hidden ..."
    >
      <Bell />
      {badge}
    </Link>

    {/* Desktop: popover */}
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className="hidden md:grid ..."
        >
          <Bell />
          {badge}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] max-h-[480px] p-0" align="end">
        <NotificationList variant="popover" />
      </PopoverContent>
    </Popover>
  </>
);
```

Both `useUnreadCount` calls are deduped by TanStack Query — no double fetch.

**NotificationList**

- Header: "Notifications" + "Mark all read" button (disabled when no unread)
- Body: scrollable; renders rows from `useNotifications()`; infinite scroll sentinel triggers next page
- Footer (popover variant only): "See all notifications →" link to `/notifications`
- Auto-mark on mount: 500ms debounce → collect rendered unread row IDs → `markVisibleAsRead(ids)` mutation
- Empty state: centered illustration + "You're all caught up. We'll ping you when releases drop."
- Error state: "Couldn't load notifications · Retry" inline button

**NotificationRow**

- Layout: 36×54 poster, title (line-clamp-2), body (line-clamp-1, muted), time-ago
- Unread indicator: 8px red dot at left edge
- `onClick`: `router.push(href)` → `markAsRead(id)` (optimistic) → close popover if open
- Row min-height 56px (≥44px touch target)

**/notifications page**

- SSR fetches first 20 rows via `listNotifications({ limit: 20 })`
- Wrap client tree in `HydrationBoundary` with prefetched query state
- Renders `<NotificationList variant="page" />` with wider layout, page header
- `loading.tsx`: skeleton of 5 rows

## Data Flow

### Spotlight search

```
User keystroke
  → useDebounce(300ms)
    → useSearchMulti hook fires fetch
      → /api/movies/multi?q=...
        → tmdb.searchMulti(q)
          → filter persons, normalize → MultiSearchResult[]
            → cache (5min ISR)
              → JSON response
    → React Query stores in cache (60s stale)
      → <ResultsSection /> re-renders
        → cmdk handles ↑↓ selection
          → Enter: router.push(href) + addRecent(q) + close
          → Cmd+Enter: useAddToWatchlist mutation + toast
```

### Notification flow (end-to-end)

```
Release date hits cron / TMDB poll (existing logic)
  → push route enumerates matching notification_subscriptions
    → for each (user, tmdbId):
      → INSERT notifications row
      → webpush.sendNotification(subscription)
        → (if browser open) → service worker → browser notification
    → COMMIT
  → Next time user focuses tab:
    → useUnreadCount refetches → returns new count
    → bell badge updates
    → user clicks bell
      → desktop: popover opens, useNotifications loads first 20
        → 500ms after mount → markVisibleAsRead(visible ids)
        → optimistic readAt update → badge decrements
      → mobile: router.push("/notifications")
    → user clicks row → router.push(href) → markAsRead(id) → close
```

## Error Handling

| Scenario | Behavior |
|---|---|
| TMDB multi-search fails | Return empty results 200; silent in UI; next keystroke retries |
| Network drop while typing | Keep previous results visible; no toast |
| `useAddToWatchlist` fails on Cmd+Enter | Toast error; no state mutation |
| Notification fetch fails | Inline "Retry" link in popover/page |
| `markAsRead` fails | Silent retry once; on second fail toast |
| `markVisibleAsRead` fails | Silent — next refetch reconciles |
| Push insert succeeds, push delivery fails | Notification remains in inbox; logged server-side |
| Notification row references deleted TMDB id | Detail page handles 404; notification still navigable |
| Two tabs open, divergent unread counts | Next focused refetch reconciles |
| Hard refresh during palette open | Palette state lost (session only) |

## Accessibility

- Palette dialog: `role="dialog"`, `aria-label="Search"`, focus trap, returns focus on close
- Palette input: `aria-live="polite"` region announces "N results for {query}"
- Bell button: dynamic `aria-label="Notifications, N unread"`
- Popover: `role="menu"` with `role="menuitem"` rows
- All row touch targets ≥ 44px on mobile
- `prefers-reduced-motion` respected — no entrance animations, no shimmer
- Keyboard-only operation fully supported for both palette and bell popover

## Testing

Project has no test runner installed. Plan:

**Manual verification per PR** — full checklist in section 5 of brainstorm transcript. Highlights:

PR-1
- Cmd+K opens palette (Mac) / Ctrl+K opens (other)
- Topbar pill click opens palette
- Esc + outside click + row select all close
- Recent + Trending behavior across first-run vs returning user
- Cmd+Enter inline add with toast
- Mobile sheet, touch targets, scroll
- `npm run build` + `npm run lint` pass

PR-2
- Migration applies on dev DB
- Drizzle Studio shows table + indexes
- Manually inserted row triggers badge after focused refetch
- Bell click: popover on desktop, nav on mobile
- Auto-mark visible on open
- "Mark all read" clears unread
- Row click navs + marks read
- E2E push flow: subscribe via BellNotifyButton → trigger push → row inserted + push delivered
- `/notifications` SSR + infinite scroll
- `npm run build` + `npm run lint` pass

**Light unit tests if/when vitest is added later**

- `search-recent.test.ts` — localStorage logic
- `actions/notifications.test.ts` — mocked Drizzle

**Out of scope**: automated E2E, visual regression, performance budgets.

## Rollout

**PR-1 (Spotlight)** — no DB changes, deploy any time. Feature is additive; if it breaks, topbar still falls back to the existing visual (revert is single file). No migration, no data risk.

**PR-2 (Notifications)** — gated on migration:

1. Generate + apply migration on staging Supabase project, smoke test
2. Apply migration on production Supabase
3. Apply RLS policy in Supabase SQL Editor
4. Deploy code
5. Manually trigger one test push to verify row inserts

**Rollback**

- PR-1: revert commit
- PR-2: revert code first (bell falls back to dead button); leave table in place — empty table is harmless. Drop only if schema bug.

## Open Questions

None known. All decisions captured in the table above.

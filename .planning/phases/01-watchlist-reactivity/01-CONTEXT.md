# Phase 1: Watchlist Reactivity - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix optimistic update propagation so all watchlist mutations (add, remove, status change, rating) reflect instantly across movie cards, detail modal, and library page. Add "Mark as Watched" one-tap action. Show distinct icons per status. Remove `watching` status entirely (schema migration). Rename watchlist to "library" concept with route change to `/library`.

</domain>

<decisions>
## Implementation Decisions

### Icon Design & States
- **Icon pair:** Bookmark (want to watch) + Check/CircleCheck (watched)
- **`watching` status:** Remove entirely — schema migration to drop the enum value, convert any existing `watching` rows to `want_to_watch`
- **Route rename:** `/watchlist` → `/library`, navbar label updated accordingly

### Mark as Watched UX
- **Detail modal:** Separate "Mark as Watched" button next to the existing "Add to Watchlist" button
- **Both card + modal:** One-tap actions available in both locations
- **Data model:** Single `watchlist` table, two-bucket UX (want_to_watch + watched). One row per user+movie. Marking watched on a "want to watch" movie flips the status. Marking watched on a new movie creates a row with `watched` status directly.
- **No simultaneous states:** A movie is either not saved, want-to-watch, or watched — not both

### Feedback & Toasts
- **Add/toggle success:** Icon animation only (no toast) — the visual change IS the feedback
- **Status change (want→watched):** Silent — icon update is sufficient
- **Error handling:** Error toast + optimistic rollback to previous state
- **Remove from library:** Toast with undo button (auto-dismiss after ~5s)
- **Like/dislike:** Brief animation (color change + subtle bounce)

### Watchlist → Library Page
- **Route:** `/watchlist` → `/library`
- **Concept:** "My Library" with two buckets rather than a watchlist with statuses

### Claude's Discretion
- Fill style for active vs inactive icons (outline→filled vs dimmed→colored)
- Color for the "watched" check icon (green vs crimson vs other)
- Both icons showing on hover layout — placement, stacking, spacing
- Behavior when clicking active icon to remove (toggle off from card vs modal-only)
- Tab structure on library page (two tabs vs keep "All")
- Navbar label ("My Library" vs "Library")
- Sort order for library page
- Rating visibility on library cards
- Undo toast implementation (Sonner action button vs snackbar)
- Icon animation style (scale bounce vs fill transition)
- Rating prompt after marking watched (or not)
- Empty state design for library tabs

</decisions>

<specifics>
## Specific Ideas

- User specifically wants the ability to mark movies as watched WITHOUT thinking of it as "adding to watchlist" — the UX reframe from "watchlist" to "library" supports this mental model
- Feedback philosophy: minimal for positive actions (icon animation), explicit for errors (toast + rollback) and destructive actions (toast with undo)
- Reference: Letterboxd's approach where you can log a movie as watched independently of your watchlist

</specifics>

<deferred>
## Deferred Ideas

- Sidebar navigation layout (Revamp-UI reference) — Phase 2 or v2
- TV Shows section — v2 feature
- "My Top 100" personal list — v2 feature
- Premium/Upgrade tier — v2 feature

</deferred>

---

*Phase: 01-watchlist-reactivity*
*Context gathered: 2026-02-17*

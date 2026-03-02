# Phase 10: TV Watchlisting & Watchlist UX - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Extend the library/watchlist system to support TV shows (add, mark watched, like/dislike, remove from `/tv/[id]`), add media type badges to cards, implement instant cross-page state sync for all watchlist mutations, and add media type filtering on the library page. Schema migration (Phase 9) is already complete — `media_type` column, updated unique constraint, and types are in place.

</domain>

<decisions>
## Implementation Decisions

### Type Badge Design
- Small pill/tag overlaid on the poster, top-left corner
- Text labels: "TV" and "Movie"
- Both types always show their badge (not TV-only)
- Appears on library cards (scope for other pages is Claude's discretion)

### TV Detail Page Actions
- Action icons (bookmark, watched/CircleCheck, like/dislike, remove) match the movie detail page exactly — same icons, same positions, same behavior
- Only 2 statuses exist: **Want to Watch** and **Watched** (no "Watching" status — it was removed)
- Same icon placement as `/movie/[id]`
- Show TV-specific metadata: number of seasons and episode count alongside existing metadata (rating, genres, overview)

### Instant Sync Behavior
- Optimistic updates — icon updates immediately, rolls back on server failure
- Subtle transition animation (color fade or scale pulse) when a card's state syncs from a mutation elsewhere
- All status/rating changes keep the card visible in the current grid view — card stays in place, only flags update
- Only explicit "remove from library" action hides the card
- Animated fade-out when a card is removed from the library

### Library Filtering UX
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

</decisions>

<specifics>
## Specific Ideas

- Badge text discussion: "TV" / "Movie" chosen as short labels — "Series" was considered but "TV" is more standard across streaming platforms (Netflix, TMDB)
- Status model is simplified: only Want to Watch and Watched exist (no Watching/Following for ongoing series)
- TV detail page should feel identical to movie detail page with the addition of season/episode metadata

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-tv-watchlisting-watchlist-ux*
*Context gathered: 2026-03-02*

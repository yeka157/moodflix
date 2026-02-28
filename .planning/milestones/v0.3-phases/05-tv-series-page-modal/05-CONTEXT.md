# Phase 5: TV Series Page + Modal - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can navigate to `/series`, browse four curated TV content rows, and open a TV-specific detail modal. TV cards include watchlist buttons (assuming a schema migration phase is added to v0.3 before this phase). Uses existing movie UI components with minimal modification.

**Important scope change:** The original roadmap scoped TV as read-only discovery (no watchlist buttons). User has decided to expand v0.3 to include a schema migration phase adding `media_type` to watchlist, so TV cards will have full watchlist functionality. A new phase must be added to v0.3 before Phase 5 to handle the schema + action changes.

</domain>

<decisions>
## Implementation Decisions

### Page layout
- Hero banner at top of `/series` page, similar to discover page — full-width backdrop from a trending TV show
- Hero banner is clickable — opens the TV detail modal for the featured show
- Hero show selection: Claude's discretion (e.g., #1 trending or daily rotation)
- Search/filter functionality: Claude's discretion based on phase scope
- Row labels use plain descriptive text: "Trending TV Shows", "Korean Drama", "Chinese Drama", "Top Rated Series"
- Four rows in order: Trending TV Shows, Korean Drama, Chinese Drama, Top Rated Series
- Each row has horizontal scroll with arrow navigation (same pattern as discover page)

### TV detail modal
- Status badge styling: Claude's discretion (color-coded or neutral)
- TV-specific info placement (seasons, episodes, status): Claude's discretion within existing modal layout
- "Created by" vs "Director" label handling: Claude's discretion based on available data
- Overview only — no episode list or season selector (Claude's discretion confirmed)
- Watch providers shown for user's region (same regional detection as movie modal)

### Card appearance
- TV cards have watchlist/watched buttons (bookmark + check pattern) — same as movie cards
- Button pattern: Claude's discretion to reuse movie card pattern for consistency
- Visual indicator for TV vs movie: Claude's discretion
- Hover overlay content: Claude's discretion (matching movie card style)

### Navbar integration
- "Series" link text: "Series" (short form, user confirmed)
- Position in navbar: Claude's discretion (among Home, Discover, Series, Library)
- Icon usage: Claude's discretion (text only or icon + text)
- Mobile nav: Claude's discretion (same treatment as other links)

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

</decisions>

<specifics>
## Specific Ideas

- Hero banner should be clickable to open detail modal (like the movie hero on discover)
- Row labels should be descriptive: "Trending TV Shows", "Korean Drama", "Chinese Drama", "Top Rated Series"
- TV cards should behave identically to movie cards (bookmark + check buttons, same hover interactions)
- Navbar link labeled "Series" (not "TV Series" or "TV Shows")

</specifics>

<deferred>
## Deferred Ideas

- **TV Watchlist Schema Migration (HIGH PRIORITY):** User wants watchlist functionality for TV shows in v0.3. Requires adding `media_type` column to watchlist table, updating watchlist server actions and hooks to support TV. This must be added as a new v0.3 phase BEFORE Phase 5. Use `/gsd:add-phase` to formalize.
- Episode list/season browser in TV modal — future enhancement

</deferred>

---

*Phase: 05-tv-series-page-modal*
*Context gathered: 2026-02-22*

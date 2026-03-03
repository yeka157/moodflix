# Phase 11: Discovery UX - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Three targeted UX improvements to the discovery experience: (1) add TV show search to the `/series` page, (2) rename sidebar "Discover" label to "Movies", and (3) display TMDB ratings as "X.X/10" format throughout the app. No new pages, no new data sources, no new features beyond these three items.

</domain>

<decisions>
## Implementation Decisions

### TV Search on /series
- Mirror `/discover` search exactly — same bar position, same debounced live results, same interaction pattern
- Standalone text search — ignores genre toggle filters; typing a query replaces all browse rows
- Clearing the query restores the previous genre/browse view
- Search results displayed as a poster grid (matching `/discover` search results layout)

### Rating Display Format
- Show rating on detail pages only (movie and TV) — cards stay clean with just poster/title
- Replace existing star rating entirely with "X.X/10" numeric format — no stars alongside
- Hide rating completely (no element rendered) when `vote_count <= 10`

### Sidebar Label Rename
- Rename "Discover" to "Movies" — label text only
- Route `/discover` unchanged
- No tooltip/aria changes, no other nav label tweaks

### Claude's Discretion
- No-results empty state messaging for TV search
- Visual treatment of X.X/10 on detail pages (icon pairing, typography, placement)
- Search bar visual styling details

</decisions>

<specifics>
## Specific Ideas

Follow existing `/discover` search UX as the reference pattern for `/series` search — consistency across both pages is the priority.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 11-discovery-ux*
*Context gathered: 2026-03-03*

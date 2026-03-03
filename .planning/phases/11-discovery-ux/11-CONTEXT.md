# Phase 11: Discovery UX - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Three targeted UX improvements to the discovery experience: (1) add TV show search to the `/series` page, (2) rename sidebar "Discover" label to "Movies", and (3) display TMDB ratings as "X.X/10" format throughout the app. No new pages, no new data sources, no new features beyond these three items.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
User deferred all decisions to Claude. The following areas are open for Claude to determine during planning and implementation:

**TV Search on /series:**
- Search bar placement and visual style (match existing patterns on `/discover`)
- Live debounced search vs submit-based (follow existing `/discover` search pattern for consistency)
- How browse rows are replaced/restored when a query is active
- Empty state and no-results messaging

**Sidebar Label Rename:**
- Straightforward text change from "Discover" to "Movies" in the sidebar navigation component
- No route changes — `/discover` path stays as-is

**Rating Display Format:**
- Visual treatment of "X.X/10" (inline text, badge, or icon-paired)
- Placement on detail pages (movie and TV)
- Whether ratings also appear on cards or only on detail views
- Threshold: hide rating when `vote_count <= 10`

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Follow existing codebase patterns for consistency (e.g., match `/discover` search UX for the `/series` search bar).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 11-discovery-ux*
*Context gathered: 2026-03-03*

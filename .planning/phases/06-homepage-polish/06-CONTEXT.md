# Phase 6: Homepage Polish - Context

**Gathered:** 2026-02-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix loading skeleton colors across the app and add personalized "Because you liked" recommendation rows to the home page. Skeleton fix replaces crimson `bg-accent` with neutral gray `bg-muted`. Recommendation rows surface TMDB recommendations based on the user's liked/watched movies with daily rotation.

</domain>

<decisions>
## Implementation Decisions

### Recommendation row placement
- Interleaved with existing home page content
- Order: Hero → Trending → **Recommendation rows** → Mood Section → Feature Cards
- Recommendation rows appear between trending and the AI mood section

### Recommendation row count
- Claude's discretion on how many rows to show (1–3) based on available watch history

### Row style
- Claude's discretion — match existing movie row patterns unless there's a good reason to differ

### Label sentence patterns
- Use noticeable variety in sentence patterns ("Because you liked", "More like", "If you loved", "Since you enjoyed")
- Variety should be visible to users — different patterns each day add personality
- No freshness indicator (no "Updated today" text) — the row just changes silently

### Source movie display
- Claude's discretion on text-only vs text + thumbnail for the source movie reference
- Claude's discretion on whether clicking the source title opens the detail modal
- Claude's discretion on filtering out already-watched movies from recommendations

### Rotation & freshness
- Daily rotation with deterministic seed (userId + date) — per roadmap spec
- Source movie selected from top-5 most recently liked/watched — per roadmap spec
- Claude's discretion on surprise vs predictable rotation feel
- Claude's discretion on handling users with only 1 liked movie (show daily vs hide after a while)
- Claude's discretion on loading state for recommendation rows

### Skeleton color fix
- Replace `bg-accent` with `bg-muted` across ALL skeleton components — uniform neutral gray everywhere
- Consistent skeleton color across all pages (home, discover, series, watchlist)

### Skeleton animation
- Slow down the shimmer animation — current speed may feel too fast, make it calmer
- Claude's discretion on whether skeleton shapes should more closely match content shapes

### Skeleton density
- Fixed count of skeleton cards per row (e.g., 6) — not responsive to viewport width

### Claude's Discretion
- Number of recommendation rows (1–3)
- Row visual style (match existing or slight variation)
- Source movie label format (text-only vs thumbnail)
- Source title clickability
- Watchlist filtering in recommendations
- Rotation surprise vs predictability
- Single-movie-history edge case handling
- Recommendation row loading state
- Skeleton shape refinement

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Key constraint from roadmap: deterministic daily rotation using `userId + new Date().toDateString()` seed, 4+ sentence patterns, top-5 most recently liked/watched as source pool.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-homepage-polish*
*Context gathered: 2026-02-23*

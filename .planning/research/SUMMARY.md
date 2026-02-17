# Project Research Summary

**Project:** Moodflix
**Domain:** Movie watchlist polish, bug fixes, UI revamp & web assets
**Researched:** 2026-02-17
**Confidence:** HIGH

## Executive Summary

Moodflix is a fully functional movie watchlist + AI mood recommendation app (Phases 1-7 complete). This milestone focuses on three areas: (1) fixing watchlist reactivity bugs where mutations don't propagate across components due to incomplete TanStack Query optimistic updates, (2) revamping the UI layout and generating branded web assets based on design references, and (3) polishing with page transitions, responsive testing, and accessibility compliance.

The root cause of all watchlist bugs (BACKLOG-15 through 19) is incomplete optimistic update coverage in TanStack Query mutations. Status changes and ratings lack `onMutate` handlers entirely, and the `tmdbIds` query returns only IDs without status info. These are straightforward fixes that require updating the existing hooks — no new libraries needed.

The UI revamp involves transitioning from a top navbar to a sidebar-based layout (matching the Revamp-UI reference), creating branded web assets (logo, favicon, OG images inspired by the Movielist logo reference), and ensuring the new layout is responsive. Key risk is the layout change touching many components — must be done carefully to avoid regressions.

## Key Findings

### Recommended Stack

No new core libraries needed. Add `eslint-plugin-jsx-a11y` and `@axe-core/react` as dev dependencies for accessibility testing. All watchlist fixes use existing TanStack Query patterns. Page transitions use existing Framer Motion. Web asset generation uses standard tooling.

**Core technologies (already installed):**
- TanStack Query 5.90 — fix optimistic update patterns
- Framer Motion 12.33 — page transitions
- Next.js 16.1.6 — App Router layouts for sidebar

### Expected Features

**Must have (table stakes):**
- Instant UI feedback on watchlist mutations (fix bugs)
- Visual distinction between watched/want-to-watch icons
- One-tap "Mark as Watched" action
- Responsive layout across devices
- Branded logo and favicon

**Should have (competitive):**
- Smooth page transitions
- Sidebar navigation (matches modern streaming app UX)
- Professional web assets (OG images, app icons)

**Defer (v2+):**
- TV Shows section (sidebar reference)
- "My Top 100" feature (sidebar reference)
- Premium/Upgrade tier (sidebar reference)

### Architecture Approach

Fix watchlist reactivity by adding comprehensive `onMutate` optimistic updates to ALL mutation hooks. Change `useWatchlistTmdbIds` to return a `Map<number, WatchlistStatus>` so movie cards can show status-specific icons. Transition from top navbar to sidebar layout in `app/(app)/layout.tsx`. Create `<PageTransition>` client wrapper for Framer Motion animations.

**Major components to change:**
1. `hooks/use-watchlist.ts` — add optimistic updates to all mutations, change tmdbIds return type
2. `components/movies/movie-card.tsx` — add eye icon for watched, use status map
3. `app/(app)/layout.tsx` — sidebar layout replacing top navbar
4. `components/layout/app-navbar.tsx` → `components/layout/app-sidebar.tsx` — new sidebar component
5. Web assets — logo SVG, favicon, OG images

### Critical Pitfalls

1. **Cache key mismatch** — update ALL list variant caches in onMutate, not just the "all" list
2. **Stale tmdbIds** — `staleTime: 30_000` blocks optimistic perception; always update in onMutate
3. **AnimatePresence + Server Components** — keep layout as Server Component, wrap children only
4. **Sidebar responsive** — sidebar must collapse on mobile (hamburger or bottom nav)
5. **OKLCH contrast** — verify crimson accent passes WCAG AA on dark background

## Implications for Roadmap

### Phase 1: Watchlist Bug Fixes
**Rationale:** Foundation for all UX improvements — must be instant before adding new UI
**Delivers:** All 5 BACKLOG items resolved (15-19)
**Addresses:** BACKLOG-15, 16, 17, 18, 19
**Avoids:** Cache key mismatch pitfall, stale tmdbIds pitfall

### Phase 2: UI Revamp & Web Assets
**Rationale:** Layout change affects all pages — do before polish/responsive testing
**Delivers:** Sidebar layout, branded logo/favicon/OG images, updated visual design
**Uses:** Framer Motion for sidebar animations, web-asset-generator for icons
**Implements:** Sidebar navigation matching Revamp-UI reference

### Phase 3: Polish & Accessibility
**Rationale:** Must come after UI changes are finalized — tests final state
**Delivers:** Page transitions, responsive fixes, WCAG 2.1 AA compliance, build validation
**Avoids:** AnimatePresence pitfalls, contrast failures, keyboard nav gaps

### Phase Ordering Rationale

- Bug fixes first: new UI features (sidebar, mark-as-watched button) depend on working optimistic updates
- UI revamp second: layout change must happen before responsive testing and accessibility audit
- Polish last: tests the final UI state, not an intermediate one

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** Sidebar responsive behavior on mobile — hamburger vs bottom nav vs collapsible
- **Phase 2:** Web asset generation — SVG logo creation, favicon formats, OG image design

Phases with standard patterns (skip research-phase):
- **Phase 1:** TanStack Query optimistic updates — well-documented, clear patterns
- **Phase 3:** Accessibility audit — standard WCAG checklist, established tooling

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | No new libraries needed, all patterns well-documented |
| Features | HIGH | Clear bug reports, concrete reference designs |
| Architecture | HIGH | Root cause identified by reading actual code |
| Pitfalls | HIGH | Based on actual codebase analysis, not hypothetical |

**Overall confidence:** HIGH

### Gaps to Address

- Sidebar responsive behavior: hamburger menu on mobile? Bottom nav? Need to decide during Phase 2 planning
- Logo design: exact SVG creation from reference — may need iteration
- Future features from sidebar reference (TV Shows, My Top 100, Upgrade) — document but defer

## Sources

### Primary (HIGH confidence)
- Actual codebase analysis — `hooks/use-watchlist.ts`, `components/movies/movie-card.tsx`
- TanStack Query v5 docs — optimistic updates
- Framer Motion docs — AnimatePresence

### Secondary (MEDIUM confidence)
- Reference images — `Reference_Logo.png`, `Revamp-UI.png`
- Netflix/Letterboxd — observed UX patterns
- WCAG 2.1 specification — contrast and keyboard requirements

---
*Research completed: 2026-02-17*
*Ready for roadmap: yes*

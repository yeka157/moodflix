---
phase: 07-ui-ux-revamp
plan: 01
subsystem: ui
tags: [framer-motion, sidebar, navigation, layout, tailwind, oklch]

# Dependency graph
requires:
  - phase: 06-homepage-polish
    provides: App layout with top navbar, color tokens in globals.css

provides:
  - Hover-expandable sidebar (60px→200px) replacing top navbar on desktop
  - Fixed bottom tab bar for mobile/tablet navigation
  - Warmer dark color tokens (hue 25, higher chroma) across all surfaces
  - Updated app layout wiring sidebar + tab bar with correct content offsets

affects:
  - 07-02 (detail pages — inherits sidebar layout)
  - 07-03 (browse/grid — inherits sidebar layout)
  - 07-04 (cleanup — removes app-navbar.tsx)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Hover-expand sidebar using Framer Motion animate width + spring transition
    - useReducedMotion gates all animation durations (duration:0 when reduced)
    - layoutId="sidebar-active-pill" for animated active indicator (omitted when reduced motion)
    - AnimatePresence mode="wait" for logo/icon swap in sidebar header
    - motion.span animate opacity+width for label fade during collapse

key-files:
  created:
    - components/layout/app-sidebar.tsx
    - components/layout/bottom-tab-bar.tsx
  modified:
    - app/(app)/layout.tsx
    - app/globals.css

key-decisions:
  - "AppSidebar uses onHoverStart/onHoverEnd only — no click/pin toggle"
  - "Sidebar fixed at 60px collapsed, 200px expanded — desktop only (hidden md:flex)"
  - "BottomTabBar fixed at bottom — mobile only (flex md:hidden), h-16 satisfies 44px touch target"
  - "app-navbar.tsx NOT deleted in this plan — preserved until Plan 04 confirms all references gone"
  - "Main content offset: md:pl-[60px] pb-16 md:pb-0 — covers sidebar and tab bar clearance"
  - "Sidebar background: oklch(0.11 0.008 25) — darker than page bg oklch(0.13 0.008 25)"
  - "MoodflixIcon variant=dark used in sidebar (cutoutColor #0a0a0a vs sidebar bg — negligible diff at 28px)"

patterns-established:
  - "Sidebar hover-expand: motion.aside animate width, spring stiffness:280 damping:26"
  - "Nav links share isActive() helper across sidebar and tab bar components"
  - "User dropdown in sidebar uses DropdownMenu side=right align=end"

requirements-completed: [REVAMP-01]

# Metrics
duration: 2min
completed: 2026-02-23
---

# Phase 7 Plan 01: Sidebar Navigation + Warm Color Scheme Summary

**Hover-expandable sidebar (60px→200px) with Framer Motion spring replaces top navbar; mobile bottom tab bar added; dark theme shifted to warmer hue-25 OKLCH palette**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-23T14:58:39Z
- **Completed:** 2026-02-23T15:00:44Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- AppSidebar component with hover-expand, logo swap, 4 nav links with active pill, user dropdown
- BottomTabBar component for mobile with 4 icon+label links and active state
- App layout updated: navbar removed, sidebar + tab bar wired in with correct content offsets
- Color tokens updated to warmer dark palette (chroma raised from 0.004-0.006 to 0.008-0.01 at hue 25)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create sidebar + bottom tab bar components and update color tokens** - `8589beb` (feat)
2. **Task 2: Wire sidebar into app layout, replace navbar** - `85cb676` (feat)

## Files Created/Modified
- `components/layout/app-sidebar.tsx` - Hover-expandable sidebar with Framer Motion, nav items, user dropdown
- `components/layout/bottom-tab-bar.tsx` - Mobile fixed bottom navigation with 4 icon+label links
- `app/(app)/layout.tsx` - Updated to import AppSidebar + BottomTabBar, remove AppNavbar, fix content offsets
- `app/globals.css` - Dark theme color tokens shifted to warmer hue-25 values; sidebar token set to oklch(0.11 0.008 25)

## Decisions Made
- Hover-expand only (no pin/click toggle) — keeps interaction model simple
- Active pill uses `layoutId="sidebar-active-pill"` with AnimatePresence for smooth transitions between routes, gated by `useReducedMotion`
- Logo area uses `AnimatePresence mode="wait"` to cross-fade MoodflixIcon ↔ MoodflixLogo on expand/collapse
- `app-navbar.tsx` preserved — will be removed in Plan 04 to avoid breaking anything during parallel development

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Sidebar layout foundation is in place for Plans 02-04 to build on
- All 4 nav routes (home, discover, series, library) are accessible
- Build and lint pass cleanly
- app-navbar.tsx still present but no longer used in app layout

---
*Phase: 07-ui-ux-revamp*
*Completed: 2026-02-23*

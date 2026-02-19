---
phase: 03-polish-qa
plan: "02"
subsystem: ui
tags: [framer-motion, animation, nextjs-toploader, page-transitions, accessibility]

# Dependency graph
requires:
  - phase: 01-core-revamp
    provides: app/(app) route structure (home, discover, library)
  - phase: 02-branding-assets
    provides: MoodflixLogo, MoodflixIcon brand components used in navbar
provides:
  - Framer Motion page entry animation via app/(app)/template.tsx (remounts on every navigation)
  - Crimson 2px top progress bar via nextjs-toploader in app/(app)/layout.tsx
  - Animated navbar active pill with layoutId spring transition between routes
  - Cinematic hero entrance: backdrop scale-in + staggered content reveal (badges, title, overview, CTA)
  - Full prefers-reduced-motion support across all animations
affects: [03-polish-qa, any future route additions under (app)]

# Tech tracking
tech-stack:
  added: [nextjs-toploader@3.9.17]
  patterns:
    - template.tsx for per-navigation remount animations (App Router pattern)
    - useReducedMotion hook for a11y animation gating throughout the codebase
    - Conditional layoutId (undefined when reduced-motion) to skip layout animation path entirely
    - Framer Motion Variants with staggerChildren for cinematic sequential reveals
    - ease "as const" type assertion for Framer Motion strict TypeScript compatibility

key-files:
  created:
    - app/(app)/template.tsx
  modified:
    - app/(app)/layout.tsx
    - components/layout/app-navbar.tsx
    - components/movies/hero-banner.tsx

key-decisions:
  - "template.tsx entry-only animation (no exit) — exit animations broken in App Router due to AnimatePresence + router context conflict"
  - "template.tsx initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }} — false skips animation entirely at final state"
  - "NextTopLoader props: color=#FB2C36 (brand crimson), showSpinner=false, height=2, shadow=false"
  - "layoutId={shouldReduceMotion ? undefined : 'nav-active-pill'} — omitting layoutId skips layout animation path (vs just duration=0)"
  - "Hero backdrop moved to independent motion.div so it animates separately from staggered text content"
  - "delayChildren: 0.25 gives backdrop time to fade in before text content slides up"

patterns-established:
  - "useReducedMotion pattern: import hook, gate with conditional variants/initial/layoutId rather than CSS media queries"
  - "Framer Motion ease must be typed 'as const' in Variants for TypeScript strict mode"
  - "template.tsx remount pattern: no AnimatePresence needed — Next.js remounts template on every navigation"

requirements-completed: []

# Metrics
duration: 12min
completed: 2026-02-19
---

# Phase 03 Plan 02: Page Transitions & Hero Animation Summary

**Framer Motion page entry animation, crimson NProgress top bar, spring-animated navbar active pill, and cinematic hero backdrop scale-in with 80ms staggered content reveal — all respecting prefers-reduced-motion**

## Performance

- **Duration:** 12 min
- **Started:** 2026-02-19T06:57:40Z
- **Completed:** 2026-02-19T07:00:34Z
- **Tasks:** 2
- **Files modified:** 5 (1 created, 4 modified)

## Accomplishments
- Created `app/(app)/template.tsx` — fade+lift entry animation (opacity 0→1, y 8→0 in 250ms) that fires on every (app) route navigation via Next.js template remount
- Added `nextjs-toploader` with crimson `#FB2C36` 2px bar to `app/(app)/layout.tsx` — visible during client-side navigations, absent on auth pages
- Upgraded `app-navbar.tsx` with Framer Motion `layoutId="nav-active-pill"` spring animation that slides the active background between nav links
- Upgraded `hero-banner.tsx` with independent backdrop scale-in (1.05→1) and staggered content reveal (badges → title → overview → CTA button at 80ms intervals)
- Full `prefers-reduced-motion` support: `useReducedMotion()` hook used in all three components with conditional `initial`/`variants`/`layoutId`

## Task Commits

Each task was committed atomically:

1. **Task 1: Create template.tsx + add NextTopLoader to layout.tsx** - `f272994` (feat)
2. **Task 2: Navbar animated active pill + cinematic hero entrance** - `257cbdf` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `app/(app)/template.tsx` - New entry-only page transition wrapper for all (app) routes
- `app/(app)/layout.tsx` - Added NextTopLoader with crimson config before AppNavbar
- `components/layout/app-navbar.tsx` - motion.span with layoutId spring pill, useReducedMotion hook
- `components/movies/hero-banner.tsx` - Separate backdrop motion.div + staggerChildren content reveal
- `package.json` / `package-lock.json` - nextjs-toploader@3.9.17 added

## Decisions Made
- Used `initial={false}` (not `duration: 0`) when reduced motion is set — Framer Motion's `false` skips the animation state machine entirely, rendering at final state instantly
- Omit `layoutId` entirely (not just set duration 0) for reduced motion on navbar pill — layout animations have a separate code path that persists even with duration 0
- `template.tsx` uses entry-only animation with NO `exit` prop — exit animations cause issues in App Router when paired with AnimatePresence due to router context conflicts
- NextTopLoader `shadow={false}` — the default crimson drop-shadow glows against the dark background in an undesirable way
- `ease: "easeOut" as const` — required for Framer Motion's strict `Variants` TypeScript type (string is not assignable to `Easing | Easing[]`)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Framer Motion ease type error in itemVariants**
- **Found during:** Task 2 (hero-banner.tsx upgrade)
- **Issue:** TypeScript error — `ease: "easeOut"` typed as `string` is not assignable to Framer Motion's `Easing | Easing[]` type in strict Variants
- **Fix:** Added `as const` assertion: `ease: "easeOut" as const`
- **Files modified:** `components/movies/hero-banner.tsx`
- **Verification:** `npm run build` passes, no TypeScript errors
- **Committed in:** `257cbdf` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 type error bug)
**Impact on plan:** Minimal fix required by TypeScript strict mode. No scope creep.

## Issues Encountered
- Stale `.next` cache showed a phantom TypeScript error (hero-section.tsx with non-existent `showTagline` prop) — resolved by clearing `.next` directory before rebuilding. The source file did not contain the error; it was a cache artifact.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All (app) route page transitions are production-ready
- Navbar pill animation will automatically work for any new routes added to navLinks
- template.tsx is in place — future pages added under `app/(app)/` automatically get the entry animation
- Ready for Phase 03 Plan 03 (next polish task)

## Self-Check: PASSED

- app/(app)/template.tsx: FOUND
- app/(app)/layout.tsx: FOUND
- components/layout/app-navbar.tsx: FOUND
- components/movies/hero-banner.tsx: FOUND
- 03-02-SUMMARY.md: FOUND
- Commit f272994: FOUND
- Commit 257cbdf: FOUND

---
*Phase: 03-polish-qa*
*Completed: 2026-02-19*

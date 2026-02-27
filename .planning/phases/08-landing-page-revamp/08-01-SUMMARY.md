---
phase: 08-landing-page-revamp
plan: 01
subsystem: ui
tags: [framer-motion, tmdb, parallax, landing-page, hero-section, next-image]

# Dependency graph
requires:
  - phase: 07-ui-ux-revamp
    provides: "MoodflixLogo component in components/brand/, crimson theme, motion conventions"
provides:
  - "Cinematic parallax hero section with real TMDB backdrop and useScroll + useTransform"
  - "getHeroBackdrop() server function with 1-hour ISR cache"
  - "Updated landing navbar with Framer Motion entrance animation"
  - "App screenshot browser-frame mockup placeholder in hero"
affects: [08-02, 08-03, 08-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "getHeroBackdrop() pattern: fetch TMDB, first match with backdrop_path, return w1280 URL or null"
    - "useScroll + useTransform for parallax: target heroRef, offset start→end, backdropY 0%→25%, contentOpacity 1→0"
    - "useReducedMotion guard: all transforms fall back to static when prefers-reduced-motion"

key-files:
  created: []
  modified:
    - components/landing/hero-section.tsx
    - components/landing/landing-navbar.tsx
    - lib/tmdb.ts
    - app/page.tsx

key-decisions:
  - "Hero section uses useScroll targeting heroRef (not window) — scoped scroll progress for precise parallax control"
  - "backdropY: 0%→25% (not 50%) — subtle parallax depth without over-travel on short viewports"
  - "contentOpacity fades at [0, 0.6] not [0, 1] — content gone before backdrop fully scrolled past"
  - "Fallback background: solid oklch(0.11 0.008 25) with crimson radial glow when TMDB fails"
  - "Screenshot as browser-frame mockup div — real screenshot deferred (TODO comment in place)"
  - "Navbar always shows bg/80 + backdrop-blur — removed scroll-based state to simplify (Framer entrance animation added instead)"
  - "page.tsx uses Promise.all([getHeroBackdrop, getShowcasePosters]) — WIP movie-showcase.tsx requires posters prop, both fetches parallelized"

patterns-established:
  - "Server Component data fetching at page.tsx root, passed as props to Client Components"
  - "Parallax pattern: useScroll({ target: ref, offset: ['start start', 'end start'] }) + useTransform for Y/opacity"

requirements-completed: [HERO-BACKDROP, HERO-SCREENSHOT, CINEMATIC-THEME]

# Metrics
duration: 18min
completed: 2026-02-27
---

# Phase 8 Plan 01: Cinematic Hero Section Summary

**Parallax hero with real TMDB w1280 backdrop, useScroll scroll-tracking, browser-frame screenshot mockup, and Framer Motion animated landing navbar**

## Performance

- **Duration:** 18 min
- **Started:** 2026-02-27T00:00:00Z
- **Completed:** 2026-02-27T00:18:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added `getHeroBackdrop()` to `lib/tmdb.ts` — fetches trending movies, returns first `w1280` backdrop URL or null (1-hour ISR)
- Rewrote `hero-section.tsx` as cinematic parallax component: real TMDB backdrop with gradient overlays, `useScroll` + `useTransform` for parallax Y and content fade-on-scroll, `useReducedMotion` accessibility guard, app screenshot browser-frame mockup, dual CTAs
- Updated `landing-navbar.tsx` with Framer Motion `motion.nav` entrance animation, always-visible blur background, renamed "Log In" to "Sign In"
- Updated `app/page.tsx` to async Server Component with `Promise.all` for parallel TMDB fetches

## Task Commits

Each task was committed atomically:

1. **Task 1: Hero section with parallax backdrop + screenshot overlay** - `ed9cd61` (feat)
2. **Task 2: Update landing navbar to match app identity** - `154b302` (feat)

## Files Created/Modified
- `components/landing/hero-section.tsx` - Full rewrite: TMDB backdrop + parallax + screenshot mockup + CTAs
- `components/landing/landing-navbar.tsx` - Framer Motion entrance animation, always-blur sticky nav
- `lib/tmdb.ts` - Added `getHeroBackdrop()` export with 1-hour ISR
- `app/page.tsx` - Async Server Component, `Promise.all` for backdrop + showcase posters, passes `backdropUrl` and `posters` as props

## Decisions Made
- `useScroll` targets `heroRef` element (not default window) — gives precise scroll progress relative to hero section bounds
- Backdrop `y` offset: `0% → 25%` — subtle depth effect, avoids over-travel on short viewports or tall screens
- Content opacity fades at `[0, 0.6]` — disappears at 60% scroll through hero, before backdrop fully exits viewport
- Always-on navbar blur: removed scroll-triggered state (`scrolled` useState) — simpler and avoids flash on page load
- Browser-frame screenshot mockup uses CSS gradients + simulated UI elements — real screenshot deferred with TODO comment

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Integrated WIP movie-showcase changes into page.tsx**
- **Found during:** Task 2 (build verification)
- **Issue:** Pre-existing WIP modifications on `components/landing/movie-showcase.tsx` (from previous abandoned session) had changed the component to require a `posters: ShowcasePoster[]` prop. The build was failing with TypeScript error. The WIP also added `getShowcasePosters()` to `lib/tmdb.ts`.
- **Fix:** Updated `app/page.tsx` to import and call both `getHeroBackdrop()` and `getShowcasePosters()` in `Promise.all`, passing `posters` prop to `<MovieShowcase>`
- **Files modified:** `app/page.tsx`
- **Verification:** `npm run build` passes, TypeScript passes
- **Committed in:** `154b302` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 — blocking build error from pre-existing WIP)
**Impact on plan:** Fix was required to unblock the build. The additional TMDB fetch (`getShowcasePosters`) parallelizes with `getHeroBackdrop` so no performance regression. Scope is within Plan 01's file set.

## Issues Encountered
- Next.js build lock file existed from a previous run — cleared `.next/lock` and rebuilt cleanly
- Pre-existing WIP changes (from git status at session start) had partially implemented Plan 02+ features, causing `app/page.tsx` + `movie-showcase.tsx` to be out of sync. Resolved by updating `app/page.tsx` to match the WIP component contract.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Hero section is complete with real TMDB backdrop and parallax — ready for Plan 02 (Features + AI Preview sections)
- `getShowcasePosters()` is available in `lib/tmdb.ts` for Plan 02's movie showcase real-poster implementation
- Pre-existing WIP on `features-section.tsx`, `ai-preview-section.tsx`, and other files should be reviewed at Plan 02 start

---
*Phase: 08-landing-page-revamp*
*Completed: 2026-02-27*

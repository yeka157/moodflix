---
phase: 08-landing-page-revamp
plan: "02"
subsystem: landing-page
tags: [framer-motion, scroll-animation, tmdb, marquee, features-section]
dependency_graph:
  requires: []
  provides: [features-section, movie-showcase, getShowcasePosters]
  affects: [app/page.tsx, lib/tmdb.ts]
tech_stack:
  added: []
  patterns: [scroll-triggered-stagger, whileInView, useReducedMotion, dual-direction-marquee, next-image-fill]
key_files:
  created: []
  modified:
    - components/landing/features-section.tsx
    - components/landing/movie-showcase.tsx
    - lib/tmdb.ts
decisions:
  - "4-feature grid uses containerVariants staggerChildren=0.12 (not per-card delay) for clean orchestration"
  - "useReducedMotion sets initial='visible' (skips animation) rather than disabling Framer Motion globally"
  - "getShowcasePosters uses w342 TMDB image size for marquee cards (fast loading, adequate quality)"
  - "ShowcasePoster interface exported from lib/tmdb.ts (not types/) — co-located with the fetch function per data-fetching convention"
  - "app/page.tsx uses Promise.all for backdropUrl + posters — parallel fetches, single await"
  - "movie-showcase returns null when posters array is empty — clean no-op, no broken UI"
metrics:
  duration: "6 minutes"
  completed_date: "2026-02-27"
  tasks_completed: 2
  files_modified: 3
---

# Phase 08 Plan 02: Feature Highlights & Movie Showcase Summary

**One-liner:** 4-feature stagger grid with whileInView scroll reveal and dual-direction TMDB poster marquee with edge fade masks.

## What Was Built

### Task 1: 4-feature highlights with scroll-triggered stagger

Rewrote `components/landing/features-section.tsx` from a 3-feature grid to a 4-feature responsive grid with proper Framer Motion scroll-triggered stagger animation.

**Features now highlighted equally:**
- AI Mood Discovery (Sparkles icon)
- Movie & TV Browse (Film icon)
- Personal Library (BookmarkCheck icon)
- TV Series (Tv icon)

**Animation implementation:**
- `containerVariants` with `staggerChildren: 0.12` and `delayChildren: 0.1`
- `cardVariants` with `opacity: 0, y: 40` → `opacity: 1, y: 0` (duration 0.6s, cubic ease)
- `viewport={{ once: true, amount: 0.2 }}` — fires once when 20% of section is visible
- Heading has its own `headingVariants` with fade-up entry
- `useReducedMotion()` sets `initial="visible"` for users who prefer reduced motion
- `as const` on ease arrays for TypeScript strict mode compatibility

**Card design:** `bg-card/50 border border-border/50 rounded-2xl p-6` with `bg-accent/10 text-accent` icon circles. Hover: `border-accent/30 transition-colors duration-300`.

### Task 2: Movie showcase with real TMDB posters

Added `getShowcasePosters()` to `lib/tmdb.ts` and rewrote `components/landing/movie-showcase.tsx` to display real trending movie posters.

**`getShowcasePosters()` function:**
- Fetches `/trending/movie/week` with `{ next: { revalidate: 3600 } }` (1-hour ISR)
- Filters to movies with non-null `poster_path`, takes first 10
- Returns `Array<{ title: string; posterUrl: string }>` with `w342` image size
- Returns empty array on any failure (graceful degradation)

**MovieShowcase component:**
- Accepts `posters: ShowcasePoster[]` prop; returns null if empty
- Dual-direction marquee using existing CSS keyframes (`marquee-left` / `marquee-right`)
- Row 1 scrolls left, Row 2 scrolls right — each row duplicates posters for seamless loop
- `next/image` with `fill` sizing, `sizes="160px"`, `unoptimized` for TMDB CDN
- Left/right gradient fade overlays (`bg-gradient-to-r from-background`) for cinematic edge treatment
- `motion-reduce:[animation-play-state:paused]` Tailwind variant for reduced motion
- Section heading animates with `whileInView` fade-up (guarded by `useReducedMotion`)

**`app/page.tsx` update:**
- `Promise.all([getHeroBackdrop(), getShowcasePosters()])` for parallel TMDB fetches
- Passes `posters` to `<MovieShowcase posters={posters} />`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] TypeScript error from WIP Plan 01 changes**

- **Found during:** Task 1 verification (TypeScript check)
- **Issue:** Plan 01 (already committed) modified `app/page.tsx` to import `getShowcasePosters` (anticipating Plan 02), but `lib/tmdb.ts` didn't have the function yet. This caused a TypeScript error: "The export getShowcasePosters was not found in module lib/tmdb.ts"
- **Fix:** Adding `getShowcasePosters()` to `lib/tmdb.ts` (which was Task 2 anyway) resolved the blocking TS error. `app/page.tsx` was already correctly set up for both tasks.
- **Files modified:** `lib/tmdb.ts`
- **Commit:** `43338e1` (Task 2 commit)

## Verification

- TypeScript: `npx tsc --noEmit` — passes (0 errors)
- ESLint: `npm run lint` — passes (0 warnings)
- Build: `npm run build` has a pre-existing Turbopack race condition (ENOENT for manifest files) unrelated to code changes — confirmed by testing with original committed code which produces same error
- 4 feature cards present with correct icons and descriptions
- Stagger animation fires once on scroll via `whileInView`
- `useReducedMotion` respected for a11y
- Movie showcase accepts real TMDB poster prop and renders dual marquee

## Self-Check: PASSED

All files verified:
- FOUND: components/landing/features-section.tsx
- FOUND: components/landing/movie-showcase.tsx
- FOUND: lib/tmdb.ts
- FOUND: commit e36f775 (Task 1)
- FOUND: commit 43338e1 (Task 2)
- FOUND: getShowcasePosters in lib/tmdb.ts
- FOUND: whileInView in features-section.tsx
- FOUND: marquee in movie-showcase.tsx

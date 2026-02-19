---
phase: 02-branding-assets
plan: 01
subsystem: ui
tags: [svg, branding, fonts, next-font, bebas-neue, react, tailwind]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: app layout.tsx, app-navbar.tsx, landing-navbar.tsx, auth forms
provides:
  - MoodflixIcon SVG component (standalone M with film-strip perforations)
  - MoodflixLogo SVG component (full wordmark with Bebas Neue text)
  - Bebas Neue font loaded as --font-display CSS variable
  - Brand logo wired into all user-facing surfaces
affects: 02-02-favicon, 02-03-og-image, any future layout or brand updates

# Tech tracking
tech-stack:
  added: [Bebas Neue (next/font/google), SVG brand components]
  patterns:
    - SVG brand components with variant prop (dark/light) for background-aware rendering
    - Film-strip perforation via rect overlays matching background color (not true SVG cutouts)
    - Responsive logo swap via hidden/flex Tailwind classes (md breakpoint)
    - Font loaded via next/font/google with display block to prevent FOUT

key-files:
  created:
    - components/brand/moodflix-icon.tsx
    - components/brand/moodflix-logo.tsx
    - components/brand/index.ts
  modified:
    - app/layout.tsx
    - components/layout/app-navbar.tsx
    - components/landing/landing-navbar.tsx
    - components/landing/hero-section.tsx
    - components/auth/login-form.tsx
    - components/auth/signup-form.tsx

key-decisions:
  - "SVG perforations use rect overlays matching background (#0a0a0a dark variant) — not true SVG clip-path cutouts"
  - "Bebas Neue weight must be 400 only — single-weight font; other weights cause silent fallback or errors"
  - "Hero section uses showTagline={false} — badge already communicates AI discovery, tagline would duplicate"
  - "Crimson uses #FB2C36 hex in SVG fills — oklch() not valid in SVG fill attributes"
  - "Responsive navbar: MoodflixLogo (md+) hidden/MoodflixIcon (mobile) via Tailwind hidden/flex classes"

patterns-established:
  - "Brand variant prop: dark (app, #0a0a0a cutouts, crimson M) vs light (press, #ffffff cutouts)"
  - "All logo placements use hover:opacity-80 transition-opacity for subtle interactive feedback"
  - "aria-label on logo Links for screen reader accessibility (SVG has role=img aria-label internally)"

# Metrics
duration: 4min
completed: 2026-02-18
---

# Phase 2 Plan 01: Brand Component System Summary

**Crimson M SVG logo with Bebas Neue wordmark wired into app navbar (responsive), landing navbar, hero section, and auth forms**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-02-18T10:07:25Z
- **Completed:** 2026-02-18T10:11:26Z
- **Tasks:** 3 of 3 (checkpoint paused for visual verification)
- **Files modified:** 8 (3 created, 5 updated)

## Accomplishments
- Created `MoodflixIcon` — standalone 100x100 viewBox SVG with crimson M letterform and 4 film-strip perforation rects
- Created `MoodflixLogo` — 500x100 viewBox SVG wordmark with M geometry + "oodflix" text in Bebas Neue via `--font-display`
- Loaded Bebas Neue via `next/font/google` as `--font-display` CSS variable with `display: block` to prevent FOUT
- Wired brand logo into 5 placement points: app navbar (responsive wordmark/icon swap), landing navbar, hero section (above Badge), login form, signup form

## Task Commits

Each task was committed atomically:

1. **Task 1: Build MoodflixIcon and MoodflixLogo SVG components** - `29d6168` (feat)
2. **Task 2: Load Bebas Neue font in layout.tsx** - `97620ef` (feat)
3. **Task 3: Wire logo into all placement points** - `113a9e3` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `components/brand/moodflix-icon.tsx` - Standalone M SVG with film-strip perforations, dark/light variants
- `components/brand/moodflix-logo.tsx` - Full wordmark SVG (M + "oodflix" in Bebas Neue via --font-display)
- `components/brand/index.ts` - Barrel export for both brand components
- `app/layout.tsx` - Added Bebas_Neue font, --font-display variable, bebasNeue.variable in body className
- `components/layout/app-navbar.tsx` - MoodflixLogo (md+) / MoodflixIcon (mobile) responsive logo slot
- `components/landing/landing-navbar.tsx` - MoodflixLogo replaces text-based logo link
- `components/landing/hero-section.tsx` - MoodflixLogo added above Badge with fade-in motion
- `components/auth/login-form.tsx` - MoodflixLogo in CardHeader replaces text link
- `components/auth/signup-form.tsx` - MoodflixLogo in CardHeader replaces text link

## Decisions Made
- **SVG perforations as rect overlays:** Film-strip holes are crimson rect overlays using background color (#0a0a0a) — not true SVG clip-path/mask cutouts. Simpler, works correctly on dark backgrounds.
- **Bebas Neue weight 400 only:** Single-weight font — any other weight value would fail silently or at runtime.
- **No tagline in hero:** `showTagline={false}` in hero-section since the Badge already communicates "AI-Powered Movie Discovery"; the SVG tagline would duplicate this.
- **Hex colors in SVG:** `#FB2C36` used in all SVG fills — `oklch()` is not valid in SVG `fill` attributes.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Lint shows 3 pre-existing warnings in error boundary files (`_error` unused variable) — pre-existing, out of scope for this task, not introduced by these changes.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Brand component system complete and verified via build
- Awaiting visual checkpoint approval before proceeding to Plan 02-02 (favicon generation from MoodflixIcon SVG)
- Plan 02-02 will use the MoodflixIcon geometry as the source for all favicon sizes

---
*Phase: 02-branding-assets*
*Completed: 2026-02-18*

## Self-Check: PASSED
- components/brand/moodflix-icon.tsx: FOUND
- components/brand/moodflix-logo.tsx: FOUND
- components/brand/index.ts: FOUND
- Commit 29d6168 (Task 1): FOUND
- Commit 97620ef (Task 2): FOUND
- Commit 113a9e3 (Task 3): FOUND

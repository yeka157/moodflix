---
phase: 02-branding-assets
plan: 03
subsystem: og-images
tags: [og-image, satori, next-og, bebas-neue, sharp, tmdb, social-sharing]

# Dependency graph
requires:
  - phase: 02-01
    provides: MoodflixIcon SVG geometry, Bebas Neue font decisions
  - phase: 02-02
    provides: favicon PNG set
provides:
  - Global OG image (app/opengraph-image.tsx) — 1200x630 PNG via Satori
  - /home route OG image (app/(app)/home/opengraph-image.tsx)
  - /discover route OG image (app/(app)/discover/opengraph-image.tsx)
  - Pre-blurred movie poster collage background (public/og-base.png)
  - Bebas Neue woff font for Satori (assets/BebasNeue-Regular.woff)
  - og-base generation script (scripts/generate-og-base.js)
affects: social sharing previews on Twitter/LinkedIn/Slack for all Moodflix URLs

# Tech tracking
tech-stack:
  added: [next/og (ImageResponse), Satori, node:fs/promises, sharp (existing Next.js dep)]
  patterns:
    - Pre-blurred background PNG generated offline via sharp (Satori cannot apply CSS blur at runtime)
    - woff format required for Satori (woff2 causes "Unsupported OpenType signature wOF2" error)
    - readFile via node:fs/promises for both background PNG and font at request time
    - Flat JSX only inside ImageResponse — no React component functions
    - eslint.config.mjs globalIgnores excludes scripts/ (Node.js CJS not linted as Next.js)

key-files:
  created:
    - assets/BebasNeue-Regular.woff
    - assets/BebasNeue-Regular.woff2
    - scripts/generate-og-base.js
    - public/og-base.png
    - app/opengraph-image.tsx
    - app/(app)/home/opengraph-image.tsx
    - app/(app)/discover/opengraph-image.tsx
  modified:
    - app/layout.tsx
    - app/(app)/home/page.tsx
    - app/(app)/discover/page.tsx
    - eslint.config.mjs

key-decisions:
  - "woff format required for Satori — woff2 causes silent failure with 'Unsupported OpenType signature wOF2' error in Next.js 16"
  - "Pre-blurred og-base.png generated offline via sharp (Satori CSS filter:blur silently dropped — GitHub issue #573)"
  - "All three OG images show logo only — no subtitle (locked user decision from Phase 2 checkpoint)"
  - "scripts/ excluded from ESLint globalIgnores — Node.js CJS require() would fail @typescript-eslint/no-require-imports"
  - "TMDB backdrop URLs verified at generation time — 2 of 4 original plan URLs returned 404, replaced with working paths"

# Metrics
duration: ~115min
completed: 2026-02-19
---

# Phase 2 Plan 03: OG Social Preview Images Summary

**Bebas Neue wordmark on blurred movie poster collage background — 3 dynamic OG image routes via Satori, logo only (no subtitle)**

## Performance

- **Duration:** ~115 min
- **Started:** 2026-02-18T15:49:58Z
- **Completed:** 2026-02-19
- **Tasks:** 2 of 2 complete
- **Files modified:** 11 (7 created, 4 updated)

## Accomplishments

- Downloaded Bebas Neue woff font from fontsource npm package for Satori consumption
- Created `scripts/generate-og-base.js` — downloads 4 TMDB movie backdrops (Interstellar, Blade Runner 2049, Dune 2021, The Dark Knight), resizes each to 600x315, applies `blur(28)` + `brightness(0.45)` via sharp, composites into 1200x630 2x2 grid PNG
- Generated `public/og-base.png` (253KB) — pre-blurred movie poster collage used as OG background
- Created `app/opengraph-image.tsx` — global OG image: blurred collage + dark vignette gradient + "M OODFLIX" wordmark (crimson M, white OODFLIX, Bebas Neue 130px, no subtitle)
- Created `app/(app)/home/opengraph-image.tsx` — /home route OG, identical layout, alt text variant
- Created `app/(app)/discover/opengraph-image.tsx` — /discover route OG, identical layout, alt text variant
- Removed stale `openGraph.images` array from `app/layout.tsx` (was pointing to non-existent `/og-image.png`)
- Removed stale `twitter` metadata block from `app/layout.tsx` (was pointing to non-existent `/twitter-image.png`)
- Added `openGraph` overrides to `home/page.tsx` and `discover/page.tsx` for correct per-route social titles
- Added `scripts/**` to ESLint globalIgnores to prevent CJS require() lint errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Font + og-base.png + global OG image** — `47772e4` (feat)
2. **Task 2: Route OG images + stale metadata cleanup** — `e79c6ce` (feat)
3. **Deviation fix: Lint exclusions** — `24244bc` (fix)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `assets/BebasNeue-Regular.woff` — Bebas Neue 400 woff for Satori (woff2 not supported by Satori)
- `assets/BebasNeue-Regular.woff2` — Bebas Neue 400 woff2 (kept, used by next/font/google in app)
- `scripts/generate-og-base.js` — Node.js script: downloads + blurs TMDB backdrops via sharp
- `public/og-base.png` — Pre-blurred 1200x630 movie poster collage (253KB)
- `app/opengraph-image.tsx` — Global OG: logo-only wordmark on blurred collage
- `app/(app)/home/opengraph-image.tsx` — /home OG: same layout, alt "Moodflix Home - AI Movie Discovery"
- `app/(app)/discover/opengraph-image.tsx` — /discover OG: same layout, alt "Discover Movies on Moodflix"
- `app/layout.tsx` — Removed openGraph.images array + removed twitter metadata block
- `app/(app)/home/page.tsx` — Added openGraph title/description override
- `app/(app)/discover/page.tsx` — Added openGraph title/description override
- `eslint.config.mjs` — Added scripts/** to globalIgnores

## Decisions Made

- **woff over woff2 for Satori:** The plan stated woff2 was supported, but Next.js 16 + Satori throws `Unsupported OpenType signature wOF2` at build time. Used woff format instead — both are in assets/ for clarity.
- **Pre-generated background:** Satori silently drops `filter: blur()` CSS (open GitHub issue #573). Generated the blurred poster collage offline via sharp and loaded it as a base64 data URL inside ImageResponse.
- **TMDB URL fixes:** 2 of 4 original plan backdrop URLs returned HTTP 404. Replaced with verified working TMDB CDN paths.
- **scripts/ ESLint exclusion:** `scripts/generate-og-base.js` uses CommonJS `require()` syntax (Node.js script, not Next.js source). Added to eslint.config.mjs globalIgnores to prevent `@typescript-eslint/no-require-imports` errors.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Satori does not support woff2 format**
- **Found during:** Task 1 (build verification)
- **Issue:** `npm run build` failed with `Error: Unsupported OpenType signature wOF2` when Satori tried to parse BebasNeue-Regular.woff2. The plan stated woff2 was supported, but Next.js 16's Satori version rejects it.
- **Fix:** Copied the woff (not woff2) variant from fontsource: `bebas-neue-latin-400-normal.woff`. Updated all three OG files to reference `assets/BebasNeue-Regular.woff`.
- **Files modified:** `assets/BebasNeue-Regular.woff` (new), `app/opengraph-image.tsx`, `app/(app)/home/opengraph-image.tsx`, `app/(app)/discover/opengraph-image.tsx`
- **Commit:** Included in `47772e4`

**2. [Rule 1 - Bug] Two of four planned TMDB backdrop URLs returned HTTP 404**
- **Found during:** Task 1 (script execution)
- **Issue:** `sharp()` threw `Input buffer contains unsupported image format` because two TMDB URLs (`nMKdUUepR0i5zn0y1T4CejMOfAz.jpg`, `jYEW5xZkZk2WTrdbMackzotvkgR.jpg`) returned HTML 404 pages instead of JPEG images.
- **Fix:** Tested 6 candidate TMDB CDN paths, identified 4 working URLs (Interstellar, Blade Runner 2049, Dune 2021, The Dark Knight). Updated `scripts/generate-og-base.js`.
- **Files modified:** `scripts/generate-og-base.js`
- **Commit:** Included in `47772e4`

**3. [Rule 2 - Missing] scripts/ directory not excluded from ESLint**
- **Found during:** Post-Task 2 lint check
- **Issue:** `npm run lint` reported 3 errors (`@typescript-eslint/no-require-imports`) from `scripts/generate-og-base.js` because it uses CommonJS `require()` syntax. The lint config had no exclusion for `scripts/`.
- **Fix:** Added `"scripts/**"` to `eslint.config.mjs` globalIgnores. Also added `eslint-disable-next-line jsx-a11y/alt-text` comments to all 3 OG files for the decorative background `<img>` in Satori context.
- **Files modified:** `eslint.config.mjs`, all 3 `opengraph-image.tsx` files
- **Commit:** `24244bc`

## User Setup Required

None — the og-base.png is pre-generated and committed. No external service configuration required.

## Phase 2 Completion

All three Phase 2 plans are now complete:
- **02-01:** Brand SVG component system (MoodflixIcon + MoodflixLogo, Bebas Neue via next/font/google)
- **02-02:** Favicon set (ICO, 16/32/96/180/192/512px PNGs, site.webmanifest, maskable icon)
- **02-03:** OG social preview images (3 dynamic routes, blurred poster collage background, logo-only wordmark)

---
*Phase: 02-branding-assets*
*Completed: 2026-02-19*

## Self-Check: PASSED

- assets/BebasNeue-Regular.woff: FOUND
- assets/BebasNeue-Regular.woff2: FOUND
- scripts/generate-og-base.js: FOUND
- public/og-base.png: FOUND
- app/opengraph-image.tsx: FOUND
- app/(app)/home/opengraph-image.tsx: FOUND
- app/(app)/discover/opengraph-image.tsx: FOUND
- 02-03-SUMMARY.md: FOUND
- Commit 47772e4 (Task 1): FOUND
- Commit e79c6ce (Task 2): FOUND
- Commit 24244bc (lint fix): FOUND

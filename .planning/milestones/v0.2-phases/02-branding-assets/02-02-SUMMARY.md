---
phase: 02-branding-assets
plan: 02
subsystem: assets
tags: [favicons, pwa, icons, sharp, manifest, next-metadata]

# Dependency graph
requires:
  - phase: 02-01
    provides: MoodflixIcon SVG geometry as favicon source
provides:
  - favicon-16x16.png, favicon-32x32.png (browser tab)
  - apple-touch-icon.png (180x180, iOS home screen)
  - icon-192.png, icon-512.png (PWA icons)
  - icon-maskable.png (512x512, Android adaptive icon with safe-zone padding)
  - app/manifest.ts with all 4 icon entries
  - app/layout.tsx with icon metadata
affects: 02-03-og-image, PWA installability

# Tech tracking
tech-stack:
  added: [sharp (one-time script, dev only — not committed)]
  patterns:
    - Node.js script (scripts/generate-icons.mjs) for one-time PNG generation via sharp
    - Maskable icon uses 60% safe-zone: M centered within inner 307px of 512px canvas
    - manifest.ts uses MetadataRoute.Manifest type (Next.js built-in)
    - layout.tsx icons metadata: icon array + apple array for full browser/iOS coverage

key-files:
  created:
    - public/favicon-16x16.png
    - public/favicon-32x32.png
    - public/apple-touch-icon.png
    - public/icon-192.png
    - public/icon-512.png
    - public/icon-maskable.png
  modified:
    - app/manifest.ts
    - app/layout.tsx

key-decisions:
  - "Sharp used as one-time generation script only — not committed to package.json as permanent dep"
  - "Maskable icon safe zone: M rendered at 60% of canvas (307px) centered on 512px dark background"
  - "All icons use solid #0a0a0a background except favicon-16x16/32x32 (transparent bg for browser tab)"
  - "favicon-96x96.png also generated for legacy browser coverage"

# Metrics
duration: ~8min
completed: 2026-02-18
---

# Phase 2 Plan 02: Favicon & PWA Icon Set Summary

**All 6 branded PNG icons generated and wired into manifest.ts and layout.tsx metadata.**

## Performance

- **Duration:** ~8 min
- **Completed:** 2026-02-18
- **Tasks:** 2 of 2 complete
- **Files modified:** 8 (6 PNG assets created, 2 code files updated)

## Accomplishments
- Generated 6 favicon/icon PNGs via sharp using the MoodflixIcon M geometry:
  - `favicon-16x16.png` + `favicon-32x32.png` — crimson M on transparent background for browser tab
  - `apple-touch-icon.png` (180×180) — M on dark `#0a0a0a` background for iOS home screen
  - `icon-192.png` + `icon-512.png` — PWA standard icons with dark background
  - `icon-maskable.png` (512×512) — M within 60% safe zone on dark background for Android adaptive icons
- Updated `app/manifest.ts` with all 4 icon entries (192, 512, maskable) + PWA metadata
- Updated `app/layout.tsx` icons metadata with favicon array and apple-touch-icon array

## Task Commits

1. **Task 1+2: Generate PNG icons + wire manifest/layout** — `5978a9d` (chore)

## Files Created/Modified
- `public/favicon-16x16.png` — 16×16 favicon, transparent bg
- `public/favicon-32x32.png` — 32×32 favicon, transparent bg
- `public/apple-touch-icon.png` — 180×180 iOS icon, dark bg
- `public/icon-192.png` — 192×192 PWA icon
- `public/icon-512.png` — 512×512 PWA icon
- `public/icon-maskable.png` — 512×512 maskable PWA icon (safe-zone M)
- `app/manifest.ts` — full PWA manifest with 4 icon entries + theme_color #FB2C36
- `app/layout.tsx` — icons metadata for browser tab and iOS

## Deviations from Plan
- Script not committed (one-time generation, as planned)
- All artifacts verified present and build passes

## Next Phase Readiness
- All favicon/PWA icons in place
- Ready for Plan 02-03: OG image generation via next/og ImageResponse

---
*Phase: 02-branding-assets*
*Completed: 2026-02-18*

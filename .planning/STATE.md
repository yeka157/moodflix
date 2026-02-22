# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** Users can discover movies that match their mood and manage what they've watched — the library experience must feel instant and intuitive.
**Current focus:** v0.3 Content Expansion — Phase 4 (TV Series Data Layer) ready to plan.

## Current Position

Phase: 4 (TV Series Data Layer)
Plan: 02 complete (2/? plans)
Status: Executing — Plan 02 complete, ready for Plan 03
Last activity: 2026-02-22 — Phase 4 Plan 02 executed (TV API proxy routes + TanStack Query hooks)

Progress: [░░░░░░░░░░] 0% (v0.3)

## Performance Metrics

**Velocity:**
- Total plans completed: 10 (v0.1 original: 7, v0.2: 10, excluding planning plans)
- Average duration: ~30 min/plan
- Total execution time: ~5.0 hours across v0.1 + v0.2

**By Phase (v0.2):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 3 | ~1.0h | ~20m |
| 2 | 3 | ~2.0h | ~40m |
| 3 | 4/4 | ~25m | ~6m |

**Recent Trend:**
- Last plans: 03-01, 03-02, 03-03, 03-04
- Trend: Steady

*Updated after each plan completion*
| Phase 04-tv-series-data-layer P02 | 2min | 2 tasks | 3 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Phase 4 Plan 01: normalizeTVShow maps first_air_date to release_date preserving empty string — satisfies Movie no-undefined contract
- Phase 4 Plan 01: video hardcoded to false in normalizeTVShow — TV shows have no video trailer flag in TMDB
- Phase 4 Plan 01: discoverChineseDramas omits with_original_language — content spans Mandarin (zh) and Cantonese (yue)
- Phase 1: Two action buttons instead of status dropdown — bookmark for "want to watch", check for "watched"
- Phase 1: Full removal of `watching` enum value from schema (migration done)
- Phase 1: Route rename `/watchlist` → `/library` with backwards-compat redirect
- Phase 1: `WatchlistTmdbEntry` includes `id`, `tmdbId`, `status` — enables direct mutations from movie cards
- Phase 1: Icon animation for success feedback, undo toast for remove, error toast + rollback for errors
- Phase 1: `useReducedMotion` from Framer Motion for a11y animation control
- Phase 2 Plan 01: SVG perforations as rect overlays using background color (#0a0a0a) — not true SVG clip-path cutouts
- Phase 2 Plan 01: Bebas Neue weight must be 400 only (single-weight font)
- Phase 2 Plan 01: Hex #FB2C36 in all SVG fills — oklch() not valid in SVG fill attributes
- Phase 2 Plan 01: Responsive navbar uses hidden/flex Tailwind classes at md breakpoint for logo swap
- Phase 2 Plan 03: woff format required for Satori (woff2 causes "Unsupported OpenType signature wOF2" in Next.js 16)
- Phase 2 Plan 03: Pre-blurred og-base.png generated offline via sharp (Satori silently drops CSS filter:blur)
- Phase 2 Plan 03: All OG images show logo only — no subtitle (locked user decision)
- Phase 2 Plan 03: scripts/ excluded from ESLint globalIgnores (Node.js CJS scripts shouldn't be linted as Next.js)
- Phase 3 Plan 01: Drop unused destructuring alias (error: _error) — keep full type annotation for Next.js error boundary contract
- Phase 3 Plan 01: Remove showTagline entirely from MoodflixLogoProps — it was always false, hero-section.tsx call site updated
- Phase 3 Plan 02: template.tsx entry-only animation (no exit) — exit animations broken in App Router with AnimatePresence
- Phase 3 Plan 02: layoutId={shouldReduceMotion ? undefined : 'nav-active-pill'} — omitting layoutId skips layout animation path entirely
- Phase 3 Plan 02: ease "as const" required in Framer Motion Variants for TypeScript strict mode compatibility
- Phase 3 Plan 03: [@media(hover:none)] Tailwind variant applied to action buttons — 44px on touch, 32px on desktop hover
- Phase 3 Plan 03: Grid audit confirmed correct — grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 needs no changes
- Phase 3 Plan 04: No code changes — quality gate and visual verification only; all 5 Phase 3 success criteria confirmed by human sign-off
- v0.3 Roadmap: No schema migration in v0.3 — media_type column deferred to v0.4; TV shows are read-only discovery only
- v0.3 Roadmap: TV normalization at hook boundary — normalizeTVShow() called inside queryFn, not at API route
- v0.3 Roadmap: Separate /api/tv/ route triplet — not a ?type=tv param extension of /api/movies/
- v0.3 Roadmap: TV modal uses mediaType prop on existing movie-detail-modal.tsx — no forked component
- v0.3 Roadmap: Daily rotation seed is deterministic from userId + new Date().toDateString() — no Math.random()
- [Phase 04]: Phase 4 Plan 02: Normalization at hook boundary (not API route) — queryFn calls normalizeTVShow() so API routes return raw TMDB shapes
- [Phase 04]: Phase 4 Plan 02: Details hook returns TVDetailsResponse (not normalized) — preserves TV-specific fields needed by modal

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-22 (Phase 4 Plan 02 executed)
Stopped at: Completed 04-02-PLAN.md
Resume at: `/gsd:execute-phase 4` for Plan 03 (TV Series UI — /series page)

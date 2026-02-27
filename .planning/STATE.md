# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** Users can discover movies that match their mood and manage what they've watched — the library experience must feel instant and intuitive.
**Current focus:** v0.3 Content Expansion — Phase 07.1 (Bug Fixes & Improvements) complete, Phase 8 next.

## Current Position

Phase: 08-landing-page-revamp — CHECKPOINT
Plan: 4 of 4 executed (01: Cinematic Hero — COMPLETE, 02: Features + Showcase — COMPLETE, 03: AI Preview + CTA + Footer — COMPLETE, 04: Integration Pass — TASK 1 COMPLETE, TASK 2 AWAITING HUMAN VERIFY)
Status: Plan 04 Task 1 complete — section order verified, SEO metadata updated, lint + build pass. Awaiting human visual verification checkpoint.
Last activity: 2026-02-27 — Phase 08 Plan 04 Task 1 executed

Progress: [##################################################] 95% (Phase 08 Plan 04 Task 1 of 2 complete, checkpoint pending)

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
| Phase 05-tv-series-page-modal P01 | 3min | 2 tasks | 8 files |
| Phase 05-tv-series-page-modal P02 | 2 | 1 tasks | 1 files |
| Phase 07-ui-ux-revamp P01 | 2min | 2 tasks | 4 files |
| Phase 07-ui-ux-revamp P03 | 15min | 2 tasks | 8 files |
| Phase 07-ui-ux-revamp P04 | 12min | 2 tasks | 12 files |
| Phase 08 P02 | 6 | 2 tasks | 3 files |
| Phase 08 P03 | 23min | 2 tasks | 3 files |
| Phase 08 P04 | 8min | 1 tasks (of 2) | 1 files |

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
- [Phase 05]: Phase 5 Plan 01: readOnly prop gates action icon div in MovieCard and Library Actions in MovieDetailModal — hook calls kept (React rules), only rendering suppressed
- [Phase 05]: Phase 5 Plan 01: mediaType prop added to MovieDetailModal with eslint-disable — TV branching deferred to Plan 02
- [Phase 05]: Phase 5 Plan 01: SeriesHeroBanner uses TV_GENRES first then falls back to GENRES for shared IDs
- [Phase 05]: Phase 5 Plan 01: featuredShow selected deterministically via trending.find(t => t.backdrop_path) — no Math.random()
- [Phase 05]: Both useMovieDetails and useTVDetails always called — null ID disables the irrelevant hook (React rules)
- [Phase 05]: getStatusBadgeVariant maps Returning Series=default, Ended=secondary, Canceled=destructive — TMDB spells it Canceled (single L)
- [Phase 07 Plan 01]: AppSidebar uses onHoverStart/onHoverEnd only — no click/pin toggle
- [Phase 07 Plan 01]: Sidebar fixed at 60px collapsed, 200px expanded — desktop only (hidden md:flex)
- [Phase 07 Plan 01]: BottomTabBar fixed at bottom — mobile only (flex md:hidden), h-16 satisfies 44px touch target
- [Phase 07 Plan 01]: app-navbar.tsx NOT deleted yet — preserved until Plan 04 confirms all references gone
- [Phase 07 Plan 01]: Content offset: md:pl-[60px] pb-16 md:pb-0 for sidebar + tab bar clearance
- [Phase 07 Plan 01]: Sidebar background: oklch(0.11 0.008 25) — darker than page bg oklch(0.13 0.008 25)
- [Phase 07 Plan 03]: MovieGrid readOnly prop added — was missing, caused TypeScript build error in SeriesGridContent
- [Phase 07 Plan 03]: Decade year values (2020s, 2010s) expand to year_start/year_end range params at hook layer
- [Phase 07 Plan 03]: keepPreviousData on discover queries — smooth filter transitions with loading overlay instead of full re-render
- [Phase 07 Plan 03]: Series page fully client-driven (no SSR prefetch) — filter-first UX makes pre-fetching unfiltered results unnecessary
- [Phase 07-04]: MovieCard href prop: dual-mode Link/onClick — wraps in Link when href provided, uses onClick callback when not
- [Phase 07-04]: MovieSearchDrawer: search results use onClick→Sheet drawer; grid/filter results use link navigation
- [Phase 07-04]: app-navbar.tsx deleted — layout.tsx already used AppSidebar since Plan 01
- [Phase 08-01]: useScroll targets heroRef element (not window) — scoped scroll progress for parallax precision
- [Phase 08-01]: Backdrop parallax: y 0%→25%, contentOpacity fades at [0, 0.6] — content exits before backdrop scrolls fully past
- [Phase 08-01]: Landing navbar: always-on blur (removed scroll-triggered state), Framer Motion entrance animation
- [Phase 08-01]: page.tsx uses Promise.all for getHeroBackdrop + getShowcasePosters — WIP movie-showcase requires posters prop, parallelized
- [Phase 08]: 08-02: 4-feature stagger grid uses containerVariants staggerChildren, not per-card delay — cleaner Framer Motion orchestration
- [Phase 08]: 08-02: getShowcasePosters uses w342 TMDB image size — fast loading for marquee cards without quality compromise
- [Phase 08]: 08-02: ShowcasePoster interface exported from lib/tmdb.ts (not types/) — co-located with fetch function
- [Phase 08-03]: AI preview uses static mock chat (not interactive) — demonstrates mood-to-genre flow without requiring auth on landing page
- [Phase 08-03]: Genre pills use inline OKLCH gradient styles — Tailwind v4 can't generate dynamic opacity variants in arbitrary OKLCH values at build time
- [Phase 08-03]: CTA uses styled Link anchor not Button component — full control over crimson gradient + box-shadow without shadcn overrides
- [Phase 08-03]: Footer TMDB attribution as external link — required by TMDB API terms of service
- [Phase 08-04]: Metadata title uses em-dash format "Moodflix — Discover Movies That Match Your Mood" — storytelling alignment with landing page copy
- [Phase 08-04]: Description references all 3 core value props: AI mood recommendations, TMDB browse, watchlist — SEO completeness

### Pending Todos

None.

### Roadmap Evolution

- Phase 7 added: UI/UX Revamp — sidebar navigation, color scheme overhaul, Stremio-inspired layout (Pencil MCP design)
- Phase 8 added: Landing page revamp
- Phase 07.1 inserted after Phase 7: Bug Fixes & Improvements (URGENT) — BACKLOG-20, 27, 28, 29, 30, 33

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-27 (Phase 08 Plan 04 Task 1 executed)
Stopped at: 08-04-PLAN.md Task 2 — checkpoint:human-verify (visual verification of full landing page)
Resume file: .planning/phases/08-landing-page-revamp/08-04-PLAN.md (Task 2 continuation after human approval)

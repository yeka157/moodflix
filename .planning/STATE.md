---
gsd_state_version: 1.0
milestone: v0.4
milestone_name: Watchlist & Polish
status: in-progress
stopped_at: Completed 12.1-02-PLAN.md
last_updated: "2026-03-07T07:11:21Z"
last_activity: 2026-03-07 — Plan 02 complete (conversationId-based AI conversation upsert logging)
progress:
  total_phases: 11
  completed_phases: 7
  total_plans: 17
  completed_plans: 17
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-28)

**Core value:** Users can discover movies and TV shows that match their mood and manage what they've watched — the library and discovery experience must feel instant and intuitive.
**Current focus:** v0.4 Phase 12.1 — Quality of Life Improvement

## Current Position

Phase: 12.1 of 13 (Quality of Life Improvement)
Plan: 02 of 2 complete
Status: Phase 12.1 Complete
Last activity: 2026-03-07 — Plan 02 complete (conversationId-based AI conversation upsert logging)

Progress: [██████████] 100%

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
All v0.3 decisions archived — see `.planning/milestones/v0.3-ROADMAP.md` for full history.

Key decisions for v0.4 (from research):
- **media_type backfill**: Use `DEFAULT 'movie'` on column add — no manual data surgery needed for existing rows
- **Constraint name**: New constraint is `watchlist_user_tmdb_media_unique` — update catch block string in same commit as schema
- **Conversation logging**: Fire-and-forget only — never await the DB insert in the AI route
- **Top 100 reorder**: Move up/down buttons (not drag-and-drop) — avoids DnD library conflicts with Framer Motion
- **Route rename**: Label-only change ("Discover" → "Movies" in sidebar) — `/discover` route stays unchanged
- **AiConversation.messages type**: Typed as `unknown` (not AI SDK v5 type) — avoids coupling DB schema to third-party SDK version
- [Phase 09.1]: Use @serwist/turbopack (route handler mode) to avoid Sentry webpack plugin conflict
- [Phase 09.1]: Exclude app/sw.ts from tsconfig.json to prevent webworker type conflicts with DOM types
- [Phase 09.1]: theme_color: #09090b (dark) — crimson accent looks off as browser chrome/toolbar color
- [Phase 09.1-02]: hasMounted ref guard in OfflineToast prevents "Back online" toast on initial page load
- [Phase 09.1-02]: Install banner positioned bottom-16 md:bottom-0 to sit above mobile tab bar
- [Phase 09.1-02]: Session-only dismiss (no localStorage) for install prompt — sufficient for MVP
- [Phase 09.1-03]: Icon background #09090b matches manifest theme_color — consistent dark theming across OS chrome
- [Phase 09.1-03]: M lettermark at 70% canvas for standard icons, 60% for maskable (Android safe zone spec)
- [Phase 09.1-03]: sharp accessed via @img/sharp-darwin-arm64 (Next.js dep) — no extra package needed for icon generation
- [Phase 09.1.1-01]: TV trending fetch in existing Promise.all with .catch() guard — parallel execution, resilient to TMDB TV API failures
- [Phase 09.1.1-01]: trendingTV prop optional with default [] on HomeMovies — graceful degradation; TV row hidden when array is empty
- [Phase 09.1.1-01]: mediaType="tv" (not hrefPrefix) on TV MovieRow — normalizeTVShow doesn't set media_type, so mediaType prop is routing fallback
- [Phase 10-01]: watchlistKeys.check 4-segment key — independent cache entries per media type (tmdbId + mediaType)
- [Phase 10-01]: useRemoveFromWatchlist filters tmdbIds cache by both tmdbId AND mediaType to avoid removing sibling-type entries
- [Phase 10-01]: entryMediaType stored in onMutate context for rollback fidelity
- [Phase 10-03]: Client-side filtering (no status arg to useWatchlist) ensures cards stay stable during status changes — WLUX-02
- [Phase 10-03]: Both TV and Movie cards use unified dark badge style (bg-black/70) — no color distinction for library context
- [Phase 10-03]: Undo toast re-add includes mediaType from item to correctly restore TV entries
- [Phase 10-03]: motion key combines activeTab + mediaFilter for correct stagger animation reset on filter change
- [Phase 10.1-02]: Spring hover standard: stiffness 200/25 for card hover scales, 300/20-22 for icon pops — one clean settle with no oscillation
- [Phase 10.1-02]: whileTap on small icon buttons (h-8/w-8) softened to 0.92; larger CTA buttons keep 0.85
- [Phase 10.1-02]: Detail page padding convention: px-4 sm:px-6 lg:px-8 — md:px-6 was missing the 640-767px breakpoint range
- [Phase 10.1-01]: Hide MockupFrame on mobile (hidden lg:flex/block) rather than scale — decorative only, flex-col stacking pushes CTAs off-screen on h-screen
- [Phase 10.1-01]: Hero responsive scale: text-3xl sm:text-4xl lg:text-6xl xl:text-7xl — applies to both StaticHero and ScrollPinnedHero code paths
- [Phase 10.1-01]: MarqueeFallback row split: firstHalf/secondHalf via Math.ceil; reversed fallback when < 4 posters ensures second row has visually distinct content
- [Phase 11-discovery-ux]: Nav label-only change: /discover route path, Compass icon, and aria-label attributes unchanged
- [Phase 11-discovery-ux]: Rating badge hidden when vote_count <= 10; text-only X.X/10 numeric format with no star symbol
- [Phase 11-discovery-ux]: SeriesPageContent client wrapper lifts search state so SeriesPage stays a pure Server Component
- [Phase 11-discovery-ux]: TV search uses hrefPrefix=/tv/ for direct navigation (not drawer/modal) consistent with existing TV card behavior
- [Phase 12-01]: createUIMessageStream + createUIMessageStreamResponse for off-topic redirects -- zero Gemini cost for obvious non-entertainment queries
- [Phase 12-01]: Narrow regex pre-check patterns -- only clearly non-entertainment queries (homework, medical, legal, coding, recipes) caught; entertainment-adjacent terms never blocked
- [Phase 12-02]: COUNTRY_LABELS in lib/constants.ts -- shared map of ISO alpha-2 codes to English adjectives for genre display
- [Phase 12-02]: originCountry included in TanStack Query keys for cache separation across different country filters
- [Phase 12]: [Phase 12-02]: COUNTRY_LABELS in lib/constants.ts -- shared map of ISO alpha-2 codes to English adjectives for genre display
- [Phase 12.1-01]: ArrowUp icon for AI send button — matches ChatGPT/Claude industry convention
- [Phase 12.1-01]: size-11 (44px) touch target for mobile back button — meets WCAG minimum
- [Phase 12.1-01]: Bottom tab bar no-highlight on detail pages confirmed as correct UX (Netflix/Disney+ pattern)
- [Phase 12.1-02]: useState lazy initializer for conversationId -- avoids React 19 refs-during-render lint error
- [Phase 12.1-02]: Partial unique index (WHERE conversation_id IS NOT NULL) -- allows nullable column while enforcing uniqueness for upsert target
- [Phase 12.1-02]: updatedAt column added to aiConversations -- tracks when multi-turn conversations were last updated

### Pending Todos

None.

### Roadmap Evolution

- Phase 09.1 inserted after Phase 9: PWA Setup (URGENT)
- Phase 09.1.1 inserted after Phase 09.1: Homepage TV Series Integration (URGENT)
- Phase 10.1 inserted after Phase 10: Fix UI for mobile view (URGENT)
- Phase 12.1 inserted after Phase 12: Quality of Life Improvement (URGENT)
- Phase 12.2 inserted after Phase 12.1: Content Discovery & AI Shazam (URGENT)
- Phase 12.3 inserted after Phase 12.2: Push Notifications (URGENT)

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-07T07:11:21Z
Stopped at: Completed 12.1-02-PLAN.md
Resume file: .planning/phases/12.1-quality-of-life-improvement/12.1-02-SUMMARY.md
Next step: Phase 12.2 or Phase 13

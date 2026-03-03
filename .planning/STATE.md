# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-28)

**Core value:** Users can discover movies and TV shows that match their mood and manage what they've watched — the library and discovery experience must feel instant and intuitive.
**Current focus:** v0.4 Phase 10 — TV Watchlisting + Watchlist UX

## Current Position

Phase: 10 of 13 (TV Watchlisting + Watchlist UX)
Plan: 3 of 3 in current phase
Status: Phase 10 Plan 03 Complete — 3 of 3 plans done
Last activity: 2026-03-03 — Plan 03 complete (WatchlistCard type badge + /tv/[id] routing + media type filter row + client-side filtering)

Progress: [████░░░░░░] 30% (v0.4 Phase 10 complete, 3/3 plans done)

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

### Pending Todos

None.

### Roadmap Evolution

- Phase 09.1 inserted after Phase 9: PWA Setup (URGENT)
- Phase 09.1.1 inserted after Phase 09.1: Homepage TV Series Integration (URGENT)
- Phase 10.1 inserted after Phase 10: Fix UI for mobile view (URGENT)

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-03
Stopped at: Phase 10 TV Watchlisting + Watchlist UX — Plan 03 complete (all 3 plans done)
Resume file: None
Next step: Phase 11 or new milestone planning

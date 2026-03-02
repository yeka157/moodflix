# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-28)

**Core value:** Users can discover movies and TV shows that match their mood and manage what they've watched — the library and discovery experience must feel instant and intuitive.
**Current focus:** v0.4 Phase 09.1 — PWA Setup

## Current Position

Phase: 09.1 of 13 (PWA Setup)
Plan: 2 of 3 in current phase
Status: In Progress — Plan 02 complete
Last activity: 2026-03-02 — Plan 02 complete (PWA offline UX: useOnlineStatus, usePwaInstall, OfflineToast, InstallPrompt)

Progress: [████░░░░░░] 18% (v0.4 Phase 09.1 in progress, Plan 02/03 done)

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

### Pending Todos

None.

### Roadmap Evolution

- Phase 09.1 inserted after Phase 9: PWA Setup (URGENT)

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-02
Stopped at: Completed Plan 09.1-02 (PWA offline UX — useOnlineStatus, usePwaInstall, OfflineToast, InstallPrompt wired into app layout)
Resume file: None
Next step: Execute Phase 09.1 Plan 03 (PWA icons)

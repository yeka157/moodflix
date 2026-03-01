---
phase: 09-schema-migration
plan: 01
subsystem: database
tags: [drizzle, postgresql, pgEnum, supabase, rls, migrations, schema]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Drizzle schema, migrations setup, RLS policies pattern
provides:
  - mediaTypeEnum pgEnum shared across watchlist and top_hundred tables
  - media_type column on watchlist (DEFAULT 'movie', backfills existing rows)
  - watchlist_user_tmdb_media_unique constraint (3-column: userId, tmdbId, mediaType)
  - ai_conversations table (JSONB messages, fire-and-forget analytics logging)
  - top_hundred table (dense integer rank, dual unique constraints)
  - Migration 0002_daffy_jack_murdock.sql applied to Supabase
  - RLS policies for ai_conversations (INSERT) and top_hundred (full CRUD)
  - types/media.ts shared MediaType union type
  - types/top-hundred.ts TopHundredItem and related types
affects: [10-tv-watchlist, 11-top-hundred, 12-ai-polish, 13-ui-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shared pgEnum pattern: export const mediaTypeEnum = pgEnum() for drizzle-kit bug #5174"
    - "Dense integer ranking for top_hundred (swap-based reorder UX)"
    - "Fire-and-forget DB insert pattern for analytics logging"
    - "Shared types/media.ts MediaType union imported across watchlist, ai, top-hundred types"

key-files:
  created:
    - drizzle/migrations/0002_daffy_jack_murdock.sql
    - drizzle/migrations/meta/0002_snapshot.json
    - types/media.ts
    - types/top-hundred.ts
  modified:
    - drizzle/schema.ts
    - drizzle/rls-policies.sql
    - types/watchlist.ts
    - types/ai.ts
    - actions/watchlist.ts
    - hooks/use-watchlist.ts

key-decisions:
  - "mediaTypeEnum is exported (not just declared) to avoid drizzle-kit bug #5174 missing CREATE TYPE"
  - "media_type column uses DEFAULT 'movie' so PostgreSQL backfills existing rows atomically — no separate UPDATE needed"
  - "New unique constraint watchlist_user_tmdb_media_unique replaces watchlist_user_tmdb_unique"
  - "top_hundred uses dense integer rank (1-100) for move-up/down swap UX; no drag-and-drop"
  - "ai_conversations stores full AI SDK v5 message array as JSONB for analytics; not user-facing"
  - "types/media.ts centralizes MediaType = 'movie' | 'tv' to avoid divergence across 3 type files"

patterns-established:
  - "Shared pgEnum: declare once in schema.ts, import via mediaTypeEnum in both table definitions"
  - "Generated SQL reviewed before db:migrate — verified CREATE TYPE precedes ADD COLUMN"

requirements-completed: [TVWL-07, TVWL-08, AIPOL-05, AIPOL-06]

# Metrics
duration: 5min
completed: 2026-02-28
---

# Phase 9 Plan 01: Schema Migration Summary

**PostgreSQL schema extended with mediaTypeEnum, media_type on watchlist (backfilled), ai_conversations table, and top_hundred table — migration applied and RLS policies defined**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-28T14:56:52Z
- **Completed:** 2026-02-28T15:01:59Z
- **Tasks:** 3 of 3 complete
- **Files modified:** 8

## Accomplishments

- Updated drizzle/schema.ts with mediaTypeEnum, media_type column on watchlist, aiConversations table, topHundred table
- Generated and applied migration 0002_daffy_jack_murdock.sql — all existing watchlist rows backfilled with media_type='movie'
- Updated RLS policies file with INSERT policy for ai_conversations and full CRUD policies for top_hundred
- Created shared types/media.ts and types/top-hundred.ts, updated types/watchlist.ts and types/ai.ts
- Fixed actions/watchlist.ts constraint name string and added mediaType to serializer
- Build and lint both pass cleanly after all changes

## Task Commits

Each task was committed atomically:

1. **Task 1: Update Drizzle schema and generate migration** - `edb393e` (feat)
2. **Task 2: Update RLS policies for new tables** - `3784e8f` (feat)
3. **Task 3: Verify database migration and RLS in Supabase** - approved (human-verify checkpoint)

## Files Created/Modified

- `drizzle/schema.ts` - Added mediaTypeEnum, media_type to watchlist, aiConversations and topHundred tables
- `drizzle/migrations/0002_daffy_jack_murdock.sql` - Generated migration applied to Supabase
- `drizzle/migrations/meta/0002_snapshot.json` - Drizzle Kit migration snapshot
- `drizzle/rls-policies.sql` - Added RLS for ai_conversations (INSERT) and top_hundred (full CRUD)
- `types/media.ts` - NEW: shared MediaType = "movie" | "tv" union type
- `types/watchlist.ts` - Added mediaType to WatchlistItem, WatchlistTmdbEntry, AddToWatchlistInput
- `types/ai.ts` - Updated to import MediaType from shared types/media.ts
- `types/top-hundred.ts` - NEW: TopHundredItem, AddToTopHundredInput, action result types
- `actions/watchlist.ts` - Added mediaType to serializer; fixed constraint name to watchlist_user_tmdb_media_unique
- `hooks/use-watchlist.ts` - Fixed optimistic update objects to include mediaType field

## Decisions Made

- Used `DEFAULT 'movie'` on the ADD COLUMN statement so PostgreSQL atomically backfills all existing watchlist rows — no separate UPDATE statement needed
- Exported `mediaTypeEnum` (not just declared) to work around confirmed drizzle-kit bug #5174
- Created `types/media.ts` to centralize MediaType union — avoids independent drift in watchlist, ai, and top-hundred type files
- Reviewed generated SQL before migration: ordering was correct (CREATE TYPE first, ADD COLUMN after, DROP/ADD CONSTRAINT last)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript errors in hooks/use-watchlist.ts optimistic updates**
- **Found during:** Task 1 (schema update + build verification)
- **Issue:** WatchlistTmdbEntry and WatchlistItem types now require mediaType field; optimistic update objects in useAddToWatchlist were missing it, causing TypeScript compile errors
- **Fix:** Added `mediaType: (newItem.mediaType ?? "movie") as MediaType` to both optimistic cache objects; added MediaType import
- **Files modified:** hooks/use-watchlist.ts
- **Verification:** `npm run build` and `npm run lint` both pass
- **Committed in:** edb393e (Task 1 commit)

**2. [Rule 2 - Missing Critical] Created types/media.ts shared type file**
- **Found during:** Task 1 (types update)
- **Issue:** MediaType appears in types/watchlist.ts, types/top-hundred.ts, and types/ai.ts — inline duplication would cause divergence risk
- **Fix:** Extracted to types/media.ts, updated all three files to import from it
- **Files modified:** types/media.ts (created), types/watchlist.ts, types/ai.ts, types/top-hundred.ts
- **Verification:** Build passes cleanly
- **Committed in:** edb393e (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug fix, 1 missing critical)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep.

## User Setup Required

None — database migration was applied and RLS policies were verified by the user in Task 3.

## Next Phase Readiness

- Schema foundation complete for all v0.4 phases (10-13)
- Phase 10 (TV Watchlist) can now use media_type on watchlist
- Phase 13 (My Top 100) can now use top_hundred table
- Phase 12 (AI Polish) can now use ai_conversations table
- No blockers — all tables, constraints, and RLS policies are in place

## Self-Check: PASSED

- drizzle/schema.ts: FOUND
- drizzle/rls-policies.sql: FOUND
- drizzle/migrations/0002_daffy_jack_murdock.sql: FOUND
- Commit edb393e (Task 1): FOUND
- Commit 3784e8f (Task 2): FOUND
- Task 3: Human-approved (user typed "approved")

---
*Phase: 09-schema-migration*
*Completed: 2026-02-28*

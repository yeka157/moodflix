# Phase 9: Schema Migration - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Database schema changes to support TV watchlisting, AI conversation logging, and My Top 100 lists. All subsequent v0.4 phases depend on these tables/columns being correctly designed. This phase delivers migration files, updated Drizzle schema, updated TypeScript types, and RLS policies — no UI work.

</domain>

<decisions>
## Implementation Decisions

### Top 100 ranking design
- Hard limit of 100 entries enforced at app level (no DB constraint on count)
- Minimal data per entry: rank + tmdbId + mediaType + userId + timestamps (fetch details from TMDB at display time)
- Independent from watchlist — user can rank any movie/show whether or not it's in their watchlist
- Auto-add trigger: when user marks something as "watched" AND likes it, auto-add to top 100
- When list is full (100 entries) and auto-add triggers, skip silently — no notification, no replacement
- User can also manually add items independently of the auto-add trigger

### Media type enum values
- pgEnum with two values: `movie` and `tv` only
- Shared enum used across both `watchlist` and `top_hundred` tables
- No future-proofing for additional types — add via migration if needed later

### AI messages column shape
- **Separate `ai_conversations` table** instead of a column on `ai_recommendations` (deviates from original roadmap criteria — update roadmap)
- Store the full AI SDK v5 message array (role, content, tool calls) as JSONB
- Backend-only logging — conversations are NOT exposed to users in UI
- Purpose: improving prompts, debugging, analytics

### Migration safety approach
- Single Drizzle Kit migration file covering all changes
- Apply directly to production Supabase via `npm run db:migrate` (no local Postgres testing)
- No concern about existing data — small dataset, early stage
- Watchlist backfill: drop old unique constraint (userId, tmdbId), backfill media_type='movie' on all rows, add new constraint (userId, tmdbId, mediaType)

### Claude's Discretion
- Rank storage strategy (dense integers vs fractional/gap ranks) — pick based on reordering UX
- Backfill default approach for media_type column (migration-time DEFAULT vs separate UPDATE)
- RLS policy management approach (Supabase Dashboard SQL vs Drizzle-managed)
- ai_conversations table structure details (columns, FKs, indexes)

</decisions>

<specifics>
## Specific Ideas

- Auto-add to Top 100 should feel invisible — "watched + liked" is the trigger, not a separate action
- The `watching` status in watchlist_status enum is unused in the frontend — no UI entry point exists for it

</specifics>

<deferred>
## Deferred Ideas

- Remove unused `watching` value from watchlist_status enum — cleanup task for a future phase
- User-viewable conversation history (browsing/replaying past AI chats) — potential future feature
- Adding `person` media type for ranking favorite actors/directors — future scope if needed
- Roadmap success criteria #3 needs updating to reflect separate ai_conversations table

</deferred>

---

*Phase: 09-schema-migration*
*Context gathered: 2026-02-28*

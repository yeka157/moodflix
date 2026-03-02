# Pitfalls Research

**Domain:** Adding TV watchlisting, AI guardrails/logging, origin country filtering, and My Top 100 to existing Next.js 16 + Supabase + Drizzle ORM app (Moodflix v0.4)
**Researched:** 2026-02-28
**Confidence:** HIGH (direct codebase analysis — schema, actions, hooks, and AI route all read verbatim)

---

## Critical Pitfalls

### Pitfall 1: Unique Constraint Name Hardcoded in Error Handler Will Miss After Migration

**What goes wrong:**
`actions/watchlist.ts` line 114 catches the unique constraint violation by matching the string `"watchlist_user_tmdb_unique"`:

```typescript
if (err instanceof Error && err.message.includes("watchlist_user_tmdb_unique")) {
  return { error: "Movie already in library" };
}
```

When the migration adds `media_type` to the unique constraint, the constraint must be renamed (e.g., `watchlist_user_tmdb_media_unique`). If the string in the catch block is not updated at the same time, the old constraint name no longer exists in the error message — so ALL unique violations from the new constraint fall through to the generic `"Failed to add to library"` error. The user sees the wrong error message and gets no actionable feedback.

Additionally, the error message says `"Movie already in library"` — which will be wrong for TV shows. A user who tries to re-add a TV series they already saved will be told "Movie already in library."

**Why it happens:**
String-matching on constraint names is a fragile pattern. The old constraint was named `watchlist_user_tmdb_unique` and this string appears in two places: the schema definition and the catch block. Renaming it in the schema generates a migration that drops and recreates the constraint under a new name, but the catch block is pure application code — Drizzle does not update it.

**Consequences:**
- Double-add attempts on TV shows return `"Failed to add to library"` (generic error, no user guidance)
- Potential silent failure if `onSettled` invalidation masks it
- Wrong noun in error message ("Movie" for a TV show)

**Prevention:**
Update the catch block at the same time as the schema migration. Rename the constraint explicitly in the `unique()` call:

```typescript
// drizzle/schema.ts
unique("watchlist_user_tmdb_media_unique").on(
  table.userId,
  table.tmdbId,
  table.mediaType,
)
```

```typescript
// actions/watchlist.ts — update catch block
if (
  err instanceof Error &&
  err.message.includes("watchlist_user_tmdb_media_unique")
) {
  return { error: "Already in library" };  // media-type-neutral
}
```

Treat the schema migration and the catch block fix as a single atomic commit. Use a shared constant for the constraint name to prevent future drift:

```typescript
// drizzle/schema.ts
export const WATCHLIST_UNIQUE_CONSTRAINT = "watchlist_user_tmdb_media_unique";
```

**Detection:**
- Add a TV show, leave page, return and try to add again — if you see "Failed to add to library" instead of "Already in library," the constraint name is not updated
- Check the generated migration SQL — if it drops `watchlist_user_tmdb_unique` and creates `watchlist_user_tmdb_media_unique`, the old string in the catch block is now dead

**Phase to address:** Phase 1 (schema migration) — must be fixed in the same commit as the schema change.

---

### Pitfall 2: TanStack Query Optimistic Updates Match on `tmdbId` Alone — Will Break After `mediaType` Added

**What goes wrong:**
`hooks/use-watchlist.ts` optimistic update in `useRemoveFromWatchlist` filters the `tmdbIds` cache entry to remove by `tmdbId` only:

```typescript
// use-watchlist.ts line 139
queryClient.setQueryData<WatchlistTmdbEntry[]>(
  watchlistKeys.tmdbIds(),
  (old) => old?.filter((entry) => entry.tmdbId !== params.tmdbId) ?? [],
);
```

After adding `mediaType` to `WatchlistTmdbEntry`, a user with both movie ID 1234 and TV show ID 1234 in their library would have two entries with the same `tmdbId` but different `mediaType`. A remove action on the movie would incorrectly remove both entries from the optimistic cache — leaving the TV show card briefly showing "not in library" until invalidation refetches.

The same single-field match appears in `useUpdateWatchlistStatus` (line 217: `find((e) => e.id === params.id)?.tmdbId`) — this one matches by `id` so it is safe. But `useAddToWatchlist` builds the optimistic entry without `mediaType`:

```typescript
// use-watchlist.ts line 75-80
{
  id: "", // Will be replaced on server response
  tmdbId: newItem.tmdbId,
  status: newItem.status ?? "want_to_watch",
  // mediaType missing — TypeScript will error once the type is updated
}
```

**Why it happens:**
`WatchlistTmdbEntry` currently has no `mediaType` field. After the schema migration, this type gains `mediaType`. TypeScript will catch the missing field in the optimistic update object, but only if `mediaType` is non-optional in the type. If it is added as optional (`mediaType?: "movie" | "tv"`), TypeScript will not error and the incomplete entry silently enters the cache.

**Consequences:**
- Wrong bookmark state on cards until cache invalidation fires (~30s staleTime or next window focus)
- TMDB ID collision edge case: removing a movie removes the TV show's optimistic bookmark state too
- The `useWatchlistCheck` hook queries by `tmdbId` alone — after `mediaType` is added, `getWatchlistItemByTmdbId` in the server action also needs `mediaType` as a parameter, or it may return the wrong entry (movie vs TV)

**Prevention:**
1. Make `mediaType` **required** (not optional) on `WatchlistTmdbEntry` so TypeScript forces updates everywhere
2. Update the optimistic entry in `useAddToWatchlist` to include `mediaType: newItem.mediaType`
3. Update the filter in `useRemoveFromWatchlist` to match on `(tmdbId, mediaType)` pair, not `tmdbId` alone
4. Update `watchlistKeys.check(tmdbId)` to `watchlistKeys.check(tmdbId, mediaType)` so the check cache is scoped per media type

```typescript
// types/watchlist.ts — after migration
export type WatchlistTmdbEntry = {
  id: string;
  tmdbId: number;
  mediaType: "movie" | "tv";   // required, not optional
  status: WatchlistStatus;
};

// hooks/use-watchlist.ts — remove filter
(old) => old?.filter(
  (entry) => !(entry.tmdbId === params.tmdbId && entry.mediaType === params.mediaType)
) ?? []
```

**Detection:**
- Enable TypeScript strict mode and run `npm run build` after changing `WatchlistTmdbEntry` — TypeScript will surface all sites that must be updated
- Test: add movie ID X, add TV show ID X (same numeric ID), remove movie → verify TV show card still shows bookmark

**Phase to address:** Phase 1 (schema migration + type cascade) — update all type sites before building any UI.

---

### Pitfall 3: Drizzle pgEnum Migration for `media_type` Is Not as Simple as Adding a Column

**What goes wrong:**
Adding a new PostgreSQL enum type via Drizzle Kit requires careful ordering. The generated migration will attempt to:

1. Create the new `media_type` enum type (`CREATE TYPE "public"."media_type" AS ENUM('movie', 'tv')`)
2. Add the column with `.notNull().default("movie")`
3. Drop the old unique constraint
4. Add the new unique constraint with `media_type`

Drizzle Kit's `db:generate` will produce all of this correctly **in most cases**. The dangerous case is if the developer uses `db:push` instead of `db:generate` + `db:migrate` during prototyping — `db:push` can silently skip constraint renames or produce DDL that breaks on a live database with existing rows.

A second danger: Drizzle Kit generates the constraint drop before the column add. If the order is wrong in the generated SQL, the new constraint references a column that doesn't exist yet. This order-dependency has historically caused issues with Drizzle Kit on complex multi-step migrations (confirmed pattern from community reports).

**Consequences:**
- Failed migration leaves database in partially-migrated state
- Rollback requires manual SQL in Supabase Dashboard
- Existing watchlist rows are blocked from insert/update while migration is in flight

**Prevention:**
1. Always use `db:generate` + `db:migrate` (never `db:push` for production schema changes)
2. After `npm run db:generate`, **read the generated SQL** before running `npm run db:migrate`
3. Verify the SQL order: CREATE TYPE → ALTER TABLE ADD COLUMN → DROP CONSTRAINT → ADD CONSTRAINT
4. Test the migration against a staging Supabase project first if possible
5. Include the data backfill in the migration for existing rows:

```sql
-- Add to the generated migration if not auto-included:
UPDATE "watchlist" SET "media_type" = 'movie' WHERE "media_type" IS NULL;
```

The `.default("movie")` in the Drizzle schema handles new inserts, but existing rows (written before the column exists) will have NULL until the UPDATE runs. Because the column is `.notNull()`, the migration must run the UPDATE before setting NOT NULL — Drizzle Kit may not automatically include this backfill.

**Detection:**
- Run `db:generate`, check generated SQL for UPDATE statement on existing rows
- If UPDATE is missing and the column is `.notNull()`, manually add it before running `db:migrate`
- After migration: open Drizzle Studio → watchlist table → verify `media_type` column exists and all rows show `"movie"` (not NULL)

**Phase to address:** Phase 1 (schema migration) — review the generated SQL before applying, not after.

---

### Pitfall 4: AI Guardrails That Block Mood Queries That Mention Country Names

**What goes wrong:**
The current system prompt explicitly instructs the AI that "Country names (e.g. 'Korean', 'Japanese'), moods (e.g. 'Cozy'), or content types (e.g. 'Anime') are NOT genres." This is correct behavior — but adding an off-topic guardrail risks the model also refusing or over-qualifying responses for mood inputs that mention nationalities as mood context, not as genre requests.

A user who says "I want something cozy like the Japanese movies I grew up with" is expressing a mood. If the guardrail is implemented as a restrictive system prompt instruction ("refuse anything not related to movies or TV"), the model may refuse this as "mentioning non-genre country content." The guardrail needs to distinguish between:
- Off-topic queries: "Help me write an essay about climate change" → refuse
- Mood queries that happen to mention countries/culture: "I want something like a warm Studio Ghibli film" → accept and map to Animation

**Why it happens:**
LLM guardrails implemented via system prompt instructions are pattern-matched by the model, not logically parsed. A rule like "only answer movie/TV questions" is interpreted by the model by matching surface features of the input, not by understanding intent. Legitimate mood queries that superficially resemble off-topic requests (because they mention non-movie concepts like "Japan" or "childhood" or "cozy afternoons") may trip the guardrail.

**Consequences:**
- Users with culturally-specific mood descriptions get refused or receive overly-hedged responses
- The guardrail feels hostile for the primary use case (mood-based discovery)
- Guardrails that are too strict are worse than none — they create a bad UX without providing security value (the AI endpoint is auth-gated anyway)

**Prevention:**
Frame the guardrail as topic-steering rather than topic-blocking. Instead of "refuse off-topic queries," use:

```
If the user asks about something completely unrelated to movies, TV shows, or entertainment (e.g., asking you to write code, do math, give medical advice), gently redirect: "I'm here to help you find great movies and shows! Tell me how you're feeling and I'll find something perfect."

Always interpret cultural references, country mentions, and mood descriptions charitably — they are almost always trying to describe what kind of movie/show they want.
```

This approach steers without blocking. Test the guardrail against 10 legitimate mood inputs and 5 genuinely off-topic inputs before shipping.

**Detection:**
- Manual test: "I want something like a warm Japanese anime film" → should produce Animation suggestions, not a refusal
- Manual test: "help me write a cover letter" → should redirect gracefully without being abrupt
- If the model asks "could you clarify what you mean?" for a cultural mood input, the guardrail is too restrictive

**Phase to address:** Phase for AI polish — test guardrail with diverse mood inputs including cultural references before deploying.

---

### Pitfall 5: TMDB `with_origin_country` Does Not Work as an AND Filter for AI Recommendations

**What goes wrong:**
When the AI suggest_genres tool returns `media_type: "tv"` and the user asked for K-drama, the discover endpoint currently only filters by `with_genres`. There is no mechanism to pass `with_origin_country=KR` from the AI tool output to the TMDB discover call.

If origin country filtering is added to the discover endpoint (e.g., `discoverTVByGenre` accepts an optional `originCountry` param), then the AI tool's `inputSchema` must also be extended to emit `originCountry`. But the AI tool is constrained to return `genres`, `moodSummary`, and `media_type`. Adding `originCountry` to the tool output requires:

1. Updating the Zod schema in `app/api/ai/recommend/route.ts`
2. Updating the `GenreSuggestion` type in `types/ai.ts`
3. Updating the `extractLatestGenreSuggestion` return type
4. Updating the recommendations page to pass `originCountry` to the discover hook

If any one link in this chain is missed, `originCountry` will be `undefined` in the TMDB call and no filtering will happen — no error, just silently wrong results (non-Korean shows in a "K-drama" recommendation set).

**Why it happens:**
The AI → genre suggestion → TMDB discover pipeline has multiple type boundaries. Adding a new field to tool output requires updating three separate type files, two API handlers, and one hook. The silent failure mode (undefined origin country = no filter = wrong results) makes this easy to miss in testing if the tester doesn't know to specifically check for Korean-only results.

**Consequences:**
- "K-drama" requests return international drama mix instead of Korean content
- No error surfaced to user or in logs — the response looks correct but has wrong content
- Inconsistency: K-drama filter on the `/series` page works, but AI recommendations don't apply it

**Prevention:**
Treat the tool schema, `GenreSuggestion` type, and the discover call as a single change unit. Before starting, trace the full data path:

```
AI tool output → GenreSuggestion type → extractLatestGenreSuggestion → recommendations page query string → discover hook → TMDB API param
```

Write a TypeScript type that makes `originCountry` explicit rather than stringly-typed:

```typescript
// types/ai.ts
export type GenreSuggestion = {
  genres: { id: number; name: string }[];
  moodSummary: string;
  media_type: "movie" | "tv";
  originCountry?: string;  // ISO 3166-1 alpha-2, e.g. "KR", "JP"
};
```

Test end-to-end: ask "recommend me some K-dramas" → confirm TMDB discover call has `with_origin_country=KR` in the network tab.

**Detection:**
- Open Network tab, trigger a "K-drama" AI recommendation → inspect the `/api/movies?...` or `/api/series?...` fetch → check for `with_origin_country=KR` query param
- If absent: the chain has a missing link — add `console.log(originCountry)` at each boundary to find the break

**Phase to address:** AI polish phase — after the tool schema change, audit all five chain links before shipping.

---

## Moderate Pitfalls

### Pitfall 6: AI Conversation Logging Adds Latency to Streaming Response If Awaited

**What goes wrong:**
The current AI route stores recommendations as fire-and-forget:

```typescript
// app/api/ai/recommend/route.ts line 183
db.insert(aiRecommendations)
  .values({ userId, prompt: moodPrompt, recommendations: validatedParams })
  .catch(() => { /* non-critical: silently fail */ });
```

v0.4 adds full conversation logging for analytics. If logging is changed from fire-and-forget to `await`, the streaming response is delayed by the DB insert latency (typically 50-200ms on Supabase pooler). During streaming, this delay is felt by the user as a pause before the first token appears.

**Consequences:**
- Streaming chat feels sluggish if DB insert is awaited before stream begins
- If the DB insert fails and is awaited, a failed insert could block the entire response

**Prevention:**
Keep analytics inserts as fire-and-forget. Log the full conversation (not just tool output) by capturing it from the `messages` array passed to `streamText`:

```typescript
// Capture conversation asynchronously after stream starts
const userPromptText = lastMessageText || "mood chat";

// Non-blocking: start stream immediately
const result = streamText({ ... });

// Fire-and-forget conversation log (don't await)
logConversation(userId, userPromptText, uiMessages).catch(() => {});

return result.toUIMessageStreamResponse();
```

If the analytics logging ever needs to be reliable (not fire-and-forget), use a background job queue — not `await` in the request handler.

**Detection:**
- Compare streaming TTFB (Time to First Byte) before and after adding logging
- If TTFB increases by >200ms, the insert is in the critical path — move it out

**Phase to address:** AI logging phase — confirm fire-and-forget pattern is preserved regardless of what else is logged.

---

### Pitfall 7: `useWatchlistCheck` Query Key Does Not Include `mediaType` — Returns Wrong Item

**What goes wrong:**
`watchlistKeys.check(tmdbId)` is used in `useWatchlistCheck` to get the full `WatchlistItem` for a specific TMDB ID. After adding `mediaType`, two entries can share the same `tmdbId` (one movie, one TV show). The server action `getWatchlistItemByTmdbId` returns the first match:

```typescript
// actions/watchlist.ts line 85
.where(and(eq(watchlist.userId, userId), eq(watchlist.tmdbId, tmdbId)))
.limit(1)
```

If a user has both movie ID 1234 and TV show ID 1234 in their library, `getWatchlistItemByTmdbId(1234)` returns whichever row the database returns first (undefined order). The TV show's detail page would see the movie's watchlist state (wrong status, wrong rating).

**Prevention:**
Add `mediaType` to the server action signature:

```typescript
export async function getWatchlistItemByTmdbId(
  tmdbId: number,
  mediaType: "movie" | "tv",
): Promise<WatchlistItem | null>
```

And update the query key factory:

```typescript
check: (tmdbId: number, mediaType: "movie" | "tv") =>
  [...watchlistKeys.all, "check", tmdbId, mediaType] as const,
```

This keeps movie and TV watch state in separate cache slots.

**Detection:**
- Find two TMDB IDs that exist as both a movie and a TV show (e.g., TMDB movie 1234 and TV 1234 — use TMDB docs to find collision examples)
- Add both to library, open TV show detail page → verify it shows TV show status, not movie status

**Phase to address:** Phase 1 (schema migration + type cascade) — update before building TV watchlist UI.

---

### Pitfall 8: My Top 100 Table Needs a Composite Unique on `(userId, tmdbId, mediaType, position)` — Not Just Position

**What goes wrong:**
My Top 100 is a personal ranked list. A naive schema design uses a simple `position` integer column:

```sql
CREATE TABLE top_100 (
  id uuid PRIMARY KEY,
  user_id uuid,
  tmdb_id integer,
  position integer
);
```

Without a unique constraint on `(userId, position)`, two items can occupy the same position, or a user can have 200 items in their "Top 100." Without a constraint on `(userId, tmdbId, mediaType)`, a movie can be added twice.

A second schema mistake: using sequential auto-increment position instead of allowing gaps. If position is auto-incremented and items are deleted, gaps appear (positions 1, 2, 4, 5 after deleting position 3). Reorder operations then need to update every item's position after a delete, which is N updates for N items.

**Prevention:**
Use a floating-point `position` or a dedicated reorder pattern to avoid mass-update rewrites:

Option A (simple, correct): Use `integer` position, allow gaps, implement reorder as a transaction that updates all affected rows:

```typescript
// When moving item from position 5 to position 2:
// UPDATE top_100 SET position = position + 1 WHERE position >= 2 AND position < 5 AND user_id = ?
// UPDATE top_100 SET position = 2 WHERE id = ?
```

Option B (scalable): Use `real` (float) position, insert between existing positions:
- Insert at 1.5 to place between 1 and 2
- Rebalance only when floats run out of precision (rare)

For 100 items, Option A (integer with range UPDATE) is simpler and correct. Enforce constraints:

```typescript
unique("top_100_user_position_unique").on(table.userId, table.position),
unique("top_100_user_media_unique").on(table.userId, table.tmdbId, table.mediaType),
// Optional: check constraint for position range
```

**Detection:**
- Try to add the same movie twice → should return "Already in your Top 100"
- Try to move item to position 50 when list has 30 items → verify no gap > 100 total items possible
- Concurrent drag-and-drop reorder: simulate two rapid reorders → verify no duplicate positions in DB

**Phase to address:** My Top 100 phase — define schema before building the drag-and-drop UI.

---

### Pitfall 9: Watchlist Card Persistence After Remove Requires Consistent `id`-Based Filtering, Not `tmdbId`

**What goes wrong:**
The BACKLOG-23 requirement states "Cards stay in grid after watchlist action, sync flags." This means removing an item from the watchlist page should remove only that card, not cause a full grid re-render that resets scroll position.

The current `useRemoveFromWatchlist` optimistically filters by `item.id` (the UUID) in list caches, which is correct. But `useWatchlistTmdbIds` is filtered by `entry.tmdbId` only:

```typescript
// use-watchlist.ts line 139 (current)
(old) => old?.filter((entry) => entry.tmdbId !== params.tmdbId) ?? [],
```

After adding `mediaType`, this filter incorrectly removes ALL entries with that `tmdbId` (both movie and TV show if IDs collide). The correct filter after migration is:

```typescript
(old) => old?.filter(
  (entry) => !(entry.tmdbId === params.tmdbId && entry.mediaType === params.mediaType)
) ?? [],
```

A second persistence issue: the watchlist library page filters by `status` tab. When a user removes an item from the "Want to Watch" tab, the card disappears immediately (optimistic). But if `onSettled` triggers `invalidateQueries({ queryKey: watchlistKeys.all })`, it causes a full refetch of all list variants — which re-renders the grid and resets scroll position.

**Prevention:**
For card persistence without scroll reset:
1. Keep the optimistic remove in list caches (already implemented)
2. Make `invalidateQueries` narrower: invalidate only `watchlistKeys.tmdbIds()` (for bookmark state across pages) and the specific `watchlistKeys.list(currentStatus)` (for the active tab)
3. Do NOT invalidate all watchlist queries on every mutation — the broad invalidation is the root cause of full re-renders

**Detection:**
- Add 20 items to watchlist, scroll down, remove item 15 → verify scroll position does not jump to top
- If scroll resets: the invalidation is too broad

**Phase to address:** Watchlist UX fixes phase.

---

### Pitfall 10: Origin Country Filter for TV Search Has No TMDB API for Multi-Search Across Seasons

**What goes wrong:**
The TV search endpoint (`/search/tv`) accepts a query string but does NOT accept `with_origin_country` as a filter parameter. Origin country filtering only works on `/discover/tv`. This means:

- "TV Series Search" feature (BACKLOG-31) using `/search/tv` cannot filter by country of origin
- Adding `with_origin_country=KR` to a search request has no effect — TMDB ignores unknown parameters on search endpoints silently

If the discover and search paths are combined in the frontend (user types "crime" and also selects "Korean" origin), the UI must branch: when there is a text query, use `/search/tv` (no country filter); when there is no text query (browse mode), use `/discover/tv` (country filter works). Trying to apply country filter during a text search returns incorrect results or silently ignores the filter.

**Consequences:**
- Users on the TV search who also want "Korean crime shows" find that the "Korean" filter is silently ignored when they type a search term
- No error is thrown — TMDB just returns global results

**Prevention:**
Implement clear UI separation:
- Browse mode (no text query): uses `/discover/tv` with full filter support including `with_origin_country`
- Search mode (text query active): uses `/search/tv` with genre filter only, hide/disable origin country filter with a tooltip "Country filter not available during search"

Document this TMDB limitation in a code comment on the TV search handler so future developers don't try to "fix" what is actually a TMDB API limitation.

**Detection:**
- In browser network tab: when a text search is active and "Korean" filter is selected, check if `with_origin_country=KR` appears in the request URL to `/search/tv` → it should not, confirming the branch is working
- Verify correct behavior by comparing search results with and without the country filter active during text search — results should be identical

**Phase to address:** TV discovery UX phase — implement the search/discover branch before building the filter UI.

---

## Minor Pitfalls

### Pitfall 11: `aiRecommendations` Table Has No Conversation Structure — Full Logging Requires New Schema

**What goes wrong:**
The current `ai_recommendations` table stores only the tool output (genre suggestion) per interaction:

```typescript
export const aiRecommendations = pgTable("ai_recommendations", {
  id: uuid(...),
  userId: uuid(...),
  prompt: text("prompt").notNull(),          // the user's first message only
  recommendations: jsonb("recommendations"), // the tool output JSON
  createdAt: timestamp(...),
});
```

"Full conversation logging for analytics" (as listed in v0.4 requirements) needs the entire message array (user turns + assistant turns + tool calls), not just the last user message and tool result. The current schema cannot store multi-turn conversation history without storing the entire `messages` array in the `recommendations` JSONB column (a semantic mismatch — that column was designed for genre suggestions, not conversation transcripts).

**Prevention:**
Add a separate column or redesign the table for conversation logging:

```typescript
export const aiRecommendations = pgTable("ai_recommendations", {
  // ... existing columns ...
  conversationMessages: jsonb("conversation_messages"),  // full UIMessage array
  modelName: text("model_name"),                        // which Gemini model was used
  promptTokens: integer("prompt_tokens"),               // for quota tracking
  turnCount: integer("turn_count"),                     // number of back-and-forth turns
});
```

Or create a separate `ai_conversations` table and keep `ai_recommendations` for tool outputs only. Either way, this requires a new Drizzle migration.

**Detection:**
- Check Drizzle Studio: after a multi-turn conversation, does the `ai_recommendations` row contain all turns or just the final message?
- If `prompt` contains only the last user message, the logging is incomplete for analytics

**Phase to address:** AI logging phase — decide on schema before writing the logging code.

---

### Pitfall 12: Rating Display Fix for `vote_average` Truncation Feels Wrong at 7.3 vs 73%

**What goes wrong:**
TMDB returns `vote_average` as a float between 0 and 10 (e.g., `7.3`). The existing UI may display it as a percentage or raw float depending on which component. BACKLOG-25 specifies showing as "X/10" or scaled stars.

The minor pitfall: if a developer implements stars, they must map 0-10 to 0-5 (divide by 2), but the rounding must be consistent. `7.3 / 2 = 3.65` — do you show 3.5 stars or 4 stars? Half-star increments require a more complex star renderer. A simpler and more accurate approach: show as `7.3/10` text without stars.

Additionally, `vote_average` can be `0` for unreleased or unlisted films — displaying "0.0/10" is misleading. Guard: show rating only when `vote_count > 10` to ensure statistical significance.

**Prevention:**
Use text display `7.3/10` not stars. Guard with `vote_count > 10`:

```typescript
{movie.vote_average > 0 && movie.vote_count > 10 && (
  <span>{movie.vote_average.toFixed(1)}/10</span>
)}
```

**Phase to address:** Discovery UX polish phase — apply consistently to movie cards, TV cards, and detail pages.

---

### Pitfall 13: `revalidatePath("/library")` Does Not Invalidate Watchlist State on Detail Pages

**What goes wrong:**
All watchlist server actions call `revalidatePath("/library")`. This instructs Next.js to invalidate the RSC cache for the `/library` route. But the watchlist bookmark state on `/movie/[id]` and `/tv/[id]` detail pages is managed by TanStack Query on the client, not by RSC cache. `revalidatePath` has no effect on TanStack Query state.

If a user adds a TV show from the TV detail page, then navigates to `/library`, the library is fresh. But if they navigate back to the TV detail page without a window focus (which would trigger `refetchOnWindowFocus: true`), TanStack Query serves stale cache data — the bookmark may appear as "not in library" for up to 30 seconds.

**Prevention:**
This is already mitigated by `refetchOnWindowFocus: true` on `useWatchlistTmdbIds`. Ensure this setting is preserved when extending the hook for `mediaType`. The remaining gap: if the user adds from a detail page and immediately looks at the bookmark state on the same page without navigating away, the TanStack Query optimistic update must cover this case. Verify `useWatchlistCheck(tmdbId, mediaType)` is optimistically updated in `onMutate` of `useAddToWatchlist`.

**Phase to address:** Watchlist UX fixes phase — verify in integration test.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Schema migration — add `media_type` | Constraint name mismatch breaks error handler (Pitfall 1) | Update catch block string in same commit as schema |
| Schema migration — add `media_type` | NOT NULL default backfill may not be auto-generated (Pitfall 3) | Read generated SQL before running `db:migrate` |
| Schema migration — unique constraint change | Optimistic update filters on `tmdbId` alone, breaks with collisions (Pitfall 2) | Make `mediaType` required in `WatchlistTmdbEntry`, update all filter sites |
| TV watchlist UI | `watchlistKeys.check` returns wrong item when movie/TV share TMDB ID (Pitfall 7) | Add `mediaType` to query key and server action parameter |
| Watchlist card persistence | Broad `invalidateQueries` causes grid re-render and scroll reset (Pitfall 9) | Narrow invalidation to specific query keys |
| AI guardrails | Over-blocking legitimate mood queries with cultural references (Pitfall 4) | Use redirecting prompt, not blocking prompt; test with diverse inputs |
| AI origin country filtering | Tool output lacks `originCountry`, silently skips TMDB filter (Pitfall 5) | Trace all 5 chain links before shipping; add `originCountry` to `GenreSuggestion` type |
| AI conversation logging | Awaiting DB insert adds latency to streaming response (Pitfall 6) | Keep fire-and-forget; log conversation async after stream starts |
| My Top 100 schema | Missing constraints allow duplicate or out-of-range positions (Pitfall 8) | Define unique constraints on `(userId, position)` and `(userId, tmdbId, mediaType)` |
| TV search with origin country | TMDB `/search/tv` ignores `with_origin_country` silently (Pitfall 10) | Branch: discover for browse (country filter), search for text queries (no country filter) |
| AI logging schema | Current `ai_recommendations` table cannot store multi-turn conversations (Pitfall 11) | Add `conversationMessages` JSONB column or create separate `ai_conversations` table |
| Rating display | `vote_average = 0` for unlisted films shows misleading "0.0/10" (Pitfall 12) | Guard: only display when `vote_count > 10` |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Drizzle unique constraint rename | Rename only in schema, forget to update error catch string in server action | Update both in same commit; use shared constant for constraint name |
| TanStack Query optimistic cache with mediaType | Filter by `tmdbId` alone after adding `mediaType` to schema | Filter by `(tmdbId, mediaType)` pair; update all `find()` and `filter()` in hooks |
| AI SDK tool schema extension | Add `originCountry` to tool Zod schema but forget to update `GenreSuggestion` type downstream | Trace full data path: tool schema → type → extractor → page → hook → API param |
| TMDB `/search/tv` + origin country | Pass `with_origin_country` to search endpoint expecting it to filter | Search endpoint ignores unknown params silently; use discover for browse, search for text queries |
| Drizzle migration with pgEnum + NOT NULL column | Column added as NOT NULL but existing rows have NULL → migration may fail | Review generated SQL; add explicit UPDATE for backfill before NOT NULL enforcement |
| AI guardrail system prompt | Use restrictive "refuse" framing instead of redirecting framing | "Redirect to movie topics" is better UX than "refuse non-movie requests" for an auth-gated endpoint |

---

## Security Mistakes to Avoid

| Mistake | Risk | Prevention |
|---------|------|------------|
| New `top_100` table without `WHERE userId = ?` checks | User A can read/modify User B's Top 100 list | Follow the same pattern as `watchlist` actions: always `eq(top100.userId, userId)` in WHERE |
| New `top_100` table without RLS | Supabase RLS bypass same as watchlist | Add RLS policy in Supabase Dashboard after migration (Drizzle bypasses RLS) |
| AI conversation logs store full messages array without sanitization | PII in message history (if user types personal info) stored in JSONB permanently | Log message metadata (turn count, role sequence) not full message text for analytics |

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Constraint name mismatch in production | LOW | Deploy fix to catch block string; no schema change needed |
| `media_type` NOT NULL with NULL rows after migration | MEDIUM | Run `UPDATE watchlist SET media_type = 'movie' WHERE media_type IS NULL` in Supabase SQL Editor |
| TanStack optimistic update filters wrong items | LOW | Fix filter in hook, redeploy; stale state self-corrects on next refetch |
| AI guardrail too strict in production | LOW | Update system prompt string, redeploy; no schema/migration needed |
| Missing originCountry in AI-to-TMDB chain | LOW | Add field to type + tool schema, trace chain, redeploy |
| Top 100 table missing position constraint, duplicate positions exist | MEDIUM | SQL UPDATE to reorder positions, then add constraint with UNIQUE NULLS NOT DISTINCT |

---

## "Looks Done But Isn't" Checklist

- [ ] **Constraint name string:** `actions/watchlist.ts` catch block says `"watchlist_user_tmdb_media_unique"` (not old name) — verify by reading the file
- [ ] **Backfill in migration SQL:** Generated SQL for `media_type` column includes `UPDATE ... SET media_type = 'movie' WHERE media_type IS NULL` before the NOT NULL enforcement
- [ ] **TanStack remove filter:** `useRemoveFromWatchlist` filters `(tmdbId, mediaType)` pair, not `tmdbId` alone — verify by adding movie ID X and TV show ID X, then removing movie; TV bookmark must remain
- [ ] **TV watchlist `useWatchlistCheck`:** Server action takes `(tmdbId, mediaType)` parameter — verify movie and TV with same numeric ID return different rows
- [ ] **AI guardrail test:** "I want something warm like Studio Ghibli" produces Animation genre suggestion, not a refusal — verify with live test
- [ ] **Origin country chain:** "Recommend K-drama" → network tab shows `/discover/tv` request with `with_origin_country=KR` — verify in browser
- [ ] **Conversation logging is async:** AI streaming TTFB is unchanged after adding logging — measure before/after
- [ ] **Top 100 duplicate guard:** Adding the same movie twice returns "Already in your Top 100" — verify in Drizzle Studio that constraint fires

---

## Sources

- Codebase (read directly 2026-02-28): `drizzle/schema.ts`, `drizzle/migrations/0000_lyrical_nightmare.sql`, `drizzle/migrations/0001_kind_rick_jones.sql`, `actions/watchlist.ts`, `hooks/use-watchlist.ts`, `types/watchlist.ts`, `app/api/ai/recommend/route.ts`, `hooks/use-ai.ts`, `types/ai.ts`
- Drizzle ORM unique constraint rename behavior: HIGH confidence (standard PostgreSQL DDL, verified against prior migration in this codebase that renamed `watchlist_status` enum successfully)
- TanStack Query optimistic update patterns: HIGH confidence (code read directly — filter logic confirmed line-by-line)
- TMDB `/search/tv` vs `/discover/tv` parameter support: HIGH confidence (TMDB API v3 docs — search endpoints do not support discover-style filter params; this is documented TMDB behavior)
- Vercel AI SDK tool schema extension pitfall: MEDIUM confidence (based on tracing the existing code path; AI SDK v6 tool output types are not automatically propagated — developer must update all downstream types manually)
- LLM guardrail over-restriction pattern: MEDIUM confidence (known LLM behavior with restrictive system prompts; no official docs, but well-documented in prompt engineering literature)
- Drizzle pgEnum + NOT NULL column backfill: MEDIUM confidence (observed pattern from prior migration in this codebase: `0001_kind_rick_jones.sql` manually added `UPDATE ... SET status = 'want_to_watch' WHERE status = 'watching'` before re-creating the enum — same pattern needed here)

---

*Pitfalls research for: TV watchlisting, AI guardrails/logging, origin country filtering, My Top 100 — v0.4 Moodflix*
*Researched: 2026-02-28*

# Phase 9: Schema Migration - Research

**Researched:** 2026-02-28
**Domain:** Drizzle ORM schema migrations, PostgreSQL DDL, TypeScript types
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Top 100 ranking design**: Hard limit of 100 entries enforced at app level (no DB constraint on count). Minimal data per entry: rank + tmdbId + mediaType + userId + timestamps (fetch details from TMDB at display time). Independent from watchlist — user can rank any movie/show whether or not it's in their watchlist. Auto-add trigger: when user marks something as "watched" AND likes it, auto-add to top 100. When list is full (100 entries) and auto-add triggers, skip silently — no notification, no replacement. User can also manually add items independently of the auto-add trigger.

- **Media type enum values**: pgEnum with two values: `movie` and `tv` only. Shared enum used across both `watchlist` and `top_hundred` tables. No future-proofing for additional types — add via migration if needed later.

- **AI messages column shape**: Separate `ai_conversations` table instead of a column on `ai_recommendations` (deviates from original roadmap criteria — update roadmap). Store the full AI SDK v5 message array (role, content, tool calls) as JSONB. Backend-only logging — conversations are NOT exposed to users in UI. Purpose: improving prompts, debugging, analytics.

- **Migration safety approach**: Single Drizzle Kit migration file covering all changes. Apply directly to production Supabase via `npm run db:migrate` (no local Postgres testing). No concern about existing data — small dataset, early stage. Watchlist backfill: drop old unique constraint (userId, tmdbId), backfill media_type='movie' on all rows, add new constraint (userId, tmdbId, mediaType).

### Claude's Discretion

- Rank storage strategy (dense integers vs fractional/gap ranks) — pick based on reordering UX
- Backfill default approach for media_type column (migration-time DEFAULT vs separate UPDATE)
- RLS policy management approach (Supabase Dashboard SQL vs Drizzle-managed)
- ai_conversations table structure details (columns, FKs, indexes)

### Deferred Ideas (OUT OF SCOPE)

- Remove unused `watching` value from watchlist_status enum — cleanup task for a future phase
- User-viewable conversation history (browsing/replaying past AI chats) — potential future feature
- Adding `person` media type for ranking favorite actors/directors — future scope if needed
- Roadmap success criteria #3 needs updating to reflect separate ai_conversations table
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TVWL-07 | Schema migration adds media_type column to watchlist table with DEFAULT 'movie' backfill | pgEnum creation pattern, ADD COLUMN with DEFAULT, existing constraint name `watchlist_user_tmdb_unique` identified |
| TVWL-08 | Unique constraint updated to (userId, tmdbId, mediaType) — movie and TV with same TMDB ID can coexist | DROP CONSTRAINT + ADD CONSTRAINT pattern, new constraint name `watchlist_user_tmdb_media_unique` |
| AIPOL-05 | Full AI conversation (all user + assistant messages) logged to database for analytics when genre suggestion is made | New `ai_conversations` table with JSONB messages column, FK to profiles |
| AIPOL-06 | AI conversation logging is fire-and-forget — does not add latency to streaming response | `.catch(() => {})` pattern already used in `aiRecommendations` insert — extend same pattern |
</phase_requirements>

---

## Summary

Phase 9 is a pure database and type layer change — no UI work. The codebase uses Drizzle ORM v0.45.1 with drizzle-kit v0.31.9, and has two existing migration files (0000, 0001). The target Supabase PostgreSQL instance already has the `watchlist` table with a `watchlist_user_tmdb_unique` constraint on `(user_id, tmdb_id)` that must be replaced.

The central challenge is generating a single migration that: (1) creates a new `media_type_enum` pgEnum, (2) adds a `media_type` column to `watchlist` with `DEFAULT 'movie'` so all existing rows are automatically backfilled, (3) drops the old two-column unique constraint and replaces it with a three-column one, (4) creates the new `ai_conversations` table, and (5) creates the new `top_hundred` table. The generated SQL from `drizzle-kit generate` must be reviewed and potentially amended before running `db:migrate`, because Drizzle Kit's handling of NOT NULL enum columns + constraint changes in a single migration can produce incorrect statement ordering.

TypeScript type changes propagate to four files: `types/watchlist.ts` (add `mediaType` field), `types/ai.ts` (add conversation type), new `types/top-hundred.ts`, and `actions/watchlist.ts` (update constraint error string). The `drizzle/schema.ts` is the single source of truth and drives all changes.

**Primary recommendation:** Update `drizzle/schema.ts`, run `db:generate`, manually review and amend the generated SQL to ensure correct ordering (CREATE TYPE → ADD COLUMN WITH DEFAULT → UPDATE if needed → DROP CONSTRAINT → ADD CONSTRAINT → CREATE TABLEs), then run `db:migrate`. Update TypeScript types and the constraint error string in the same commit.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | 0.45.1 (installed) | Schema definition, query builder | Already in use; `$inferSelect` for TS types |
| drizzle-kit | 0.31.9 (installed) | Migration generation and application | Already in use; `generate` + `migrate` commands |
| postgres-js | 3.4.8 (installed) | PostgreSQL driver | Already in use; `prepare: false` for Supabase pooler |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| dotenv | 17.2.4 (installed) | Load `.env.local` for drizzle.config.ts | Already configured in `drizzle.config.ts` |
| zod | 4.3.6 (installed) | Validate JSONB shape in API routes | For ai_conversations messages type safety |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Drizzle-managed pgEnum | Raw SQL CREATE TYPE | Drizzle-managed keeps TS types in sync automatically |
| `DEFAULT 'movie'` on column | Separate UPDATE after ADD COLUMN | DEFAULT approach is atomic and simpler; UPDATE is more explicit but adds a step |
| Dense integer rank (1, 2, 3...) | Fractional/gap rank (1.0, 2.0, 3.0) | Dense integers are simpler for move-up/down UX (swap ranks); fractional useful only for drag-and-drop which is out of scope |

**Installation:** No new packages required. All libraries are already installed.

---

## Architecture Patterns

### Recommended File Structure for This Phase

```
drizzle/
├── schema.ts              # UPDATE: add mediaTypeEnum, update watchlist, add ai_conversations + top_hundred
├── migrations/
│   ├── 0000_*.sql         # existing — do not touch
│   ├── 0001_*.sql         # existing — do not touch
│   └── 0002_schema_migration.sql   # GENERATED by drizzle-kit generate, then reviewed
types/
├── watchlist.ts           # UPDATE: add mediaType field to WatchlistItem, AddToWatchlistInput, etc.
├── ai.ts                  # UPDATE: add AiConversation type
└── top-hundred.ts         # NEW: TopHundredItem, AddToTopHundredInput types
actions/
└── watchlist.ts           # UPDATE: constraint error string from watchlist_user_tmdb_unique → watchlist_user_tmdb_media_unique
drizzle/
└── rls-policies.sql       # UPDATE: add RLS policies for ai_conversations + top_hundred tables
```

### Pattern 1: pgEnum Shared Across Tables

**What:** Define a single pgEnum and reference it in multiple table definitions.
**When to use:** When the same set of discrete values applies to multiple tables (here: `media_type` on both `watchlist` and `top_hundred`).

```typescript
// Source: https://orm.drizzle.team/docs/column-types/pg
import { pgEnum, pgTable } from "drizzle-orm/pg-core";

export const mediaTypeEnum = pgEnum("media_type", ["movie", "tv"]);

export const watchlist = pgTable("watchlist", {
  // ... existing columns ...
  mediaType: mediaTypeEnum("media_type").notNull().default("movie"),
});

export const topHundred = pgTable("top_hundred", {
  // ...
  mediaType: mediaTypeEnum("media_type").notNull(),
});
```

**Key:** The enum name string `"media_type"` becomes the PostgreSQL type name. Must be exported for drizzle-kit to detect it reliably (confirmed bug: drizzle-kit misses non-exported enums — see GitHub issue #5174).

### Pattern 2: Replacing a Unique Constraint

**What:** Remove old unique constraint, add new one with different columns.
**When to use:** When the uniqueness key changes (adding `mediaType` to watchlist's uniqueness key).

```typescript
// In schema.ts — remove old unique(), add new one
export const watchlist = pgTable(
  "watchlist",
  {
    // ... columns including mediaType ...
  },
  (table) => [
    // OLD (remove this):
    // unique("watchlist_user_tmdb_unique").on(table.userId, table.tmdbId),
    // NEW:
    unique("watchlist_user_tmdb_media_unique").on(
      table.userId,
      table.tmdbId,
      table.mediaType
    ),
  ]
);
```

The generated SQL will contain `ALTER TABLE "watchlist" DROP CONSTRAINT "watchlist_user_tmdb_unique"` and then `ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_user_tmdb_media_unique" UNIQUE(...)`. This ordering is correct but must be verified after generation.

### Pattern 3: Dense Integer Ranking for Move-Up/Down UX

**What:** Store rank as a plain integer (1–100). Reorder by swapping ranks between two adjacent items.
**When to use:** For move-up/down controls (out of scope for Phase 9 UI, but schema design affects how Phase 13 will work).

```typescript
// Schema supports swap-based reordering:
export const topHundred = pgTable(
  "top_hundred",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    tmdbId: integer("tmdb_id").notNull(),
    mediaType: mediaTypeEnum("media_type").notNull(),
    rank: integer("rank").notNull(),  // 1–100, enforced at app level
    title: text("title").notNull(),
    posterPath: text("poster_path"),
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique("top_hundred_user_rank_unique").on(table.userId, table.rank),
    unique("top_hundred_user_tmdb_media_unique").on(table.userId, table.tmdbId, table.mediaType),
  ]
);
```

Rationale for dense integers: Phase 13 uses move-up/down (swap `rank` between two rows in a transaction). Fractional ranking only helps drag-and-drop (out of scope per REQUIREMENTS.md). Dense integers are simpler and correct.

### Pattern 4: ai_conversations Table

**What:** New table storing full AI SDK v5 message arrays as JSONB. Fire-and-forget insert, no user exposure.
**When to use:** Whenever the `suggest_genres` tool executes in the AI route.

```typescript
export const aiConversations = pgTable("ai_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  messages: jsonb("messages").notNull(),   // Full AI SDK v5 message array
  prompt: text("prompt"),                  // The user's last message text (for quick querying)
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
```

The `messages` JSONB column stores the full conversation (all user + assistant messages including tool calls) matching the AI SDK v5 `UIMessage[]` shape. No TypeScript type is enforced at the DB layer — this is analytics data, not user-facing.

### Pattern 5: Fire-and-Forget DB Insert

**What:** Insert without awaiting, catching errors silently.
**When to use:** For analytics logging that must not block the streaming response.

```typescript
// Already used in app/api/ai/recommend/route.ts for aiRecommendations:
db.insert(aiConversations)
  .values({
    userId,
    messages: uiMessages,  // the full messages array from the request
    prompt: lastMessageText,
  })
  .catch(() => {
    // Non-critical: silently fail
  });
```

This pattern is established in the codebase. The Phase 12 plan (AI Polish) will add this call to the existing route — Phase 9 only creates the table.

### Anti-Patterns to Avoid

- **NOT NULL enum column without default**: If you add `mediaType` as `.notNull()` with no `.default()`, PostgreSQL will reject the `ADD COLUMN` because existing rows would have NULL values. Always pair `.notNull()` with `.default("movie")` for the backfill.
- **Modifying existing migration files**: Never edit 0000 or 0001 SQL files after they've been applied to the database. The journal tracks them by hash/index. Always generate a new migration.
- **Running `db:push` instead of `db:migrate`**: `db:push` applies schema directly and resets migration history. Use `db:generate` + `db:migrate` for production.
- **Not reviewing generated SQL**: Drizzle Kit can generate migrations with incorrect ordering (e.g., ADD COLUMN before CREATE TYPE). Always read the generated `.sql` file before running `db:migrate`.
- **Forgetting to update constraint error string**: `actions/watchlist.ts` catches constraint violations by string-matching `"watchlist_user_tmdb_unique"`. This MUST be updated to `"watchlist_user_tmdb_media_unique"` in the same commit as the schema change.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Migration SQL | Hand-write raw SQL | `npm run db:generate` from schema.ts | Drizzle keeps snapshots in sync, generates correct DDL |
| TypeScript types for DB rows | Manual type definitions | `typeof table.$inferSelect` / `typeof table.$inferInsert` | Auto-derives from schema, stays in sync |
| UUID generation | Custom ID logic | `.defaultRandom()` on uuid column | PostgreSQL `gen_random_uuid()` is correct and efficient |
| Timestamp columns | Manual date strings | `timestamp(...).defaultNow()` | DB-side default, correct timezone handling |

**Key insight:** Drizzle's `$inferSelect` derived types (via `typeof watchlist.$inferSelect`) are the ground truth for serialization. The manual types in `types/watchlist.ts` must align with these, not the other way around.

---

## Common Pitfalls

### Pitfall 1: pgEnum CREATE TYPE Must Precede ADD COLUMN

**What goes wrong:** Drizzle Kit generates the `ADD COLUMN media_type media_type` DDL before `CREATE TYPE media_type AS ENUM(...)`. PostgreSQL rejects the migration with "type does not exist."

**Why it happens:** Drizzle Kit sometimes orders DDL statements incorrectly when a new enum type and a new column using that type are introduced in the same migration.

**How to avoid:** After running `db:generate`, open the generated SQL file and verify:
1. `CREATE TYPE "public"."media_type" AS ENUM(...)` appears BEFORE `ALTER TABLE "watchlist" ADD COLUMN "media_type"...`
2. The backfill `UPDATE` (if needed) appears AFTER the column is added
3. `DROP CONSTRAINT` appears before `ADD CONSTRAINT`

If ordering is wrong, manually reorder the statements. The `-->statement-breakpoint` comments in Drizzle migration files are delimiters, not ordering guarantees.

**Warning signs:** Migration fails immediately with "type does not exist" or "column cannot be cast" errors.

### Pitfall 2: NOT NULL Column on Existing Rows Without Default

**What goes wrong:** `ALTER TABLE "watchlist" ADD COLUMN "media_type" "media_type" NOT NULL` fails because existing rows would be NULL.

**Why it happens:** PostgreSQL rejects adding a NOT NULL column without a default if any rows exist.

**How to avoid:** The schema definition MUST include `.default("movie")` on the `mediaType` column so the generated SQL becomes `ADD COLUMN "media_type" "media_type" NOT NULL DEFAULT 'movie'`. This is safe — PostgreSQL applies the default to all existing rows atomically.

```typescript
mediaType: mediaTypeEnum("media_type").notNull().default("movie"),
```

**Warning signs:** Migration fails with "column contains null values" or similar.

### Pitfall 3: Constraint Name Mismatch in Error Catch

**What goes wrong:** After renaming the unique constraint, `addToWatchlist` in `actions/watchlist.ts` fails to catch the duplicate error and returns a generic "Failed to add to library" error instead of "Movie already in library."

**Why it happens:** The catch block string-matches `err.message.includes("watchlist_user_tmdb_unique")`. After the migration, the constraint is named `watchlist_user_tmdb_media_unique`.

**How to avoid:** Update the string in the catch block in the same commit as the schema change:
```typescript
// OLD:
err.message.includes("watchlist_user_tmdb_unique")
// NEW:
err.message.includes("watchlist_user_tmdb_media_unique")
```

**Warning signs:** TV show add produces "Failed to add to library" instead of "Already in library" for duplicate entries.

### Pitfall 4: RLS Not Enabled on New Tables

**What goes wrong:** New tables `ai_conversations` and `top_hundred` are created without RLS policies. Drizzle bypasses RLS (direct connection), but if Supabase client is ever used directly, data leaks across users.

**Why it happens:** `rls-policies.sql` only covers the original three tables. New tables default to RLS disabled.

**How to avoid:** Append RLS policies for both new tables to `drizzle/rls-policies.sql` and note in the plan that they must be run in Supabase SQL Editor after migration. For `ai_conversations`: SELECT policy is backend-only (no user-facing queries needed, but add for completeness). For `top_hundred`: full CRUD policies.

**Warning signs:** Supabase dashboard shows RLS as disabled on new tables.

### Pitfall 5: drizzle-kit Misses Non-Exported Enum

**What goes wrong:** `db:generate` produces a migration that doesn't include the `CREATE TYPE media_type` statement, only the `ADD COLUMN` — which then fails.

**Why it happens:** Confirmed drizzle-orm bug (#5174): drizzle-kit only detects pgEnum if it is explicitly exported from `schema.ts`.

**How to avoid:** Always use `export const mediaTypeEnum = pgEnum(...)` — never declare the enum as an unexported `const`. This is already the pattern used for `watchlistStatusEnum` in the codebase.

---

## Code Examples

### Updated schema.ts (complete target state)

```typescript
// Source: Drizzle ORM docs + existing codebase pattern
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";

// Existing enum — unchanged
export const watchlistStatusEnum = pgEnum("watchlist_status", [
  "want_to_watch",
  "watched",
]);

// NEW: shared media type enum
export const mediaTypeEnum = pgEnum("media_type", ["movie", "tv"]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  username: text("username").unique(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const watchlist = pgTable(
  "watchlist",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    tmdbId: integer("tmdb_id").notNull(),
    title: text("title").notNull(),
    posterPath: text("poster_path"),
    status: watchlistStatusEnum("status").default("want_to_watch"),
    rating: integer("rating"),
    // NEW: mediaType with default for backfill
    mediaType: mediaTypeEnum("media_type").notNull().default("movie"),
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow(),
    watchedAt: timestamp("watched_at", { withTimezone: true }),
  },
  (table) => [
    // OLD constraint removed, NEW constraint replaces it
    unique("watchlist_user_tmdb_media_unique").on(
      table.userId,
      table.tmdbId,
      table.mediaType
    ),
  ]
);

export const aiRecommendations = pgTable("ai_recommendations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  recommendations: jsonb("recommendations").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// NEW: ai_conversations for analytics logging
export const aiConversations = pgTable("ai_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  messages: jsonb("messages").notNull(),
  prompt: text("prompt"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// NEW: top_hundred for My Top 100 feature
export const topHundred = pgTable(
  "top_hundred",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    tmdbId: integer("tmdb_id").notNull(),
    mediaType: mediaTypeEnum("media_type").notNull(),
    rank: integer("rank").notNull(),
    title: text("title").notNull(),
    posterPath: text("poster_path"),
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique("top_hundred_user_rank_unique").on(table.userId, table.rank),
    unique("top_hundred_user_tmdb_media_unique").on(
      table.userId,
      table.tmdbId,
      table.mediaType
    ),
  ]
);
```

### Expected Migration SQL Structure (after `db:generate`, before `db:migrate`)

```sql
-- CORRECT ordering — verify this after generation:
CREATE TYPE "public"."media_type" AS ENUM('movie', 'tv');
--> statement-breakpoint

-- Add column with DEFAULT so existing rows are backfilled
ALTER TABLE "watchlist" ADD COLUMN "media_type" "public"."media_type" NOT NULL DEFAULT 'movie';
--> statement-breakpoint

-- Drop old constraint
ALTER TABLE "watchlist" DROP CONSTRAINT "watchlist_user_tmdb_unique";
--> statement-breakpoint

-- Add new 3-column constraint
ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_user_tmdb_media_unique"
  UNIQUE("user_id", "tmdb_id", "media_type");
--> statement-breakpoint

-- New tables
CREATE TABLE "ai_conversations" (...);
--> statement-breakpoint
CREATE TABLE "top_hundred" (...);
--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_profiles_id_fk" ...;
--> statement-breakpoint
ALTER TABLE "top_hundred" ADD CONSTRAINT "top_hundred_user_id_profiles_id_fk" ...;
```

### Updated types/watchlist.ts

```typescript
import type { MediaType } from "@/types/media";  // or inline the union

export type WatchlistStatus = "want_to_watch" | "watched";
export type WatchlistFilterStatus = WatchlistStatus | "all";
export type MediaType = "movie" | "tv";

export type WatchlistItem = {
  id: string;
  userId: string;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  status: WatchlistStatus;
  rating: number | null;
  mediaType: MediaType;    // NEW
  addedAt: string;
  watchedAt: string | null;
};

export type WatchlistTmdbEntry = {
  id: string;
  tmdbId: number;
  status: WatchlistStatus;
  mediaType: MediaType;    // NEW — needed for Phase 10 TV watchlist lookup
};

export type AddToWatchlistInput = {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  status?: WatchlistStatus;
  mediaType?: MediaType;   // NEW — defaults to "movie" if omitted
};
```

### New types/top-hundred.ts

```typescript
export type MediaType = "movie" | "tv";

export type TopHundredItem = {
  id: string;
  userId: string;
  tmdbId: number;
  mediaType: MediaType;
  rank: number;
  title: string;
  posterPath: string | null;
  addedAt: string;
};

export type AddToTopHundredInput = {
  tmdbId: number;
  mediaType: MediaType;
  rank: number;
  title: string;
  posterPath: string | null;
};

export type TopHundredActionResult =
  | { item: TopHundredItem; error?: never }
  | { item?: never; error: string };

export type TopHundredDeleteResult =
  | { success: true; error?: never }
  | { success?: never; error: string };
```

**Note on MediaType:** `MediaType = "movie" | "tv"` is already partially present in `types/ai.ts` as `media_type?: "movie" | "tv"` on `GenreSuggestion`. Consider extracting to a shared `types/media.ts` to avoid duplication across `watchlist.ts`, `top-hundred.ts`, and `ai.ts`.

### Updated RLS policies (append to rls-policies.sql)

```sql
-- ai_conversations: backend-only inserts, no user selects
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service can insert conversations" ON public.ai_conversations;
CREATE POLICY "Service can insert conversations"
  ON public.ai_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- top_hundred: full CRUD on own entries
ALTER TABLE public.top_hundred ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own top hundred" ON public.top_hundred;
CREATE POLICY "Users can view own top hundred"
  ON public.top_hundred FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own top hundred" ON public.top_hundred;
CREATE POLICY "Users can insert own top hundred"
  ON public.top_hundred FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own top hundred" ON public.top_hundred;
CREATE POLICY "Users can update own top hundred"
  ON public.top_hundred FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own top hundred" ON public.top_hundred;
CREATE POLICY "Users can delete own top hundred"
  ON public.top_hundred FOR DELETE
  USING (auth.uid() = user_id);
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `watchlist_user_tmdb_unique` on (userId, tmdbId) | `watchlist_user_tmdb_media_unique` on (userId, tmdbId, mediaType) | Movie and TV show with same TMDB ID can both be in watchlist |
| `ai_recommendations` only for genre suggestions | + `ai_conversations` for full message logging | Analytics/debugging without affecting user-facing recommendations |
| No `top_hundred` table | `top_hundred` with rank + dual unique constraints | Foundation for Phase 13 My Top 100 feature |

**Deprecated/outdated:**
- Old constraint name `watchlist_user_tmdb_unique`: Replaced by `watchlist_user_tmdb_media_unique`. Must update the string in `actions/watchlist.ts` catch block.
- Column `messages` on `ai_recommendations`: Was the original roadmap plan. Replaced by separate `ai_conversations` table. No change needed to `ai_recommendations` table.

---

## Open Questions

1. **MediaType type centralization**
   - What we know: `"movie" | "tv"` union appears in `types/ai.ts` (on `GenreSuggestion`) and will appear in `types/watchlist.ts` and `types/top-hundred.ts`
   - What's unclear: Whether to extract a shared `types/media.ts` or keep it inline in each file
   - Recommendation: Create `types/media.ts` with `export type MediaType = "movie" | "tv"` and import it everywhere. Avoids divergence if a third value is ever added.

2. **serializeItem function in actions/watchlist.ts**
   - What we know: The function currently returns `WatchlistItem` by manually mapping Drizzle row fields. After adding `mediaType`, it must include the new field.
   - What's unclear: Whether Drizzle will infer `mediaType` as `"movie" | "tv"` or as the enum string type
   - Recommendation: Cast via `row.mediaType as MediaType` in the serializer, matching the existing pattern for `status`.

3. **title column on top_hundred**
   - What we know: The decisions specify "minimal data per entry: rank + tmdbId + mediaType + userId + timestamps — fetch details from TMDB at display time"
   - What's unclear: Whether `title` and `posterPath` should be stored (for display without an extra TMDB call) or omitted (TMDB fetch on display)
   - Recommendation: Include `title` and `posterPath` on `top_hundred` — same as `watchlist` pattern. TMDB API calls on every page load for 100 items would be expensive and rate-limited. Store denormalized for performance.

---

## Sources

### Primary (HIGH confidence)
- Drizzle ORM official docs (https://orm.drizzle.team/docs/column-types/pg) — pgEnum column definitions, .notNull(), .default()
- Drizzle Kit custom migrations docs (https://orm.drizzle.team/docs/kit-custom-migrations) — `db:generate --custom`, manual SQL editing
- Existing codebase `drizzle/schema.ts` — current schema state, constraint names, enum names
- Existing migration `0001_kind_rick_jones.sql` — confirms safe pattern for enum changes with manual UPDATE + type drop/recreate

### Secondary (MEDIUM confidence)
- GitHub issue drizzle-orm #5174 — non-exported pgEnum bug; confirmed fix is to always export enum
- GitHub issue drizzle-orm #4295 — changing enum column default value can produce broken migration; verify generated SQL

### Tertiary (LOW confidence)
- WebSearch: Drizzle Kit ordering of CREATE TYPE before ADD COLUMN — commonly reported but not officially documented as a known issue. Treat as a validation step rather than a guaranteed problem.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries are already installed and in use; no new dependencies
- Architecture: HIGH — patterns derived from existing codebase conventions + official Drizzle docs
- Pitfalls: MEDIUM — constraint name mismatch and enum ordering verified from codebase analysis; SQL ordering issue is MEDIUM (reported in community, not confirmed in official docs)

**Research date:** 2026-02-28
**Valid until:** 2026-03-28 (Drizzle is stable; unlikely to change migration behavior within 30 days)

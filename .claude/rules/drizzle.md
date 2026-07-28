---
paths:
  - "drizzle/**/*.ts"
  - "drizzle/**/*.sql"
  - "actions/**/*.ts"
  - "app/api/**/*.ts"
---

# Drizzle / Supabase

- **Schema is the single source of truth:** `drizzle/schema.ts` defines tables, enums, indexes, FKs. Append new tables at the END of the file so existing references stay valid.
- **Drizzle client (`drizzle/index.ts`)** uses `DATABASE_URL` (transaction pooler, port 6543) with `prepare: false` — required for Supabase pgBouncer.
- **Migrations:** `npm run db:generate` produces SQL, `npm run db:migrate` applies it. Drizzle Kit uses `DATABASE_URL_DIRECT` (session pooler, port 5432) because the transaction pooler can't run DDL.
- **`.env.local` loading:** Drizzle Kit doesn't load `.env.local` by default. `drizzle.config.ts` calls `dotenv.config({ path: ".env.local" })` — keep that.
- **No `supabase/` folder:** Supabase CLI is not used. Drizzle Kit handles migrations.

## RLS

- **Drizzle bypasses RLS** via the direct connection — server-side `db` queries see all rows. Authorization MUST happen in app code: every query needs an explicit `eq(table.userId, user.id)` (or equivalent ownership predicate).
- **RLS still matters** for Supabase realtime subscriptions and any client-side reads via the Supabase JS client.
- **New tables: declare RLS in `schema.ts`, not `rls-policies.sql`.** `drizzle-orm@0.45` supports `.enableRLS()` and `pgPolicy()`, so `db:generate` emits the `ENABLE ROW LEVEL SECURITY` / policy statements and `db:migrate` applies them. One source of truth, no dashboard step, no drift, and a fresh DB is correct after `db:migrate` alone. Example: `media_embeddings` / `recommendation_events` (migration `0012`).

  ```ts
  export const t = pgTable("t", {...}, (table) => [...]).enableRLS();
  ```

  Server-only tables want `.enableRLS()` with **zero policies** — that denies all PostgREST/client access while Drizzle still reads everything as table owner.
- **Legacy tables keep using `drizzle/rls-policies.sql`** + manual application in the Supabase SQL Editor. Those policy blocks predate Drizzle's RLS support; migrating live policies into `schema.ts` is riskier than leaving them. Don't add new ones there.
- Use `DROP POLICY IF EXISTS` + `CREATE POLICY` in the SQL file so it's idempotent.

## Gotchas

- **IPv6 direct connection:** `db.[ref].supabase.co:5432` may resolve to unreachable IPv6. Use session pooler `pooler.supabase.com:5432` instead.
- **Date → string:** server actions returning Drizzle rows must convert `Date` to ISO strings before crossing the network. Use a `mapRow` helper.
- **Migration ordering:** Files in `drizzle/migrations/` are applied in numeric prefix order. Never delete or renumber an applied migration — generate a new one.
- **Unique constraints:** Catch `unique_violation` errors and surface user-friendly messages rather than 500ing.
- **⚠️ Never run `npm run db:push` on this repo.** `tmdb_media.search_tsv` is a generated `tsvector` column that exists in the DB but is intentionally absent from `schema.ts` (Drizzle 0.45 has no native tsvector type — it would need `customType`). `push` diffs schema-vs-DB and would **drop that column and its GIN index**. `db:migrate` is safe: it only replays migration files. For the same reason, scan every `db:generate` output for a stray `DROP COLUMN search_tsv` before applying.

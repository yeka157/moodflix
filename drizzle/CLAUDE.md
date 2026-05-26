# Drizzle / Supabase

- **Schema is the single source of truth:** `schema.ts` defines tables, enums, indexes, FKs. Append new tables at the END of the file so existing references stay valid.
- **Drizzle client (`index.ts`)** uses `DATABASE_URL` (transaction pooler, port 6543) with `prepare: false` — required for Supabase pgBouncer.
- **Migrations:** `npm run db:generate` produces SQL, `npm run db:migrate` applies it. Drizzle Kit uses `DATABASE_URL_DIRECT` (session pooler, port 5432) because the transaction pooler can't run DDL.
- **`.env.local` loading:** Drizzle Kit doesn't load `.env.local` by default. `drizzle.config.ts` calls `dotenv.config({ path: ".env.local" })` — keep that.
- **No `supabase/` folder:** Supabase CLI is not used. Migrations are Drizzle Kit's job.

## RLS

- **Drizzle bypasses RLS** via the direct connection — server-side `db` queries see all rows. Authorization MUST happen in app code: every query needs an explicit `eq(table.userId, user.id)` (or equivalent ownership predicate).
- **RLS still matters** for Supabase realtime subscriptions and any client-side reads via the Supabase JS client. Append new policies to `rls-policies.sql` AND apply them manually in the Supabase Dashboard SQL Editor before deploying.
- Use `DROP POLICY IF EXISTS` + `CREATE POLICY` in the SQL file so it's idempotent.

## Gotchas

- **IPv6 direct connection:** `db.[ref].supabase.co:5432` may resolve to unreachable IPv6. Use session pooler `pooler.supabase.com:5432` instead.
- **Date → string:** server actions returning Drizzle rows must convert `Date` to ISO strings before crossing the network. Use a `mapRow` helper.
- **Migration ordering:** Files in `migrations/` are applied in numeric prefix order. Never delete or renumber an applied migration — generate a new one.
- **Unique constraints:** Catch `unique_violation` errors and surface user-friendly messages rather than 500ing.

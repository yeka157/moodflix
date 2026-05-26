# Database (Drizzle + Supabase)

- **ORM:** Drizzle ORM with `postgres-js` driver
- **Schema:** `drizzle/schema.ts` — single source of truth for tables, enums, indexes
- **Migrations:** Generated via `npm run db:generate`, applied via `npm run db:migrate`
- **Drizzle client:** `drizzle/index.ts` — uses `DATABASE_URL` (transaction pooler, port 6543) with `prepare: false`
- **Direct connection:** `DATABASE_URL_DIRECT` (session pooler, port 5432) is used by Drizzle Kit for DDL/migrations only. Transaction pooler can't run DDL.
- **Drizzle Kit + .env.local:** Drizzle Kit doesn't load `.env.local` by default. `drizzle.config.ts` uses `dotenv` with `config({ path: ".env.local" })`.
- **No `supabase/` folder:** Supabase CLI not used in this project. Drizzle Kit handles migrations.
- **RLS:** Managed manually via Supabase Dashboard SQL Editor. New policies go in `drizzle/rls-policies.sql` and must be applied manually before deploying any feature that depends on them.

## Authorization

- **Drizzle bypasses Supabase RLS** because it uses a direct connection. ALL queries MUST include explicit `eq(table.userId, user.id)` WHERE clauses for ownership checks.
- **Server actions:** Always start with `const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login");`
- **API routes:** Same auth guard via `createClient()` from `@/lib/supabase/server`.

## Gotchas

- **IPv6 direct connection:** `db.[ref].supabase.co:5432` may resolve to unreachable IPv6. Use session pooler `pooler.supabase.com:5432` instead.
- **Date serialization:** Drizzle returns `Date` objects; convert to ISO strings via `.toISOString()` before returning from server actions to client.
- **Unique constraint violations:** Catch them and return friendly error messages (e.g., watchlist's `watchlist_user_tmdb_unique`).

# Drizzle ORM - Database Migration Guide

## Overview

This project uses Drizzle ORM for type-safe database queries and Drizzle Kit for schema migrations. Supabase Auth is handled separately via `@supabase/ssr` — Drizzle manages only the data layer.

## Connection URLs

- `DATABASE_URL` — Supabase transaction pooler (port 6543), used at runtime by the app with `prepare: false`
- `DATABASE_URL_DIRECT` — Supabase session pooler (port 5432), used by Drizzle Kit for migrations/DDL

## Commands

| Command            | Description                                                  |
| ------------------ | ------------------------------------------------------------ |
| `npm run db:generate` | Generate SQL migration files from schema changes          |
| `npm run db:migrate`  | Apply pending migrations to the database                  |
| `npm run db:push`     | Push schema directly (prototyping only, skips migration files) |
| `npm run db:studio`   | Open Drizzle Studio to browse/edit data                   |

## How to Alter the Database

### 1. Edit the schema

Open `drizzle/schema.ts` and make your changes (add columns, tables, modify types, etc.).

### 2. Generate a migration

```bash
npm run db:generate
```

Drizzle Kit compares your schema file against the previous migration state and generates a new SQL migration in `drizzle/migrations/`.

### 3. Review the generated SQL

Check the new `.sql` file in `drizzle/migrations/` to ensure correctness.

### 4. Apply the migration

```bash
npm run db:migrate
```

This executes the migration against Supabase.

### 5. Update RLS if needed

If you added new tables, add RLS policies via Supabase Dashboard > SQL Editor.

## Examples

### Add a column

In `drizzle/schema.ts`:

```typescript
export const profiles = pgTable("profiles", {
  // ... existing columns
  bio: text("bio"),
});
```

Then: `npm run db:generate && npm run db:migrate`

### Add a new table

Define it in `drizzle/schema.ts` with `pgTable(...)`, then generate + migrate.

### Rename a column

Drizzle Kit will detect renames interactively during `db:generate`.

## Important Notes

- Always use `db:generate` + `db:migrate` (not `db:push`) for production changes
- `db:push` is for prototyping only — it doesn't create migration files
- RLS policies are managed via Supabase Dashboard, not Drizzle (see `drizzle/rls-policies.sql`)
- The profile creation trigger (`drizzle/seed.sql`) references `auth.users` and is also managed outside Drizzle
- The runtime Drizzle client (`drizzle/index.ts`) uses the transaction pooler (`DATABASE_URL`) with `prepare: false`
- Drizzle Kit config (`drizzle.config.ts`) uses the session pooler (`DATABASE_URL_DIRECT`) for DDL operations

# Server Actions

- **File header:** `"use server";` is mandatory.
- **Auth guard pattern:** Every exported action that touches user-scoped data must start with:

```ts
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error("UNAUTHORIZED");   // or redirect("/login") if a page is calling it
```

Wrap this in a `requireUserId()` helper when an action file has more than 1–2 entry points.

- **Drizzle bypasses Supabase RLS** because the client uses a direct DB connection. ALL Drizzle queries MUST include explicit `eq(table.userId, user.id)` (or equivalent ownership predicate) in the `WHERE` clause. Never rely on RLS at the action layer.
- **Date serialization:** Drizzle returns `Date` objects for timestamp columns. Convert to ISO strings via `.toISOString()` before returning from server actions — otherwise the client receives stringified dates that break date math.
- **Unique constraint violations:** Catch them at the action and return a friendly error string (e.g., the `watchlist_user_tmdb_unique` constraint case).
- **`revalidatePath`/`revalidateTag`** after mutations that affect SSR pages. Page-level reads then refresh on next navigation.
- **No client imports allowed** — actions are server-only; importing `"client"`-prefixed modules will fail the build.

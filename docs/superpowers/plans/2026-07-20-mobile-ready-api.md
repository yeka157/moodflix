# Mobile-Ready API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Moodflix Next.js backend consumable by a future React Native (Expo) mobile app — bearer-token auth on all API routes plus REST endpoints for watchlist and notifications — with zero behavior change for the existing web app.

**Architecture:** Three-layer extract-and-wrap. Business logic moves from server actions into plain server modules (`lib/services/`) that take an explicit `userId`. Server actions become thin wrappers (cookie auth + `revalidatePath`) so the web app is untouched. New REST route handlers under `app/api/watchlist/` and `app/api/notifications/` wrap the same services with bearer-token auth. A single helper (`getApiUser`) accepts EITHER a Supabase session cookie (web) OR an `Authorization: Bearer <access_token>` header (mobile) on every existing and new API route.

**Tech Stack:** Next.js 16 App Router route handlers, Supabase Auth (`@supabase/supabase-js` — already installed), Drizzle ORM, zod v4 (already installed), Node script for integration smoke tests. **No new dependencies.**

**Out of scope (future mobile-app plan):** the Expo app itself, FCM/APNs push (schema change for device platform), profile/settings endpoints, migrating web hooks from server actions to REST, auth on `/api/movies/multi` (currently unauthenticated by design for the palette).

## Global Constraints

- Zero `any` — use `unknown` and narrow (`.claude/rules/typescript.md`).
- All shared types live in `types/` — never define exported types in route/component/hook files.
- Every API route handler MUST: auth-check via `getApiUser` → 401 on null, then rate-limit via `checkWindowedLimit(<prefix>:${user.id}, 60, 60_000)` → `rateLimitResponse(rate)` on exceeded (returns 429 + `Retry-After`).
- Every Drizzle query MUST include an explicit `eq(table.userId, userId)` ownership predicate — Drizzle bypasses RLS.
- Drizzle `Date` columns → ISO strings before crossing the network (`.toISOString()`).
- Unique-violation on `watchlist_user_tmdb_media_unique` → friendly error `"Already in library"` (409 from REST routes).
- Service modules in `lib/services/` are plain server modules — NO `"use server"` directive. Only `actions/*.ts` keeps `"use server"` and `revalidatePath`.
- Commit style: Conventional Commits (`feat:`, `refactor:`, `docs:`).
- Verification baseline for every task: `npm run build` and `npm run lint` pass.
- Smoke tests (`scripts/api-smoke.mjs`) need the dev server running on `localhost:3000` and a valid `.env.local` (uses `SUPABASE_SECRET_KEY` to create/delete a throwaway test user).

---

### Task 1: Bearer-or-cookie auth helper

**Files:**
- Create: `lib/supabase/api-auth.ts`

**Interfaces:**
- Consumes: `createClient` from `lib/supabase/server.ts` (existing cookie client), `createClient` from `@supabase/supabase-js`.
- Produces: `getApiUser(request: Request): Promise<User | null>` — every task below imports this exact signature from `@/lib/supabase/api-auth`.

- [ ] **Step 1: Write the helper**

Create `lib/supabase/api-auth.ts`:

```ts
import type { User } from "@supabase/supabase-js";
import { createClient as createBareClient } from "@supabase/supabase-js";
import { createClient as createCookieClient } from "@/lib/supabase/server";

/**
 * Resolves the authenticated user for an API route from EITHER:
 * 1. `Authorization: Bearer <supabase access token>` header (mobile clients), or
 * 2. the Supabase session cookie (web app).
 * Returns null when neither yields a valid user.
 */
export async function getApiUser(request: Request): Promise<User | null> {
  const authHeader = request.headers.get("authorization");

  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    if (!token) return null;

    const supabase = createBareClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data, error } = await supabase.auth.getUser(token);
    if (error) return null;
    return data.user;
  }

  const supabase = await createCookieClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
```

- [ ] **Step 2: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both pass (helper compiles, unused-export warnings do not exist in this config).

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/api-auth.ts
git commit -m "feat(api): add bearer-or-cookie auth helper for API routes"
```

---

### Task 2: Smoke-test script + switch all existing API routes to `getApiUser`

**Files:**
- Create: `scripts/api-smoke.mjs`
- Modify: `app/api/movies/route.ts:14-22`
- Modify: `app/api/movies/[id]/route.ts:7-18`
- Modify: `app/api/movies/[id]/recommendations/route.ts:6-17`
- Modify: `app/api/tv/route.ts:14-22`
- Modify: `app/api/tv/[id]/route.ts:7-18`
- Modify: `app/api/ai/recommend/route.ts:168-180`
- Modify: `app/api/notifications/subscribe/route.ts` (3 handlers: GET:7, POST:40, DELETE:90)
- Modify: `app/api/notifications/subscribed-ids/route.ts:7-15`
- Modify: `app/api/push/subscribe/route.ts` (2 handlers: POST:7, DELETE:59)

**Interfaces:**
- Consumes: `getApiUser(request: Request): Promise<User | null>` from Task 1.
- Produces: all 9 route files authenticate via bearer OR cookie; `scripts/api-smoke.mjs` with sections selectable by CLI arg (`bearer|watchlist|notifications|all`) — Tasks 4 and 6 append sections to this script.

- [ ] **Step 1: Write the smoke-test script (bearer section only — the failing test)**

Create `scripts/api-smoke.mjs`:

```js
// Integration smoke tests for the mobile-ready API (bearer-token auth).
// Usage: node scripts/api-smoke.mjs [bearer|watchlist|notifications|all]
// Requires: dev server on localhost:3000 and .env.local (SUPABASE_SECRET_KEY
// is used to create + delete a throwaway test user).
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const BASE_URL = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !anonKey || !secretKey) {
  console.error("Missing Supabase env vars — check .env.local");
  process.exit(1);
}

let failures = 0;
function check(name, cond, detail = "") {
  if (cond) console.log(`  ok   ${name}`);
  else {
    failures++;
    console.error(`  FAIL ${name} ${detail}`);
  }
}

async function req(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    // non-JSON response
  }
  return { status: res.status, json };
}

const admin = createClient(url, secretKey, {
  auth: { persistSession: false },
});
const email = `api-smoke-${Math.random().toString(36).slice(2)}@example.com`;
const password = `Smoke-${Math.random().toString(36).slice(2)}!1a`;

async function createTestUser() {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw new Error(`createUser failed: ${error.message}`);
  const anon = createClient(url, anonKey, {
    auth: { persistSession: false },
  });
  const { data: signIn, error: signInErr } =
    await anon.auth.signInWithPassword({ email, password });
  if (signInErr) throw new Error(`signIn failed: ${signInErr.message}`);
  return { userId: data.user.id, token: signIn.session.access_token };
}

async function deleteTestUser(userId) {
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) console.error(`WARN: test user cleanup failed: ${error.message}`);
}

async function testBearer(token) {
  console.log("bearer:");
  const noAuth = await req("/api/movies?category=trending");
  check("401 without token", noAuth.status === 401, `got ${noAuth.status}`);
  const withAuth = await req("/api/movies?category=trending", { token });
  check("200 with bearer token", withAuth.status === 200, `got ${withAuth.status}`);
}

const section = process.argv[2] ?? "all";
const { userId, token } = await createTestUser();
try {
  if (section === "bearer" || section === "all") await testBearer(token);
} finally {
  await deleteTestUser(userId);
}
if (failures > 0) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log("\nall checks passed");
```

- [ ] **Step 2: Run smoke test to verify it fails (bearer not yet accepted)**

```bash
npm run dev > /tmp/moodflix-dev.log 2>&1 &
echo $! > /tmp/moodflix-dev.pid
sleep 10
node scripts/api-smoke.mjs bearer
```

Expected: exit code 1 — `FAIL 200 with bearer token got 401` (cookie-only auth rejects the bearer header). The `401 without token` check should already pass. Leave the dev server running for Step 4.

- [ ] **Step 3: Switch all 9 route files to `getApiUser`**

Apply the same transformation to every handler listed in **Files** above. Canonical example (`app/api/movies/route.ts`):

Before:

```ts
import { createClient } from "@/lib/supabase/server";
// ...
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
```

After:

```ts
import { getApiUser } from "@/lib/supabase/api-auth";
// ...
export async function GET(request: NextRequest) {
  try {
    const user = await getApiUser(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
```

Per-file rules:

| File | Handlers | Notes |
| --- | --- | --- |
| `app/api/movies/route.ts` | GET | canonical example above |
| `app/api/movies/[id]/route.ts` | GET | same pattern |
| `app/api/movies/[id]/recommendations/route.ts` | GET | same pattern |
| `app/api/tv/route.ts` | GET | same pattern |
| `app/api/tv/[id]/route.ts` | GET | same pattern |
| `app/api/ai/recommend/route.ts` | POST | keeps its `"Authentication required"` 401 body; handler param is `request: Request` — works as-is |
| `app/api/notifications/subscribe/route.ts` | GET, POST, DELETE | uses `NextResponse.json` for the 401 — keep it; apply swap in all 3 handlers |
| `app/api/notifications/subscribed-ids/route.ts` | GET | handler is `export async function GET()` — change to `export async function GET(request: NextRequest)` and add `import { NextRequest } from "next/server";` |
| `app/api/push/subscribe/route.ts` | POST, DELETE | uses `NextResponse.json` — keep it; handlers already take `request: Request` |

In every file: delete the `import { createClient } from "@/lib/supabase/server";` line — after the swap no file in this table uses the cookie client for anything else (verify with a quick grep for `supabase.` in each file before deleting).

- [ ] **Step 4: Run smoke test to verify it passes**

```bash
node scripts/api-smoke.mjs bearer
kill $(cat /tmp/moodflix-dev.pid)
```

Expected: exit code 0 — both checks `ok`. (Turbopack recompiles routes on save; if the first request after editing is slow, rerun once.)

- [ ] **Step 5: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both pass.

- [ ] **Step 6: Commit**

```bash
git add scripts/api-smoke.mjs app/api
git commit -m "feat(api): accept bearer tokens on all API routes"
```

---

### Task 3: Extract watchlist service layer

**Files:**
- Create: `lib/services/watchlist.ts`
- Modify: `types/watchlist.ts` (append `WatchlistStats`)
- Modify: `actions/watchlist.ts` (full rewrite as thin wrappers)

**Interfaces:**
- Consumes: `db` from `@/drizzle`, `watchlist` table from `@/drizzle/schema`, types from `@/types/watchlist`.
- Produces (all exported from `@/lib/services/watchlist`, consumed by Task 4 and by `actions/watchlist.ts`):
  - `getWatchlist(userId: string, status?: WatchlistStatus): Promise<WatchlistItem[]>`
  - `getWatchlistStats(userId: string): Promise<WatchlistStats>`
  - `getWatchlistTmdbIds(userId: string): Promise<WatchlistTmdbEntry[]>`
  - `getWatchlistItemByTmdbId(userId: string, tmdbId: number, mediaType?: MediaType): Promise<WatchlistItem | null>`
  - `addToWatchlist(userId: string, data: AddToWatchlistInput): Promise<WatchlistActionResult>`
  - `removeFromWatchlist(userId: string, watchlistItemId: string): Promise<WatchlistDeleteResult>`
  - `updateWatchlistStatus(userId: string, id: string, status: WatchlistStatus): Promise<WatchlistActionResult>`
  - `rateWatchlistItem(userId: string, id: string, rating: 1 | -1 | null): Promise<WatchlistActionResult>`
  - `WatchlistStats` type moves to `@/types/watchlist`.

- [ ] **Step 1: Append `WatchlistStats` to `types/watchlist.ts`**

Add at the end of `types/watchlist.ts`:

```ts
export type WatchlistStats = {
  inLibrary: number;
  watched: number;
  thisYear: number;
};
```

- [ ] **Step 2: Create `lib/services/watchlist.ts`**

Logic copied verbatim from the current `actions/watchlist.ts`, with `userId` as an explicit first parameter, no auth, no `revalidatePath`, no `"use server"`:

```ts
import { db } from "@/drizzle";
import { watchlist } from "@/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import type {
  AddToWatchlistInput,
  WatchlistItem,
  WatchlistStatus,
  WatchlistActionResult,
  WatchlistDeleteResult,
  WatchlistTmdbEntry,
  WatchlistStats,
} from "@/types/watchlist";
import type { MediaType } from "@/types/media";

function serializeItem(row: typeof watchlist.$inferSelect): WatchlistItem {
  return {
    id: row.id,
    userId: row.userId,
    tmdbId: row.tmdbId,
    title: row.title,
    posterPath: row.posterPath,
    status: row.status ?? ("want_to_watch" as WatchlistStatus),
    rating: row.rating,
    mediaType: row.mediaType as MediaType,
    addedAt: row.addedAt?.toISOString() ?? new Date().toISOString(),
    watchedAt: row.watchedAt?.toISOString() ?? null,
  };
}

export async function getWatchlist(
  userId: string,
  status?: WatchlistStatus,
): Promise<WatchlistItem[]> {
  const conditions = status
    ? and(eq(watchlist.userId, userId), eq(watchlist.status, status))
    : eq(watchlist.userId, userId);

  const rows = await db
    .select()
    .from(watchlist)
    .where(conditions)
    .orderBy(desc(watchlist.addedAt));

  return rows.map(serializeItem);
}

export async function getWatchlistStats(
  userId: string,
): Promise<WatchlistStats> {
  const rows = await db
    .select({
      status: watchlist.status,
      watchedAt: watchlist.watchedAt,
    })
    .from(watchlist)
    .where(eq(watchlist.userId, userId));

  const currentYear = new Date().getFullYear();
  let inLibrary = 0;
  let watched = 0;
  let thisYear = 0;
  for (const r of rows) {
    if (r.status === "watched") {
      watched++;
      if (r.watchedAt && r.watchedAt.getFullYear() === currentYear) {
        thisYear++;
      }
    } else {
      inLibrary++;
    }
  }
  return { inLibrary, watched, thisYear };
}

export async function getWatchlistTmdbIds(
  userId: string,
): Promise<WatchlistTmdbEntry[]> {
  const rows = await db
    .select({
      id: watchlist.id,
      tmdbId: watchlist.tmdbId,
      status: watchlist.status,
      mediaType: watchlist.mediaType,
    })
    .from(watchlist)
    .where(eq(watchlist.userId, userId));

  return rows.map((r) => ({
    id: r.id,
    tmdbId: r.tmdbId,
    status: r.status ?? ("want_to_watch" as WatchlistStatus),
    mediaType: r.mediaType as MediaType,
  }));
}

export async function getWatchlistItemByTmdbId(
  userId: string,
  tmdbId: number,
  mediaType: MediaType = "movie",
): Promise<WatchlistItem | null> {
  const rows = await db
    .select()
    .from(watchlist)
    .where(
      and(
        eq(watchlist.userId, userId),
        eq(watchlist.tmdbId, tmdbId),
        eq(watchlist.mediaType, mediaType),
      ),
    )
    .limit(1);

  return rows.length > 0 ? serializeItem(rows[0]) : null;
}

export async function addToWatchlist(
  userId: string,
  data: AddToWatchlistInput,
): Promise<WatchlistActionResult> {
  try {
    const rows = await db
      .insert(watchlist)
      .values({
        userId,
        tmdbId: data.tmdbId,
        title: data.title,
        posterPath: data.posterPath,
        status: data.status ?? "want_to_watch",
        mediaType: data.mediaType ?? "movie",
      })
      .returning();

    return { item: serializeItem(rows[0]) };
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      err.message.includes("watchlist_user_tmdb_media_unique")
    ) {
      return { error: "Already in library" };
    }
    return { error: "Failed to add to library" };
  }
}

export async function removeFromWatchlist(
  userId: string,
  watchlistItemId: string,
): Promise<WatchlistDeleteResult> {
  try {
    await db
      .delete(watchlist)
      .where(
        and(eq(watchlist.id, watchlistItemId), eq(watchlist.userId, userId)),
      );

    return { success: true };
  } catch {
    return { error: "Failed to remove from library" };
  }
}

export async function updateWatchlistStatus(
  userId: string,
  id: string,
  status: WatchlistStatus,
): Promise<WatchlistActionResult> {
  try {
    const updateData: Record<string, unknown> = { status };
    if (status === "watched") {
      updateData.watchedAt = new Date();
    } else {
      updateData.watchedAt = null;
    }

    const rows = await db
      .update(watchlist)
      .set(updateData)
      .where(and(eq(watchlist.id, id), eq(watchlist.userId, userId)))
      .returning();

    if (rows.length === 0) return { error: "Item not found" };

    return { item: serializeItem(rows[0]) };
  } catch {
    return { error: "Failed to update status" };
  }
}

export async function rateWatchlistItem(
  userId: string,
  id: string,
  rating: 1 | -1 | null,
): Promise<WatchlistActionResult> {
  try {
    const rows = await db
      .update(watchlist)
      .set({ rating })
      .where(and(eq(watchlist.id, id), eq(watchlist.userId, userId)))
      .returning();

    if (rows.length === 0) return { error: "Item not found" };

    return { item: serializeItem(rows[0]) };
  } catch {
    return { error: "Failed to update rating" };
  }
}
```

- [ ] **Step 3: Rewrite `actions/watchlist.ts` as thin wrappers**

Replace the entire file content with:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import * as watchlistService from "@/lib/services/watchlist";
import type {
  AddToWatchlistInput,
  WatchlistItem,
  WatchlistStatus,
  WatchlistActionResult,
  WatchlistDeleteResult,
  WatchlistTmdbEntry,
  WatchlistStats,
} from "@/types/watchlist";
import type { MediaType } from "@/types/media";

async function getAuthUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getWatchlist(
  status?: WatchlistStatus,
): Promise<WatchlistItem[]> {
  const userId = await getAuthUserId();
  if (!userId) return [];
  return watchlistService.getWatchlist(userId, status);
}

export async function getWatchlistStats(): Promise<WatchlistStats> {
  const userId = await getAuthUserId();
  if (!userId) return { inLibrary: 0, watched: 0, thisYear: 0 };
  return watchlistService.getWatchlistStats(userId);
}

export async function getWatchlistTmdbIds(): Promise<WatchlistTmdbEntry[]> {
  const userId = await getAuthUserId();
  if (!userId) return [];
  return watchlistService.getWatchlistTmdbIds(userId);
}

export async function getWatchlistItemByTmdbId(
  tmdbId: number,
  mediaType: MediaType = "movie",
): Promise<WatchlistItem | null> {
  const userId = await getAuthUserId();
  if (!userId) return null;
  return watchlistService.getWatchlistItemByTmdbId(userId, tmdbId, mediaType);
}

export async function addToWatchlist(
  data: AddToWatchlistInput,
): Promise<WatchlistActionResult> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated" };
  const result = await watchlistService.addToWatchlist(userId, data);
  if (result.item) revalidatePath("/library");
  return result;
}

export async function removeFromWatchlist(
  watchlistItemId: string,
): Promise<WatchlistDeleteResult> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated" };
  const result = await watchlistService.removeFromWatchlist(
    userId,
    watchlistItemId,
  );
  if (result.success) revalidatePath("/library");
  return result;
}

export async function updateWatchlistStatus(
  id: string,
  status: WatchlistStatus,
): Promise<WatchlistActionResult> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated" };
  const result = await watchlistService.updateWatchlistStatus(
    userId,
    id,
    status,
  );
  if (result.item) revalidatePath("/library");
  return result;
}

export async function rateWatchlistItem(
  id: string,
  rating: 1 | -1 | null,
): Promise<WatchlistActionResult> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated" };
  const result = await watchlistService.rateWatchlistItem(userId, id, rating);
  if (result.item) revalidatePath("/library");
  return result;
}
```

Note: the old file exported `export type WatchlistStats` — the only consumer of the *type* was this file itself (verified: `app/(app)/home/page.tsx` imports only the `getWatchlistStats` function). The type now lives in `types/watchlist.ts`; no other imports to update.

- [ ] **Step 4: Verify pure refactor**

Run: `npm run build && npm run lint`
Expected: both pass. This task changes no behavior — web components keep calling the same action signatures.

- [ ] **Step 5: Commit**

```bash
git add lib/services/watchlist.ts actions/watchlist.ts types/watchlist.ts
git commit -m "refactor(watchlist): extract service layer from server actions"
```

---

### Task 4: Watchlist REST endpoints

**Files:**
- Create: `app/api/watchlist/route.ts` (GET list, POST add)
- Create: `app/api/watchlist/[id]/route.ts` (PATCH status/rating, DELETE)
- Create: `app/api/watchlist/stats/route.ts` (GET)
- Create: `app/api/watchlist/ids/route.ts` (GET)
- Create: `app/api/watchlist/lookup/route.ts` (GET by tmdbId+mediaType)
- Modify: `scripts/api-smoke.mjs` (append watchlist section)

**Interfaces:**
- Consumes: `getApiUser` (Task 1), all `watchlistService` functions (Task 3), `checkWindowedLimit`/`rateLimitResponse` from `@/lib/rate-limit`.
- Produces (mobile API contract):
  - `GET /api/watchlist?status=want_to_watch|watched` → `200 { items: WatchlistItem[] }`
  - `POST /api/watchlist` body `AddToWatchlistInput` → `201 { item }` | `409 { error: "Already in library" }` | `400`
  - `PATCH /api/watchlist/:id` body `{ status?, rating? }` → `200 { item }` | `404` | `400`
  - `DELETE /api/watchlist/:id` → `200 { success: true }`
  - `GET /api/watchlist/stats` → `200 WatchlistStats`
  - `GET /api/watchlist/ids` → `200 { entries: WatchlistTmdbEntry[] }`
  - `GET /api/watchlist/lookup?tmdbId=..&mediaType=..` → `200 { item: WatchlistItem | null }`

- [ ] **Step 1: Append the failing watchlist section to `scripts/api-smoke.mjs`**

Insert after `testBearer` and register in the runner:

```js
async function testWatchlist(token) {
  console.log("watchlist:");
  const unauth = await req("/api/watchlist");
  check("401 without token", unauth.status === 401, `got ${unauth.status}`);

  const added = await req("/api/watchlist", {
    method: "POST",
    token,
    body: { tmdbId: 27205, title: "Inception", posterPath: null, mediaType: "movie" },
  });
  check(
    "POST add returns 201 + item",
    added.status === 201 && added.json?.item?.tmdbId === 27205,
    `got ${added.status} ${JSON.stringify(added.json)}`,
  );

  const dup = await req("/api/watchlist", {
    method: "POST",
    token,
    body: { tmdbId: 27205, title: "Inception", posterPath: null, mediaType: "movie" },
  });
  check("duplicate add returns 409", dup.status === 409, `got ${dup.status}`);

  const badBody = await req("/api/watchlist", {
    method: "POST",
    token,
    body: { tmdbId: "not-a-number" },
  });
  check("invalid body returns 400", badBody.status === 400, `got ${badBody.status}`);

  const list = await req("/api/watchlist", { token });
  check(
    "GET list contains item",
    list.status === 200 && list.json?.items?.length === 1,
    `got ${list.status}`,
  );

  const lookup = await req("/api/watchlist/lookup?tmdbId=27205&mediaType=movie", { token });
  check(
    "GET lookup finds item",
    lookup.status === 200 && lookup.json?.item?.tmdbId === 27205,
    `got ${lookup.status}`,
  );

  const id = added.json?.item?.id;
  const patched = await req(`/api/watchlist/${id}`, {
    method: "PATCH",
    token,
    body: { status: "watched", rating: 1 },
  });
  check(
    "PATCH status+rating",
    patched.status === 200 &&
      patched.json?.item?.status === "watched" &&
      patched.json?.item?.rating === 1,
    `got ${patched.status} ${JSON.stringify(patched.json)}`,
  );

  const badPatch = await req(`/api/watchlist/${id}`, {
    method: "PATCH",
    token,
    body: { rating: 5 },
  });
  check("PATCH invalid rating 400", badPatch.status === 400, `got ${badPatch.status}`);

  const stats = await req("/api/watchlist/stats", { token });
  check(
    "GET stats watched=1",
    stats.status === 200 && stats.json?.watched === 1,
    `got ${stats.status} ${JSON.stringify(stats.json)}`,
  );

  const ids = await req("/api/watchlist/ids", { token });
  check(
    "GET ids returns entry",
    ids.status === 200 && ids.json?.entries?.length === 1,
    `got ${ids.status}`,
  );

  const missingPatch = await req(
    "/api/watchlist/00000000-0000-0000-0000-000000000000",
    { method: "PATCH", token, body: { rating: 1 } },
  );
  check("PATCH unknown id 404", missingPatch.status === 404, `got ${missingPatch.status}`);

  const deleted = await req(`/api/watchlist/${id}`, { method: "DELETE", token });
  check("DELETE returns 200", deleted.status === 200, `got ${deleted.status}`);

  const empty = await req("/api/watchlist", { token });
  check(
    "list empty after delete",
    empty.status === 200 && empty.json?.items?.length === 0,
    `got ${empty.status}`,
  );
}
```

And in the runner block add:

```js
  if (section === "watchlist" || section === "all") await testWatchlist(token);
```

- [ ] **Step 2: Run to verify it fails**

```bash
npm run dev > /tmp/moodflix-dev.log 2>&1 &
echo $! > /tmp/moodflix-dev.pid
sleep 10
node scripts/api-smoke.mjs watchlist
```

Expected: exit 1 — every check fails with 404 (routes don't exist). Leave the server running.

- [ ] **Step 3: Create `app/api/watchlist/route.ts`**

```ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { getApiUser } from "@/lib/supabase/api-auth";
import { checkWindowedLimit, rateLimitResponse } from "@/lib/rate-limit";
import * as watchlistService from "@/lib/services/watchlist";

const addSchema = z.object({
  tmdbId: z.number().int().positive(),
  title: z.string().min(1).max(500),
  posterPath: z.string().nullable(),
  status: z.enum(["want_to_watch", "watched"]).optional(),
  mediaType: z.enum(["movie", "tv"]).optional(),
});

export async function GET(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rate = checkWindowedLimit(`watchlist:${user.id}`, 60, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);

  const statusParam = request.nextUrl.searchParams.get("status");
  const status =
    statusParam === "want_to_watch" || statusParam === "watched"
      ? statusParam
      : undefined;

  const items = await watchlistService.getWatchlist(user.id, status);
  return Response.json({ items });
}

export async function POST(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rate = checkWindowedLimit(`watchlist:${user.id}`, 60, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);

  const body: unknown = await request.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const result = await watchlistService.addToWatchlist(user.id, parsed.data);
  if (result.error) {
    const status = result.error === "Already in library" ? 409 : 500;
    return Response.json({ error: result.error }, { status });
  }
  return Response.json({ item: result.item }, { status: 201 });
}
```

- [ ] **Step 4: Create `app/api/watchlist/[id]/route.ts`**

```ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { getApiUser } from "@/lib/supabase/api-auth";
import { checkWindowedLimit, rateLimitResponse } from "@/lib/rate-limit";
import * as watchlistService from "@/lib/services/watchlist";
import type { WatchlistActionResult } from "@/types/watchlist";

const patchSchema = z
  .object({
    status: z.enum(["want_to_watch", "watched"]).optional(),
    rating: z.union([z.literal(1), z.literal(-1), z.null()]).optional(),
  })
  .refine((v) => v.status !== undefined || v.rating !== undefined, {
    message: "status or rating required",
  });

function errorResponse(message: string): Response {
  return Response.json(
    { error: message },
    { status: message === "Item not found" ? 404 : 500 },
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rate = checkWindowedLimit(`watchlist:${user.id}`, 60, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);

  const { id } = await params;
  const body: unknown = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  let result: WatchlistActionResult | null = null;
  if (parsed.data.status !== undefined) {
    result = await watchlistService.updateWatchlistStatus(
      user.id,
      id,
      parsed.data.status,
    );
    if (result.error) return errorResponse(result.error);
  }
  if (parsed.data.rating !== undefined) {
    result = await watchlistService.rateWatchlistItem(
      user.id,
      id,
      parsed.data.rating,
    );
    if (result.error) return errorResponse(result.error);
  }

  return Response.json({ item: result?.item });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rate = checkWindowedLimit(`watchlist:${user.id}`, 60, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);

  const { id } = await params;
  const result = await watchlistService.removeFromWatchlist(user.id, id);
  if (result.error) {
    return Response.json({ error: result.error }, { status: 500 });
  }
  return Response.json({ success: true });
}
```

- [ ] **Step 5: Create the three small GET routes**

`app/api/watchlist/stats/route.ts`:

```ts
import { NextRequest } from "next/server";
import { getApiUser } from "@/lib/supabase/api-auth";
import { checkWindowedLimit, rateLimitResponse } from "@/lib/rate-limit";
import * as watchlistService from "@/lib/services/watchlist";

export async function GET(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rate = checkWindowedLimit(`watchlist:${user.id}`, 60, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);

  const stats = await watchlistService.getWatchlistStats(user.id);
  return Response.json(stats);
}
```

`app/api/watchlist/ids/route.ts`:

```ts
import { NextRequest } from "next/server";
import { getApiUser } from "@/lib/supabase/api-auth";
import { checkWindowedLimit, rateLimitResponse } from "@/lib/rate-limit";
import * as watchlistService from "@/lib/services/watchlist";

export async function GET(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rate = checkWindowedLimit(`watchlist:${user.id}`, 60, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);

  const entries = await watchlistService.getWatchlistTmdbIds(user.id);
  return Response.json({ entries });
}
```

`app/api/watchlist/lookup/route.ts`:

```ts
import { NextRequest } from "next/server";
import { getApiUser } from "@/lib/supabase/api-auth";
import { checkWindowedLimit, rateLimitResponse } from "@/lib/rate-limit";
import * as watchlistService from "@/lib/services/watchlist";

export async function GET(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rate = checkWindowedLimit(`watchlist:${user.id}`, 60, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);

  const tmdbId = Number(request.nextUrl.searchParams.get("tmdbId"));
  const mediaTypeParam = request.nextUrl.searchParams.get("mediaType");
  const mediaType = mediaTypeParam === "tv" ? "tv" : "movie";

  if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
    return Response.json({ error: "Invalid tmdbId" }, { status: 400 });
  }

  const item = await watchlistService.getWatchlistItemByTmdbId(
    user.id,
    tmdbId,
    mediaType,
  );
  return Response.json({ item });
}
```

- [ ] **Step 6: Run smoke test to verify it passes**

```bash
node scripts/api-smoke.mjs watchlist
kill $(cat /tmp/moodflix-dev.pid)
```

Expected: exit 0, all watchlist checks `ok`.

- [ ] **Step 7: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both pass.

- [ ] **Step 8: Commit**

```bash
git add app/api/watchlist scripts/api-smoke.mjs
git commit -m "feat(api): add watchlist REST endpoints for mobile clients"
```

---

### Task 5: Extract notifications service layer

**Files:**
- Create: `lib/services/notifications.ts`
- Modify: `actions/notifications.ts` (full rewrite as thin wrappers)

**Interfaces:**
- Consumes: `db`, `notifications` table, types from `@/types/notification`.
- Produces (exported from `@/lib/services/notifications`, consumed by Task 6 and `actions/notifications.ts`):
  - `listNotifications(userId: string, opts?: { cursor?: string | null; limit?: number }): Promise<NotificationListPage>`
  - `getUnreadCount(userId: string): Promise<number>`
  - `markAllAsRead(userId: string): Promise<void>`
  - `markVisibleAsRead(userId: string, ids: string[]): Promise<void>`
  - Note: the old single-id `markAsRead` is served by `markVisibleAsRead(userId, [id])` — identical semantics (same WHERE: owner + unread + id match).

- [ ] **Step 1: Create `lib/services/notifications.ts`**

```ts
import { and, desc, eq, inArray, isNull, lt, sql } from "drizzle-orm";

import { db } from "@/drizzle";
import { notifications } from "@/drizzle/schema";
import type {
  Notification,
  NotificationListPage,
  NotificationType,
} from "@/types/notification";

const PAGE_SIZE = 20;
type MediaTypeNullable = "movie" | "tv" | null;

function mapRow(row: typeof notifications.$inferSelect): Notification {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    posterPath: row.posterPath,
    href: row.href,
    tmdbId: row.tmdbId,
    mediaType: row.mediaType as MediaTypeNullable,
    readAt: row.readAt ? row.readAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listNotifications(
  userId: string,
  opts?: {
    cursor?: string | null;
    limit?: number;
  },
): Promise<NotificationListPage> {
  const limit = Math.min(opts?.limit ?? PAGE_SIZE, 50);
  const cursorDate = opts?.cursor ? new Date(opts.cursor) : null;

  const rows = await db
    .select()
    .from(notifications)
    .where(
      cursorDate
        ? and(
            eq(notifications.userId, userId),
            lt(notifications.createdAt, cursorDate),
          )
        : eq(notifications.userId, userId),
    )
    .orderBy(desc(notifications.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = (hasMore ? rows.slice(0, limit) : rows).map(mapRow);
  const nextCursor =
    hasMore && items.length > 0 ? items[items.length - 1].createdAt : null;

  return { items, nextCursor };
}

export async function getUnreadCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), isNull(notifications.readAt)),
    );
  return row?.count ?? 0;
}

export async function markAllAsRead(userId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(eq(notifications.userId, userId), isNull(notifications.readAt)),
    );
}

export async function markVisibleAsRead(
  userId: string,
  ids: string[],
): Promise<void> {
  if (ids.length === 0) return;
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.userId, userId),
        inArray(notifications.id, ids),
        isNull(notifications.readAt),
      ),
    );
}
```

- [ ] **Step 2: Rewrite `actions/notifications.ts` as thin wrappers**

Replace the entire file content with:

```ts
"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import * as notificationsService from "@/lib/services/notifications";
import type { NotificationListPage } from "@/types/notification";

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user.id;
}

export async function listNotifications(opts?: {
  cursor?: string | null;
  limit?: number;
}): Promise<NotificationListPage> {
  const userId = await requireUserId();
  return notificationsService.listNotifications(userId, opts);
}

export async function getUnreadCount(): Promise<number> {
  const userId = await requireUserId();
  return notificationsService.getUnreadCount(userId);
}

export async function markAsRead(notificationId: string): Promise<void> {
  const userId = await requireUserId();
  await notificationsService.markVisibleAsRead(userId, [notificationId]);
  revalidatePath("/notifications");
}

export async function markAllAsRead(): Promise<void> {
  const userId = await requireUserId();
  await notificationsService.markAllAsRead(userId);
  revalidatePath("/notifications");
}

export async function markVisibleAsRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const userId = await requireUserId();
  await notificationsService.markVisibleAsRead(userId, ids);
  revalidatePath("/notifications");
}
```

- [ ] **Step 3: Verify pure refactor**

Run: `npm run build && npm run lint`
Expected: both pass — action signatures unchanged, `hooks/use-notifications.ts` untouched.

- [ ] **Step 4: Commit**

```bash
git add lib/services/notifications.ts actions/notifications.ts
git commit -m "refactor(notifications): extract service layer from server actions"
```

---

### Task 6: Notifications REST endpoints

**Files:**
- Create: `app/api/notifications/route.ts` (GET list — does NOT clash with existing `subscribe/` and `subscribed-ids/` subroutes)
- Create: `app/api/notifications/unread-count/route.ts` (GET)
- Create: `app/api/notifications/read/route.ts` (POST)
- Modify: `scripts/api-smoke.mjs` (append notifications section)

**Interfaces:**
- Consumes: `getApiUser` (Task 1), `notificationsService` (Task 5), rate-limit helpers.
- Produces (mobile API contract):
  - `GET /api/notifications?cursor=<ISO>&limit=20` → `200 NotificationListPage`
  - `GET /api/notifications/unread-count` → `200 { count: number }`
  - `POST /api/notifications/read` body `{ ids?: string[]; all?: boolean }` (at least one) → `200 { success: true }` | `400`

- [ ] **Step 1: Append the failing notifications section to `scripts/api-smoke.mjs`**

Insert after `testWatchlist` and register in the runner:

```js
async function testNotifications(token) {
  console.log("notifications:");
  const unauth = await req("/api/notifications");
  check("401 without token", unauth.status === 401, `got ${unauth.status}`);

  const list = await req("/api/notifications", { token });
  check(
    "GET list shape",
    list.status === 200 &&
      Array.isArray(list.json?.items) &&
      "nextCursor" in (list.json ?? {}),
    `got ${list.status} ${JSON.stringify(list.json)}`,
  );

  const count = await req("/api/notifications/unread-count", { token });
  check(
    "GET unread-count = 0 for fresh user",
    count.status === 200 && count.json?.count === 0,
    `got ${count.status} ${JSON.stringify(count.json)}`,
  );

  const markAll = await req("/api/notifications/read", {
    method: "POST",
    token,
    body: { all: true },
  });
  check("POST read all", markAll.status === 200, `got ${markAll.status}`);

  const markIds = await req("/api/notifications/read", {
    method: "POST",
    token,
    body: { ids: ["00000000-0000-0000-0000-000000000000"] },
  });
  check("POST read ids (no-op ok)", markIds.status === 200, `got ${markIds.status}`);

  const badBody = await req("/api/notifications/read", {
    method: "POST",
    token,
    body: {},
  });
  check("POST read empty body 400", badBody.status === 400, `got ${badBody.status}`);
}
```

And in the runner block add:

```js
  if (section === "notifications" || section === "all") await testNotifications(token);
```

- [ ] **Step 2: Run to verify it fails**

```bash
npm run dev > /tmp/moodflix-dev.log 2>&1 &
echo $! > /tmp/moodflix-dev.pid
sleep 10
node scripts/api-smoke.mjs notifications
```

Expected: exit 1 — list/count/read checks fail with 404. Leave the server running.

- [ ] **Step 3: Create `app/api/notifications/route.ts`**

```ts
import { NextRequest } from "next/server";
import { getApiUser } from "@/lib/supabase/api-auth";
import { checkWindowedLimit, rateLimitResponse } from "@/lib/rate-limit";
import * as notificationsService from "@/lib/services/notifications";

export async function GET(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rate = checkWindowedLimit(`notifications:${user.id}`, 60, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);

  const cursor = request.nextUrl.searchParams.get("cursor");
  const limitParam = Number(request.nextUrl.searchParams.get("limit"));
  const limit =
    Number.isInteger(limitParam) && limitParam > 0 ? limitParam : undefined;

  const page = await notificationsService.listNotifications(user.id, {
    cursor,
    limit,
  });
  return Response.json(page);
}
```

- [ ] **Step 4: Create `app/api/notifications/unread-count/route.ts`**

```ts
import { NextRequest } from "next/server";
import { getApiUser } from "@/lib/supabase/api-auth";
import { checkWindowedLimit, rateLimitResponse } from "@/lib/rate-limit";
import * as notificationsService from "@/lib/services/notifications";

export async function GET(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rate = checkWindowedLimit(`notifications:${user.id}`, 60, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);

  const count = await notificationsService.getUnreadCount(user.id);
  return Response.json({ count });
}
```

- [ ] **Step 5: Create `app/api/notifications/read/route.ts`**

```ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { getApiUser } from "@/lib/supabase/api-auth";
import { checkWindowedLimit, rateLimitResponse } from "@/lib/rate-limit";
import * as notificationsService from "@/lib/services/notifications";

const readSchema = z
  .object({
    ids: z.array(z.string().uuid()).min(1).max(100).optional(),
    all: z.literal(true).optional(),
  })
  .refine((v) => v.ids !== undefined || v.all === true, {
    message: "ids or all required",
  });

export async function POST(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rate = checkWindowedLimit(`notifications:${user.id}`, 60, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);

  const body: unknown = await request.json().catch(() => null);
  const parsed = readSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  if (parsed.data.all) {
    await notificationsService.markAllAsRead(user.id);
  } else {
    await notificationsService.markVisibleAsRead(user.id, parsed.data.ids!);
  }
  return Response.json({ success: true });
}
```

- [ ] **Step 6: Run smoke test to verify it passes**

```bash
node scripts/api-smoke.mjs notifications
kill $(cat /tmp/moodflix-dev.pid)
```

Expected: exit 0, all notifications checks `ok`.

- [ ] **Step 7: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both pass.

- [ ] **Step 8: Commit**

```bash
git add app/api/notifications scripts/api-smoke.mjs
git commit -m "feat(api): add notifications REST endpoints for mobile clients"
```

---

### Task 7: Docs + full-suite verification

**Files:**
- Modify: `CLAUDE.md` (Route Structure + Key Directories sections)

**Interfaces:**
- Consumes: everything above.
- Produces: documented mobile API surface; green full smoke run.

- [ ] **Step 1: Full smoke run**

```bash
npm run dev > /tmp/moodflix-dev.log 2>&1 &
echo $! > /tmp/moodflix-dev.pid
sleep 10
node scripts/api-smoke.mjs all
kill $(cat /tmp/moodflix-dev.pid)
```

Expected: exit 0 — bearer + watchlist + notifications sections all `ok`.

- [ ] **Step 2: Update `CLAUDE.md`**

In the **Route Structure** section, after the line `- app/api/ai/recommend/ — Streaming AI recommendation endpoint`, add:

```markdown
- `app/api/watchlist/` — Watchlist REST API (list/add, `[id]` patch/delete, `stats`, `ids`, `lookup`) — bearer or cookie auth, consumed by mobile clients
- `app/api/notifications/` — Inbox REST API (list, `unread-count`, `read`) alongside existing `subscribe`/`subscribed-ids`
```

In the **Key Directories → Data + hooks** section, after the `lib/supabase/{client,server,middleware}.ts` line, add:

```markdown
- `lib/supabase/api-auth.ts` — `getApiUser(request)`: bearer-token OR cookie auth for API routes (mobile + web)
- `lib/services/` — Shared business logic (watchlist, notifications) taking explicit `userId`; wrapped by both server actions (web) and REST routes (mobile)
```

In the **Commands** section, after the `npm run db:studio` line, add:

```markdown
node scripts/api-smoke.mjs [bearer|watchlist|notifications|all]  # API integration smoke tests (dev server must be running)
```

- [ ] **Step 3: Final build + lint**

Run: `npm run build && npm run lint`
Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document mobile-ready API surface and smoke tests"
```

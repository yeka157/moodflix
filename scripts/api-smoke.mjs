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

const section = process.argv[2] ?? "all";
const { userId, token } = await createTestUser();
try {
  if (section === "bearer" || section === "all") await testBearer(token);
  if (section === "watchlist" || section === "all") await testWatchlist(token);
  if (section === "notifications" || section === "all") await testNotifications(token);
} finally {
  await deleteTestUser(userId);
}
if (failures > 0) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log("\nall checks passed");

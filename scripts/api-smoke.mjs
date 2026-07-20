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

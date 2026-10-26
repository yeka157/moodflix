import assert from "node:assert/strict";
import { test } from "node:test";
import { convertToModelMessages } from "ai";
import {
  addRecent,
  clearRecent,
  getRecent,
} from "../components/search/search-recent";
import { chatRequestSchema } from "../lib/chat-request";
import { isPublicPushAddress } from "../lib/push-network";
import {
  isAllowedPushEndpoint,
  pushSubscriptionSchema,
  releaseSubscriptionSchema,
} from "../lib/push-policy";
import { makeQueryClient } from "../lib/query-client";
import { scrubSentryRequest } from "../lib/sentry-privacy";

const userMessage = {
  id: "u1",
  parts: [{ text: "Something uplifting", type: "text" }],
  role: "user",
};

test("chat rejects files in new and historical messages, malformed parts and forged roles", () => {
  for (const role of ["user", "assistant"]) {
    for (const url of [
      "http://127.0.0.1/admin",
      "http://169.254.169.254/",
      "https://example.com/file",
      "data:text/plain,secret",
    ]) {
      assert.equal(
        chatRequestSchema.safeParse({
          messages: [
            { parts: [{ mediaType: "text/plain", type: "file", url }], role },
            userMessage,
          ],
        }).success,
        false
      );
    }
  }
  for (const message of [
    null,
    {},
    { parts: [], role: "system" },
    { parts: [null], role: "user" },
    { parts: [{ text: "x".repeat(501), type: "text" }], role: "user" },
    {
      parts: [
        {
          state: "output-available",
          toolCallId: "t1",
          type: "tool-identify_media",
        },
      ],
      role: "user",
    },
  ]) {
    assert.equal(
      chatRequestSchema.safeParse({ messages: [message, userMessage] }).success,
      false
    );
  }
});

test("normal text chat and both existing tool histories still convert through the real AI SDK", async () => {
  for (const type of ["tool-suggest_genres", "tool-identify_media"]) {
    const result = chatRequestSchema.parse({
      messages: [
        userMessage,
        {
          id: "a1",
          parts: [
            { type: "step-start" },
            {
              input: {},
              output: { genres: [], matches: [] },
              state: "output-available",
              toolCallId: "t1",
              type,
            },
            { text: "Here are some options.", type: "text" },
          ],
          role: "assistant",
        },
        userMessage,
      ],
    });
    // biome-ignore lint/performance/noAwaitInLoops: sequential assertions for the two supported tool types
    const converted = await convertToModelMessages(
      result.messages as Parameters<typeof convertToModelMessages>[0]
    );
    assert.ok(converted.some((message) => message.role === "tool"));
    assert.equal(converted.at(-1)?.role, "user");
  }
});

test("push allowlist accepts supported services and rejects destination bypasses", () => {
  for (const endpoint of [
    "https://fcm.googleapis.com/fcm/send/token",
    "https://updates.push.services.mozilla.com/wpush/v2/token",
    "https://web.push.apple.com/token",
    "https://wns2.notify.windows.com/token",
  ]) {
    assert.equal(isAllowedPushEndpoint(endpoint), true, endpoint);
  }
  for (const endpoint of [
    "http://fcm.googleapis.com/token",
    "https://fcm.googleapis.com:8443/token",
    "https://fcm.googleapis.com.evil.test/token",
    "https://evilpush.apple.com/token",
    "https://fcm.googleapis.com@evil.test/token",
    "https://user:password@fcm.googleapis.com/token",
    "https://127.0.0.1/token",
    "https://[::1]/",
    "https://169.254.169.254/",
    "https://example.com/token",
    "not-a-url",
  ]) {
    assert.equal(isAllowedPushEndpoint(endpoint), false, endpoint);
  }
});

test("actual socket address policy rejects local, metadata, mapped and reserved addresses", () => {
  for (const address of [
    "127.0.0.1",
    "10.0.0.1",
    "172.16.0.1",
    "192.168.1.1",
    "169.254.169.254",
    "100.100.100.200",
    "0.0.0.0",
    "224.0.0.1",
    "::1",
    "::ffff:127.0.0.1",
    "fc00::1",
    "fe80::1",
    "2001:db8::1",
    "2002:7f00:1::",
    "invalid",
  ]) {
    assert.equal(isPublicPushAddress(address), false, address);
  }
  assert.equal(isPublicPushAddress("8.8.8.8"), true);
  assert.equal(isPublicPushAddress("2606:4700:4700::1111"), true);
});

test("subscription schemas reject malformed inputs and strip forged release metadata", () => {
  assert.equal(
    pushSubscriptionSchema.safeParse({ endpoint: 123, keys: {} }).success,
    false
  );
  assert.equal(
    pushSubscriptionSchema.safeParse({
      endpoint: "https://fcm.googleapis.com/token",
      keys: { auth: "y", p256dh: "x" },
    }).success,
    false
  );
  assert.equal(
    pushSubscriptionSchema.safeParse({
      endpoint: "https://fcm.googleapis.com/token",
      keys: { auth: "y".repeat(22), p256dh: "x".repeat(87) },
    }).success,
    true
  );
  assert.deepEqual(
    releaseSubscriptionSchema.parse({
      releaseDate: "2026-09-29",
      title: "forged",
      tmdbId: 123,
    }),
    { tmdbId: 123 }
  );
  for (const tmdbId of [-1, 0, 0.5, "123", 2 ** 32]) {
    assert.equal(
      releaseSubscriptionSchema.safeParse({ tmdbId }).success,
      false
    );
  }
});

test("telemetry scrubber removes all credential casing, bodies, cookies and query secrets", () => {
  const result = scrubSentryRequest({
    message: "Useful error",
    request: {
      cookies: { session: "secret" },
      data: { password: "secret" },
      headers: { Authorization: "Bearer secret", COOKIE: "session=secret" },
      method: "GET",
      query_string: "token=secret",
      url: "https://user:secret@example.com/home?mood=private#secret",
    },
    user: { email: "private@example.com", ip_address: "127.0.0.1" },
  });
  assert.equal(result.request.url, "https://example.com/home");
  assert.equal(result.request.method, "GET");
  assert.equal(result.message, "Useful error");
  assert.equal(JSON.stringify(result).includes("secret"), false);
  assert.equal(JSON.stringify(result).includes("private"), false);
});

test("recent searches stay account-scoped, legacy entries are removed, logout clears only that account", () => {
  const storage = new Map<string, string>([
    ["moodflix:search:recent", '[{"q":"legacy private query","ts":1}]'],
  ]);
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        removeItem: (key: string) => storage.delete(key),
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    },
  });
  try {
    addRecent("account-a", "private search");
    assert.deepEqual(getRecent("account-b"), []);
    assert.equal(getRecent("account-a")[0].q, "private search");
    assert.equal(storage.has("moodflix:search:recent"), false);
    addRecent("account-b", "B search");
    clearRecent("account-a");
    assert.deepEqual(getRecent("account-a"), []);
    assert.equal(getRecent("account-b")[0].q, "B search");
  } finally {
    Reflect.deleteProperty(globalThis, "window");
  }
});

test("separate account clients isolate cache data and late completions", async () => {
  const accountA = makeQueryClient();
  const accountB = makeQueryClient();
  let finish: (value: string[]) => void = () => {
    throw new Error("Query has not started");
  };
  const pending = accountA.fetchQuery({
    queryFn: () =>
      new Promise<string[]>((resolve) => {
        finish = resolve;
      }),
    queryKey: ["watchlist"],
  });
  accountB.setQueryData(["watchlist"], ["B movie"]);
  finish(["A private movie"]);
  await pending;
  assert.deepEqual(accountB.getQueryData(["watchlist"]), ["B movie"]);
  accountA.clear();
  accountB.clear();
});

test("blocked browser storage does not interrupt account cleanup", () => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      get localStorage() {
        throw new Error("Storage denied by browser policy");
      },
    },
  });
  try {
    assert.deepEqual(getRecent("account-a"), []);
    assert.doesNotThrow(() => addRecent("account-a", "query"));
    assert.doesNotThrow(() => clearRecent("account-a"));
  } finally {
    Reflect.deleteProperty(globalThis, "window");
  }
});

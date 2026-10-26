import assert from "node:assert/strict";
import { test } from "node:test";
import { loadRoute, Rows } from "./route-harness";

const devices = Array.from({ length: 5 }, (_, id) => ({
  auth: "y".repeat(22),
  endpoint: `https://fcm.googleapis.com/${id}`,
  id: String(id),
  p256dh: "x".repeat(87),
}));
const pushBody = {
  endpoint: "https://fcm.googleapis.com/new",
  keys: { auth: "y".repeat(22), p256dh: "x".repeat(87) },
};
function post(body: unknown) {
  return new Request("https://moodflix.test/api", {
    body: JSON.stringify(body),
    method: "POST",
  });
}

test("push registration enforces the cap inside a locked transaction, but allows existing devices", async () => {
  let writes = 0;
  let locks = 0;
  let selects = 0;
  const tx = {
    insert: () => ({
      values: () => ({
        onConflictDoUpdate: () => {
          writes += 1;
        },
      }),
    }),
    select() {
      selects += 1;
      if (selects % 2 === 1) {
        return {
          from: () => ({
            where: () => ({
              for: () => {
                locks += 1;
                return [{ id: "u" }];
              },
            }),
          }),
        };
      }
      return new Rows(devices);
    },
  };
  const { route, cleanup } = await loadRoute<
    typeof import("../app/api/push/subscribe/route")
  >("app/api/push/subscribe/route.ts", {
    db: {
      transaction: (callback: (client: typeof tx) => unknown) => callback(tx),
    },
    getApiUser: () => Promise.resolve({ id: "u" }),
  });
  try {
    assert.equal((await route.POST(post(pushBody))).status, 409);
    assert.equal(writes, 0);
    assert.equal(
      (await route.POST(post({ ...pushBody, endpoint: devices[0].endpoint })))
        .status,
      200
    );
    assert.equal(writes, 1);
    assert.equal(locks, 2);
    assert.equal(
      (await route.POST(post({ ...pushBody, endpoint: "http://127.0.0.1" })))
        .status,
      400
    );
    assert.equal(locks, 2);
  } finally {
    await cleanup();
  }
});

test("release registration ignores forged metadata and caps stored subscriptions", async () => {
  let existing: { tmdbId: number }[] = [];
  let saved: unknown;
  let selects = 0;
  const tx = {
    insert: () => ({
      values: (value: unknown) => {
        saved = value;
        return { onConflictDoNothing: () => Promise.resolve() };
      },
    }),
    select: () => {
      selects += 1;
      return new Rows(selects % 2 === 1 ? [{ id: "u" }] : existing);
    },
  };
  const { route, cleanup } = await loadRoute<
    typeof import("../app/api/notifications/subscribe/route")
  >("app/api/notifications/subscribe/route.ts", {
    db: {
      transaction: (callback: (client: typeof tx) => unknown) => callback(tx),
    },
    getApiUser: () => Promise.resolve({ id: "u" }),
    getMovieDetails: () =>
      Promise.resolve({
        poster_path: "/verified.jpg",
        release_date: "2026-10-01",
        title: "Verified title",
      }),
  });
  try {
    assert.equal(
      (
        await route.POST(
          post({ releaseDate: "2026-09-29", title: "Fake", tmdbId: 123 })
        )
      ).status,
      200
    );
    assert.deepEqual(saved, {
      posterPath: "/verified.jpg",
      releaseDate: "2026-10-01",
      title: "Verified title",
      tmdbId: 123,
      userId: "u",
    });
    existing = Array.from({ length: 100 }, (_, tmdbId) => ({ tmdbId }));
    saved = undefined;
    assert.equal((await route.POST(post({ tmdbId: 123 }))).status, 409);
    assert.equal(saved, undefined);
  } finally {
    await cleanup();
  }
});

test("cron bounds query size, total sends and concurrency even for oversized stored sets", async () => {
  const previous = process.env.CRON_SECRET;
  process.env.CRON_SECRET = "test-secret";
  let selects = 0;
  let active = 0;
  let peak = 0;
  let calls = 0;
  let saved = 0;
  const matches = Array.from({ length: 1000 }, (_, id) => ({
    catalogId: id + 1,
    id: String(id),
    posterPath: null,
    title: "Verified",
    tmdbId: id + 1,
    userId: `u${id}`,
  }));
  const tx = {
    insert: () => ({
      values: () => {
        saved += 1;
      },
    }),
    update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
  };
  const { route, cleanup } = await loadRoute<
    typeof import("../app/api/cron/release-notifications/route")
  >("app/api/cron/release-notifications/route.ts", {
    db: {
      select: () => {
        selects += 1;
        return new Rows(selects === 1 ? matches : [...devices, ...devices]);
      },
      transaction: (callback: (client: typeof tx) => unknown) => callback(tx),
    },
    sendPushNotification: async () => {
      calls += 1;
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 1));
      active -= 1;
    },
  });
  try {
    assert.equal(
      (await route.GET(new Request("https://moodflix.test/api"))).status,
      401
    );
    const result = await route.GET(
      new Request("https://moodflix.test/api", {
        headers: { authorization: "Bearer test-secret" },
      })
    );
    const body = await result.json();
    assert.equal(body.attempted, 250);
    assert.equal(calls, 250);
    assert.equal(peak, 5);
    assert.equal(saved, 50);
  } finally {
    await cleanup();
    if (previous === undefined) {
      Reflect.deleteProperty(process.env, "CRON_SECRET");
    } else {
      process.env.CRON_SECRET = previous;
    }
  }
});

test("cron enforces a per-account send budget and leaves remaining releases pending", async () => {
  const previous = process.env.CRON_SECRET;
  process.env.CRON_SECRET = "test-secret";
  let selects = 0;
  let saved = 0;
  const matches = Array.from({ length: 50 }, (_, id) => ({
    catalogId: id + 1,
    id: String(id),
    posterPath: null,
    title: "Verified",
    tmdbId: id + 1,
    userId: "u",
  }));
  const tx = {
    insert: () => ({
      values: () => {
        saved += 1;
      },
    }),
    update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
  };
  const { route, cleanup } = await loadRoute<
    typeof import("../app/api/cron/release-notifications/route")
  >("app/api/cron/release-notifications/route.ts", {
    db: {
      select: () => {
        selects += 1;
        return new Rows(selects === 1 ? matches : devices);
      },
      transaction: (callback: (client: typeof tx) => unknown) => callback(tx),
    },
    sendPushNotification: () => Promise.resolve(),
  });
  try {
    const result = await route.GET(
      new Request("https://moodflix.test/api", {
        headers: { authorization: "Bearer test-secret" },
      })
    );
    const body = await result.json();
    assert.equal(body.attempted, 50);
    assert.equal(body.deferred, 40);
    assert.equal(saved, 10);
  } finally {
    await cleanup();
    if (previous === undefined) {
      Reflect.deleteProperty(process.env, "CRON_SECRET");
    } else {
      process.env.CRON_SECRET = previous;
    }
  }
});

test("cron does not start push sends if a device query consumes the remaining budget", async () => {
  const previousSecret = process.env.CRON_SECRET;
  const previousNow = Date.now;
  let currentTime = previousNow();
  Date.now = () => currentTime;
  process.env.CRON_SECRET = "test-secret";
  let selects = 0;
  let sends = 0;
  const matches = [
    {
      catalogId: 1,
      id: "s1",
      posterPath: null,
      title: "Verified",
      tmdbId: 1,
      userId: "u",
    },
  ];
  const { route, cleanup } = await loadRoute<
    typeof import("../app/api/cron/release-notifications/route")
  >("app/api/cron/release-notifications/route.ts", {
    db: {
      select() {
        selects += 1;
        if (selects === 1) {
          return new Rows(matches);
        }
        const rows = new Rows(devices);
        rows.limit = (limit: number) => {
          currentTime += 20_000;
          return Promise.resolve(devices.slice(0, limit));
        };
        return rows;
      },
    },
    sendPushNotification: () => {
      sends += 1;
      return Promise.reject(
        new Error("A send must not start after the deadline")
      );
    },
  });
  try {
    const result = await route.GET(
      new Request("https://moodflix.test/api", {
        headers: { authorization: "Bearer test-secret" },
      })
    );
    assert.equal((await result.json()).attempted, 0);
    assert.equal(sends, 0);
  } finally {
    await cleanup();
    Date.now = previousNow;
    if (previousSecret === undefined) {
      Reflect.deleteProperty(process.env, "CRON_SECRET");
    } else {
      process.env.CRON_SECRET = previousSecret;
    }
  }
});

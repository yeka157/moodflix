import { LRUCache } from "lru-cache";

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
};

// Per-user daily bucket (24h TTL)
const dailyCache = new LRUCache<string, number>({
  max: 500,
  ttl: 24 * 60 * 60 * 1000,
});

// Short-window bucket (covers per-minute / per-hour limits)
const windowedCache = new LRUCache<
  string,
  { count: number; windowStart: number }
>({
  max: 10_000,
  ttl: 60 * 60 * 1000, // 1h max — windowMs enforced manually
});

export function checkRateLimit(
  userId: string,
  limit = 10,
): RateLimitResult {
  const current = dailyCache.get(userId) ?? 0;

  if (current >= limit) {
    const remainingTtl = dailyCache.getRemainingTTL(userId);
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.ceil(remainingTtl / 1000),
    };
  }

  dailyCache.set(userId, current + 1);

  return {
    allowed: true,
    remaining: limit - current - 1,
    resetInSeconds: 0,
  };
}

export function checkWindowedLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const existing = windowedCache.get(key);

  if (!existing || now - existing.windowStart >= windowMs) {
    windowedCache.set(key, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: limit - 1,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  const elapsed = now - existing.windowStart;
  const resetInSeconds = Math.ceil((windowMs - elapsed) / 1000);

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetInSeconds };
  }

  existing.count += 1;
  windowedCache.set(key, existing);

  return {
    allowed: true,
    remaining: limit - existing.count,
    resetInSeconds,
  };
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  const real = headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export function rateLimitResponse(result: RateLimitResult): Response {
  return Response.json(
    { error: "Rate limit exceeded. Try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.resetInSeconds),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    },
  );
}

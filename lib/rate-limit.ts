import { LRUCache } from "lru-cache";

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
};

const cache = new LRUCache<string, number>({
  max: 500,
  ttl: 24 * 60 * 60 * 1000, // 24 hours
});

export function checkRateLimit(
  userId: string,
  limit = 10,
): RateLimitResult {
  const current = cache.get(userId) ?? 0;

  if (current >= limit) {
    const remainingTtl = cache.getRemainingTTL(userId);
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.ceil(remainingTtl / 1000),
    };
  }

  cache.set(userId, current + 1);

  return {
    allowed: true,
    remaining: limit - current - 1,
    resetInSeconds: 0,
  };
}

import { z } from "zod";

export const MAX_PUSH_DEVICES = 5;
export const MAX_RELEASE_SUBSCRIPTIONS = 100;
export const MAX_RELEASES_PER_RUN = 50;
export const MAX_PUSH_SENDS_PER_RUN = 250;
export const MAX_PUSH_SENDS_PER_USER = 50;
export const PUSH_TIMEOUT_MS = 3000;
export const PUSH_JOB_BUDGET_MS = 20_000;

export function isAllowedPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    const host = url.hostname;
    return (
      url.protocol === "https:" &&
      !url.port &&
      !url.username &&
      !url.password &&
      !url.hash &&
      (host === "fcm.googleapis.com" ||
        host === "updates.push.services.mozilla.com" ||
        host === "web.push.apple.com" ||
        host.endsWith(".push.apple.com") ||
        host.endsWith(".notify.windows.com"))
    );
  } catch {
    return false;
  }
}

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().max(2048).refine(isAllowedPushEndpoint),
  keys: z.object({
    auth: z.string().regex(/^[A-Za-z0-9_-]{22}={0,2}$/),
    p256dh: z.string().regex(/^[A-Za-z0-9_-]{87}=?$/),
  }),
});

export const releaseSubscriptionSchema = z.object({
  tmdbId: z.number().int().positive().max(2_147_483_647),
});

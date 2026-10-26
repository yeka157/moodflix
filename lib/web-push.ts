import "server-only";

import webpush from "web-push";
import { createPushAgent } from "@/lib/push-network";
import { isAllowedPushEndpoint, PUSH_TIMEOUT_MS } from "@/lib/push-policy";

import type { PushPayload } from "@/types/push";

let vapidInitialized = false;

function ensureVapid() {
  if (vapidInitialized) {
    return;
  }
  const { VAPID_SUBJECT, NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } =
    process.env;
  if (!(VAPID_SUBJECT && NEXT_PUBLIC_VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY)) {
    throw new Error("Push notifications are not configured");
  }
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
  vapidInitialized = true;
}

export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<webpush.SendResult> {
  if (!isAllowedPushEndpoint(subscription.endpoint)) {
    throw new Error("Unsupported push endpoint");
  }
  ensureVapid();
  const agent = createPushAgent();
  const deadline = setTimeout(() => agent.destroy(), PUSH_TIMEOUT_MS);
  try {
    return await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          auth: subscription.auth,
          p256dh: subscription.p256dh,
        },
      },
      JSON.stringify(payload),
      { agent, timeout: PUSH_TIMEOUT_MS }
    );
  } finally {
    clearTimeout(deadline);
    agent.destroy();
  }
}

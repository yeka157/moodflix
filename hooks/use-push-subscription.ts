"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const emptySubscribe = () => () => {};
const getSupported = () =>
  "serviceWorker" in navigator && "PushManager" in window;
const getServerSnapshot = () => false;

// Convert URL-safe Base64 VAPID key to Uint8Array for PushManager.subscribe()
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushSubscription() {
  const isSupported = useSyncExternalStore(
    emptySubscribe,
    getSupported,
    getServerSnapshot,
  );
  const subscriptionRef = useRef<PushSubscription | null>(null);

  const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
    if (!isSupported) return null;

    // Check permission status
    if (Notification.permission === "denied") {
      toast.error("Notifications blocked. Enable in browser settings.");
      return null;
    }

    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return null;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      ),
    });

    const json = subscription.toJSON();

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: {
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
        },
      }),
    });

    subscriptionRef.current = subscription;
    return subscription;
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });
    }

    subscriptionRef.current = null;
  }, [isSupported]);

  return { subscribe, unsubscribe, isSupported };
}

// Query keys for notification subscriptions
export const notificationKeys = {
  all: ["notifications"] as const,
  subscribedIds: () => [...notificationKeys.all, "subscribed-ids"] as const,
  subscription: (tmdbId: number) =>
    [...notificationKeys.all, "subscription", tmdbId] as const,
};

// Single bulk query — fetches all subscribed tmdbIds at once.
// useNotificationSubscription reads from this cache to avoid N+1 requests.
export function useNotificationTmdbIds() {
  return useQuery({
    queryKey: notificationKeys.subscribedIds(),
    queryFn: async () => {
      const res = await fetch("/api/notifications/subscribed-ids");
      const json = (await res.json()) as { tmdbIds: number[] };
      return new Set(json.tmdbIds);
    },
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  });
}

interface NotificationToggleInput {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseDate: string | null;
}

export function useNotificationSubscription(tmdbId: number) {
  const queryClient = useQueryClient();

  const { data: subscribedIds, isLoading } = useNotificationTmdbIds();

  const isSubscribed = subscribedIds?.has(tmdbId) ?? false;

  const toggleMutation = useMutation({
    mutationFn: async (input: NotificationToggleInput) => {
      if (isSubscribed) {
        const res = await fetch("/api/notifications/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tmdbId: input.tmdbId }),
        });
        return (await res.json()) as { subscribed: boolean };
      } else {
        const res = await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tmdbId: input.tmdbId,
            title: input.title,
            posterPath: input.posterPath,
            releaseDate: input.releaseDate,
          }),
        });
        return (await res.json()) as { subscribed: boolean };
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: notificationKeys.subscribedIds(),
      });
      const previous = queryClient.getQueryData<Set<number>>(
        notificationKeys.subscribedIds(),
      );
      queryClient.setQueryData(
        notificationKeys.subscribedIds(),
        (old: Set<number> | undefined) => {
          const next = new Set(old ?? []);
          if (isSubscribed) next.delete(tmdbId);
          else next.add(tmdbId);
          return next;
        },
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          notificationKeys.subscribedIds(),
          context.previous,
        );
      }
      toast.error("Failed to update notification preference");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.subscribedIds(),
      });
    },
  });

  const toggle = useCallback(
    (input: NotificationToggleInput) => {
      toggleMutation.mutate(input);
    },
    [toggleMutation],
  );

  return {
    isSubscribed,
    toggle,
    isLoading,
    isToggling: toggleMutation.isPending,
  };
}

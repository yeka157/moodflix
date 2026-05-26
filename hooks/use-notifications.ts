"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getUnreadCount,
  listNotifications,
  markAllAsRead,
  markAsRead,
  markVisibleAsRead,
} from "@/actions/notifications";
import type { Notification, NotificationListPage } from "@/types/notification";

const KEYS = {
  list: ["notifications", "list"] as const,
  unread: ["notifications", "unread"] as const,
};

export function useNotifications() {
  return useInfiniteQuery<NotificationListPage>({
    queryKey: KEYS.list,
    queryFn: ({ pageParam }) =>
      listNotifications({ cursor: (pageParam as string | null) ?? null }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30_000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: KEYS.unread,
    queryFn: () => getUnreadCount(),
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}

function patchListPagesOptimistic(
  pages: NotificationListPage[],
  predicate: (n: Notification) => boolean,
): NotificationListPage[] {
  const nowIso = new Date().toISOString();
  return pages.map((page) => ({
    ...page,
    items: page.items.map((n) =>
      predicate(n) && !n.readAt ? { ...n, readAt: nowIso } : n,
    ),
  }));
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markAsRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEYS.list });
      await qc.cancelQueries({ queryKey: KEYS.unread });

      const prevList = qc.getQueryData<{
        pages: NotificationListPage[];
      }>(KEYS.list);
      const prevUnread = qc.getQueryData<number>(KEYS.unread);

      if (prevList) {
        qc.setQueryData(KEYS.list, {
          ...prevList,
          pages: patchListPagesOptimistic(prevList.pages, (n) => n.id === id),
        });
      }
      if (typeof prevUnread === "number") {
        qc.setQueryData(KEYS.unread, Math.max(0, prevUnread - 1));
      }
      return { prevList, prevUnread };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prevList) qc.setQueryData(KEYS.list, ctx.prevList);
      if (typeof ctx?.prevUnread === "number")
        qc.setQueryData(KEYS.unread, ctx.prevUnread);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: KEYS.unread });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markAllAsRead(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: KEYS.list });
      await qc.cancelQueries({ queryKey: KEYS.unread });

      const prevList = qc.getQueryData<{
        pages: NotificationListPage[];
      }>(KEYS.list);
      const prevUnread = qc.getQueryData<number>(KEYS.unread);

      if (prevList) {
        qc.setQueryData(KEYS.list, {
          ...prevList,
          pages: patchListPagesOptimistic(prevList.pages, () => true),
        });
      }
      qc.setQueryData(KEYS.unread, 0);
      return { prevList, prevUnread };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevList) qc.setQueryData(KEYS.list, ctx.prevList);
      if (typeof ctx?.prevUnread === "number")
        qc.setQueryData(KEYS.unread, ctx.prevUnread);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: KEYS.unread });
    },
  });
}

export function useMarkVisibleAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => markVisibleAsRead(ids),
    onMutate: async (ids) => {
      if (ids.length === 0) return {};
      await qc.cancelQueries({ queryKey: KEYS.list });
      await qc.cancelQueries({ queryKey: KEYS.unread });

      const prevList = qc.getQueryData<{
        pages: NotificationListPage[];
      }>(KEYS.list);
      const prevUnread = qc.getQueryData<number>(KEYS.unread);
      const idSet = new Set(ids);
      let markedCount = 0;

      if (prevList) {
        const next = prevList.pages.map((p) => ({
          ...p,
          items: p.items.map((n) => {
            if (idSet.has(n.id) && !n.readAt) {
              markedCount++;
              return { ...n, readAt: new Date().toISOString() };
            }
            return n;
          }),
        }));
        qc.setQueryData(KEYS.list, { ...prevList, pages: next });
      }

      if (typeof prevUnread === "number") {
        qc.setQueryData(
          KEYS.unread,
          Math.max(0, prevUnread - markedCount),
        );
      }
      return { prevList, prevUnread };
    },
    onError: (_err, _ids, ctx) => {
      if (ctx?.prevList) qc.setQueryData(KEYS.list, ctx.prevList);
      if (typeof ctx?.prevUnread === "number")
        qc.setQueryData(KEYS.unread, ctx.prevUnread);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: KEYS.unread });
    },
  });
}

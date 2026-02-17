"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWatchlist,
  getWatchlistTmdbIds,
  getWatchlistItemByTmdbId,
  addToWatchlist,
  removeFromWatchlist,
  updateWatchlistStatus,
  rateWatchlistItem,
} from "@/actions/watchlist";
import type {
  WatchlistStatus,
  WatchlistItem,
  AddToWatchlistInput,
  WatchlistTmdbEntry,
} from "@/types/watchlist";

export const watchlistKeys = {
  all: ["watchlist"] as const,
  list: (status?: WatchlistStatus) =>
    [...watchlistKeys.all, "list", status ?? "all"] as const,
  tmdbIds: () => [...watchlistKeys.all, "tmdbIds"] as const,
  check: (tmdbId: number) => [...watchlistKeys.all, "check", tmdbId] as const,
};

export function useWatchlist(status?: WatchlistStatus) {
  return useQuery({
    queryKey: watchlistKeys.list(status),
    queryFn: () => getWatchlist(status),
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useWatchlistTmdbIds() {
  return useQuery({
    queryKey: watchlistKeys.tmdbIds(),
    queryFn: getWatchlistTmdbIds,
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useWatchlistCheck(tmdbId: number) {
  return useQuery({
    queryKey: watchlistKeys.check(tmdbId),
    queryFn: () => getWatchlistItemByTmdbId(tmdbId),
    enabled: tmdbId > 0,
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useAddToWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddToWatchlistInput) => addToWatchlist(data),
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: watchlistKeys.all });

      // Update tmdbIds cache
      const previousTmdbIds = queryClient.getQueryData<WatchlistTmdbEntry[]>(
        watchlistKeys.tmdbIds(),
      );
      queryClient.setQueryData<WatchlistTmdbEntry[]>(
        watchlistKeys.tmdbIds(),
        (old) => [
          ...(old ?? []),
          {
            id: "", // Will be replaced on server response
            tmdbId: newItem.tmdbId,
            status: newItem.status ?? "want_to_watch",
          },
        ],
      );

      // Optimistically set check cache for instant detail modal updates
      const previousCheck = queryClient.getQueryData<WatchlistItem | null>(
        watchlistKeys.check(newItem.tmdbId),
      );
      queryClient.setQueryData<WatchlistItem>(
        watchlistKeys.check(newItem.tmdbId),
        {
          id: "",
          userId: "",
          tmdbId: newItem.tmdbId,
          title: newItem.title,
          posterPath: newItem.posterPath,
          status: newItem.status ?? "want_to_watch",
          rating: null,
          addedAt: new Date().toISOString(),
          watchedAt: null,
        },
      );

      return { previousTmdbIds, previousCheck };
    },
    onError: (_err, newItem, context) => {
      if (context?.previousTmdbIds) {
        queryClient.setQueryData(
          watchlistKeys.tmdbIds(),
          context.previousTmdbIds,
        );
      }
      if (context?.previousCheck !== undefined) {
        queryClient.setQueryData(
          watchlistKeys.check(newItem.tmdbId),
          context.previousCheck,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.all });
    },
  });
}

export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; tmdbId: number }) =>
      removeFromWatchlist(params.id),
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: watchlistKeys.all });

      // Update tmdbIds cache
      const previousTmdbIds = queryClient.getQueryData<WatchlistTmdbEntry[]>(
        watchlistKeys.tmdbIds(),
      );
      queryClient.setQueryData<WatchlistTmdbEntry[]>(
        watchlistKeys.tmdbIds(),
        (old) => old?.filter((entry) => entry.tmdbId !== params.tmdbId) ?? [],
      );

      // Clear check cache
      const previousCheck = queryClient.getQueryData<WatchlistItem | null>(
        watchlistKeys.check(params.tmdbId),
      );
      queryClient.setQueryData(watchlistKeys.check(params.tmdbId), null);

      // Remove from list caches
      const listKeys = [
        watchlistKeys.list(),
        watchlistKeys.list("want_to_watch"),
        watchlistKeys.list("watched"),
      ];
      const previousLists: Record<string, WatchlistItem[] | undefined> = {};
      for (const key of listKeys) {
        const keyStr = JSON.stringify(key);
        previousLists[keyStr] = queryClient.getQueryData<WatchlistItem[]>(key);
        queryClient.setQueryData<WatchlistItem[]>(
          key,
          (old) => old?.filter((item) => item.id !== params.id) ?? [],
        );
      }

      return { previousTmdbIds, previousCheck, previousLists };
    },
    onError: (_err, params, context) => {
      if (context?.previousTmdbIds) {
        queryClient.setQueryData(
          watchlistKeys.tmdbIds(),
          context.previousTmdbIds,
        );
      }
      if (context?.previousCheck !== undefined) {
        queryClient.setQueryData(
          watchlistKeys.check(params.tmdbId),
          context.previousCheck,
        );
      }
      if (context?.previousLists) {
        for (const [keyStr, data] of Object.entries(context.previousLists)) {
          if (data) {
            queryClient.setQueryData(JSON.parse(keyStr), data);
          }
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.all });
    },
  });
}

export function useUpdateWatchlistStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; status: WatchlistStatus }) =>
      updateWatchlistStatus(params.id, params.status),
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: watchlistKeys.all });

      // Update tmdbIds cache — match by id directly
      const previousTmdbIds = queryClient.getQueryData<WatchlistTmdbEntry[]>(
        watchlistKeys.tmdbIds(),
      );
      queryClient.setQueryData<WatchlistTmdbEntry[]>(
        watchlistKeys.tmdbIds(),
        (old) =>
          old?.map((entry) =>
            entry.id === params.id
              ? { ...entry, status: params.status }
              : entry,
          ) ?? [],
      );

      // Update check cache if it exists for this item's tmdbId
      const tmdbId = previousTmdbIds?.find((e) => e.id === params.id)?.tmdbId;
      let previousCheck: WatchlistItem | null | undefined;
      if (tmdbId) {
        previousCheck = queryClient.getQueryData<WatchlistItem | null>(
          watchlistKeys.check(tmdbId),
        );
        if (previousCheck) {
          queryClient.setQueryData<WatchlistItem>(watchlistKeys.check(tmdbId), {
            ...previousCheck,
            status: params.status,
            watchedAt:
              params.status === "watched" ? new Date().toISOString() : null,
          });
        }
      }

      // Update list caches
      const listKeys = [
        watchlistKeys.list(),
        watchlistKeys.list("want_to_watch"),
        watchlistKeys.list("watched"),
      ];
      const previousLists: Record<string, WatchlistItem[] | undefined> = {};
      for (const key of listKeys) {
        const keyStr = JSON.stringify(key);
        previousLists[keyStr] = queryClient.getQueryData<WatchlistItem[]>(key);
      }
      // Update "all" list
      queryClient.setQueryData<WatchlistItem[]>(
        watchlistKeys.list(),
        (old) =>
          old?.map((item) =>
            item.id === params.id
              ? {
                  ...item,
                  status: params.status,
                  watchedAt:
                    params.status === "watched"
                      ? new Date().toISOString()
                      : null,
                }
              : item,
          ) ?? [],
      );
      // Move between status-filtered lists
      queryClient.setQueryData<WatchlistItem[]>(
        watchlistKeys.list("want_to_watch"),
        (old) => {
          if (params.status === "want_to_watch") {
            const item = previousLists[
              JSON.stringify(watchlistKeys.list())
            ]?.find((i) => i.id === params.id);
            return item
              ? [
                  ...(old ?? []),
                  { ...item, status: "want_to_watch", watchedAt: null },
                ]
              : (old ?? []);
          }
          return old?.filter((item) => item.id !== params.id) ?? [];
        },
      );
      queryClient.setQueryData<WatchlistItem[]>(
        watchlistKeys.list("watched"),
        (old) => {
          if (params.status === "watched") {
            const item = previousLists[
              JSON.stringify(watchlistKeys.list())
            ]?.find((i) => i.id === params.id);
            return item
              ? [
                  ...(old ?? []),
                  {
                    ...item,
                    status: "watched",
                    watchedAt: new Date().toISOString(),
                  },
                ]
              : (old ?? []);
          }
          return old?.filter((item) => item.id !== params.id) ?? [];
        },
      );

      return { previousTmdbIds, previousCheck, previousLists, tmdbId };
    },
    onError: (_err, params, context) => {
      if (context?.previousTmdbIds) {
        queryClient.setQueryData(
          watchlistKeys.tmdbIds(),
          context.previousTmdbIds,
        );
      }
      if (context?.tmdbId && context?.previousCheck !== undefined) {
        queryClient.setQueryData(
          watchlistKeys.check(context.tmdbId),
          context.previousCheck,
        );
      }
      if (context?.previousLists) {
        for (const [keyStr, data] of Object.entries(context.previousLists)) {
          if (data) {
            queryClient.setQueryData(JSON.parse(keyStr), data);
          }
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.all });
    },
  });
}

export function useRateWatchlistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; rating: 1 | -1 | null }) =>
      rateWatchlistItem(params.id, params.rating),
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: watchlistKeys.all });

      // Find tmdbId from tmdbIds cache for check cache update
      const previousTmdbIds = queryClient.getQueryData<WatchlistTmdbEntry[]>(
        watchlistKeys.tmdbIds(),
      );
      const tmdbId = previousTmdbIds?.find((e) => e.id === params.id)?.tmdbId;

      // Update check cache if exists
      let previousCheck: WatchlistItem | null | undefined;
      if (tmdbId) {
        previousCheck = queryClient.getQueryData<WatchlistItem | null>(
          watchlistKeys.check(tmdbId),
        );
        if (previousCheck) {
          queryClient.setQueryData<WatchlistItem>(
            watchlistKeys.check(tmdbId),
            { ...previousCheck, rating: params.rating },
          );
        }
      }

      // Update list caches
      const listKeys = [
        watchlistKeys.list(),
        watchlistKeys.list("want_to_watch"),
        watchlistKeys.list("watched"),
      ];
      const previousLists: Record<string, WatchlistItem[] | undefined> = {};
      for (const key of listKeys) {
        const keyStr = JSON.stringify(key);
        previousLists[keyStr] = queryClient.getQueryData<WatchlistItem[]>(key);
        queryClient.setQueryData<WatchlistItem[]>(
          key,
          (old) =>
            old?.map((item) =>
              item.id === params.id
                ? { ...item, rating: params.rating }
                : item,
            ) ?? [],
        );
      }

      return { previousCheck, previousLists, tmdbId };
    },
    onError: (_err, _params, context) => {
      if (context?.tmdbId && context?.previousCheck !== undefined) {
        queryClient.setQueryData(
          watchlistKeys.check(context.tmdbId),
          context.previousCheck,
        );
      }
      if (context?.previousLists) {
        for (const [keyStr, data] of Object.entries(context.previousLists)) {
          if (data) {
            queryClient.setQueryData(JSON.parse(keyStr), data);
          }
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.all });
    },
  });
}

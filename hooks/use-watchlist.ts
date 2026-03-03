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
import type { MediaType } from "@/types/media";

export const watchlistKeys = {
  all: ["watchlist"] as const,
  list: (status?: WatchlistStatus) =>
    [...watchlistKeys.all, "list", status ?? "all"] as const,
  tmdbIds: () => [...watchlistKeys.all, "tmdbIds"] as const,
  check: (tmdbId: number, mediaType: MediaType = "movie") =>
    [...watchlistKeys.all, "check", tmdbId, mediaType] as const,
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

export function useWatchlistCheck(tmdbId: number, mediaType: MediaType = "movie") {
  return useQuery({
    queryKey: watchlistKeys.check(tmdbId, mediaType),
    queryFn: () => getWatchlistItemByTmdbId(tmdbId, mediaType),
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
            mediaType: (newItem.mediaType ?? "movie") as MediaType,
          },
        ],
      );

      // Optimistically set check cache for instant detail modal updates
      const itemMediaType = (newItem.mediaType ?? "movie") as MediaType;
      const previousCheck = queryClient.getQueryData<WatchlistItem | null>(
        watchlistKeys.check(newItem.tmdbId, itemMediaType),
      );
      queryClient.setQueryData<WatchlistItem>(
        watchlistKeys.check(newItem.tmdbId, itemMediaType),
        {
          id: "",
          userId: "",
          tmdbId: newItem.tmdbId,
          title: newItem.title,
          posterPath: newItem.posterPath,
          status: newItem.status ?? "want_to_watch",
          rating: null,
          mediaType: itemMediaType,
          addedAt: new Date().toISOString(),
          watchedAt: null,
        },
      );

      return { previousTmdbIds, previousCheck, itemMediaType };
    },
    onError: (_err, newItem, context) => {
      if (context?.previousTmdbIds) {
        queryClient.setQueryData(
          watchlistKeys.tmdbIds(),
          context.previousTmdbIds,
        );
      }
      if (context?.previousCheck !== undefined) {
        const itemMediaType = context.itemMediaType ?? ((newItem.mediaType ?? "movie") as MediaType);
        queryClient.setQueryData(
          watchlistKeys.check(newItem.tmdbId, itemMediaType),
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
    mutationFn: (params: { id: string; tmdbId: number; mediaType?: MediaType }) =>
      removeFromWatchlist(params.id),
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: watchlistKeys.all });

      const itemMediaType = params.mediaType ?? "movie";

      // Update tmdbIds cache — filter by both tmdbId AND mediaType
      const previousTmdbIds = queryClient.getQueryData<WatchlistTmdbEntry[]>(
        watchlistKeys.tmdbIds(),
      );
      queryClient.setQueryData<WatchlistTmdbEntry[]>(
        watchlistKeys.tmdbIds(),
        (old) =>
          old?.filter(
            (entry) =>
              !(entry.tmdbId === params.tmdbId && entry.mediaType === itemMediaType),
          ) ?? [],
      );

      // Clear check cache — media-type-aware key
      const previousCheck = queryClient.getQueryData<WatchlistItem | null>(
        watchlistKeys.check(params.tmdbId, itemMediaType),
      );
      queryClient.setQueryData(watchlistKeys.check(params.tmdbId, itemMediaType), null);

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

      return { previousTmdbIds, previousCheck, previousLists, itemMediaType };
    },
    onError: (_err, params, context) => {
      if (context?.previousTmdbIds) {
        queryClient.setQueryData(
          watchlistKeys.tmdbIds(),
          context.previousTmdbIds,
        );
      }
      if (context?.previousCheck !== undefined) {
        const itemMediaType = context.itemMediaType ?? (params.mediaType ?? "movie");
        queryClient.setQueryData(
          watchlistKeys.check(params.tmdbId, itemMediaType),
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

      // Update check cache if it exists for this item's tmdbId + mediaType
      const matchedEntry = previousTmdbIds?.find((e) => e.id === params.id);
      const tmdbId = matchedEntry?.tmdbId;
      const entryMediaType = (matchedEntry?.mediaType ?? "movie") as MediaType;
      let previousCheck: WatchlistItem | null | undefined;
      if (tmdbId) {
        previousCheck = queryClient.getQueryData<WatchlistItem | null>(
          watchlistKeys.check(tmdbId, entryMediaType),
        );
        if (previousCheck) {
          queryClient.setQueryData<WatchlistItem>(
            watchlistKeys.check(tmdbId, entryMediaType),
            {
              ...previousCheck,
              status: params.status,
              watchedAt:
                params.status === "watched" ? new Date().toISOString() : null,
            },
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

      return { previousTmdbIds, previousCheck, previousLists, tmdbId, entryMediaType };
    },
    onError: (_err, params, context) => {
      if (context?.previousTmdbIds) {
        queryClient.setQueryData(
          watchlistKeys.tmdbIds(),
          context.previousTmdbIds,
        );
      }
      if (context?.tmdbId && context?.previousCheck !== undefined) {
        const entryMediaType = context.entryMediaType ?? "movie";
        queryClient.setQueryData(
          watchlistKeys.check(context.tmdbId, entryMediaType),
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

      // Find tmdbId and mediaType from tmdbIds cache for check cache update
      const previousTmdbIds = queryClient.getQueryData<WatchlistTmdbEntry[]>(
        watchlistKeys.tmdbIds(),
      );
      const matchedEntry = previousTmdbIds?.find((e) => e.id === params.id);
      const tmdbId = matchedEntry?.tmdbId;
      const entryMediaType = (matchedEntry?.mediaType ?? "movie") as MediaType;

      // Update check cache if exists
      let previousCheck: WatchlistItem | null | undefined;
      if (tmdbId) {
        previousCheck = queryClient.getQueryData<WatchlistItem | null>(
          watchlistKeys.check(tmdbId, entryMediaType),
        );
        if (previousCheck) {
          queryClient.setQueryData<WatchlistItem>(
            watchlistKeys.check(tmdbId, entryMediaType),
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

      return { previousCheck, previousLists, tmdbId, entryMediaType };
    },
    onError: (_err, _params, context) => {
      if (context?.tmdbId && context?.previousCheck !== undefined) {
        const entryMediaType = context.entryMediaType ?? "movie";
        queryClient.setQueryData(
          watchlistKeys.check(context.tmdbId, entryMediaType),
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

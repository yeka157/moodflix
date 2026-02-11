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
} from "@/types/watchlist";

export const watchlistKeys = {
  all: ["watchlist"] as const,
  list: (status?: WatchlistStatus) =>
    [...watchlistKeys.all, "list", status ?? "all"] as const,
  tmdbIds: () => [...watchlistKeys.all, "tmdbIds"] as const,
  check: (tmdbId: number) =>
    [...watchlistKeys.all, "check", tmdbId] as const,
};

export function useWatchlist(status?: WatchlistStatus) {
  return useQuery({
    queryKey: watchlistKeys.list(status),
    queryFn: () => getWatchlist(status),
  });
}

export function useWatchlistTmdbIds() {
  return useQuery({
    queryKey: watchlistKeys.tmdbIds(),
    queryFn: getWatchlistTmdbIds,
    staleTime: 30_000,
  });
}

export function useWatchlistCheck(tmdbId: number) {
  return useQuery({
    queryKey: watchlistKeys.check(tmdbId),
    queryFn: () => getWatchlistItemByTmdbId(tmdbId),
    enabled: tmdbId > 0,
    staleTime: 30_000,
  });
}

export function useAddToWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddToWatchlistInput) => addToWatchlist(data),
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({
        queryKey: watchlistKeys.tmdbIds(),
      });
      const previousIds = queryClient.getQueryData<number[]>(
        watchlistKeys.tmdbIds(),
      );
      queryClient.setQueryData<number[]>(watchlistKeys.tmdbIds(), (old) =>
        old ? [...old, newItem.tmdbId] : [newItem.tmdbId],
      );
      return { previousIds };
    },
    onError: (_err, _newItem, context) => {
      if (context?.previousIds) {
        queryClient.setQueryData(
          watchlistKeys.tmdbIds(),
          context.previousIds,
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
      await queryClient.cancelQueries({
        queryKey: watchlistKeys.tmdbIds(),
      });
      const previousIds = queryClient.getQueryData<number[]>(
        watchlistKeys.tmdbIds(),
      );
      queryClient.setQueryData<number[]>(watchlistKeys.tmdbIds(), (old) =>
        old ? old.filter((id) => id !== params.tmdbId) : [],
      );

      // Also optimistically remove from list caches
      const listKeys = [
        watchlistKeys.list(),
        watchlistKeys.list("want_to_watch"),
        watchlistKeys.list("watched"),
      ];
      const previousLists: Record<string, WatchlistItem[] | undefined> = {};
      for (const key of listKeys) {
        const keyStr = JSON.stringify(key);
        previousLists[keyStr] =
          queryClient.getQueryData<WatchlistItem[]>(key);
        queryClient.setQueryData<WatchlistItem[]>(key, (old) =>
          old ? old.filter((item) => item.id !== params.id) : [],
        );
      }

      return { previousIds, previousLists };
    },
    onError: (_err, _params, context) => {
      if (context?.previousIds) {
        queryClient.setQueryData(
          watchlistKeys.tmdbIds(),
          context.previousIds,
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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.all });
    },
  });
}

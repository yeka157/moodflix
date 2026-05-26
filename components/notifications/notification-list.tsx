"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";

import {
  useMarkAllRead,
  useMarkVisibleAsRead,
  useNotifications,
} from "@/hooks/use-notifications";
import { NotificationRow } from "./notification-row";
import { cn } from "@/lib/utils";

interface NotificationListProps {
  variant: "popover" | "page";
  onRowNavigate?: () => void;
}

export function NotificationList({
  variant,
  onRowNavigate,
}: NotificationListProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useNotifications();
  const { mutate: markAll, isPending: marking } = useMarkAllRead();
  const { mutate: markVisible } = useMarkVisibleAsRead();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const markedOnOpenRef = useRef(false);

  const items = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );
  const hasUnread = items.some((n) => !n.readAt);

  // Auto-mark first batch of visible unread as read 500ms after mount
  useEffect(() => {
    if (markedOnOpenRef.current) return;
    if (isLoading || items.length === 0) return;
    const ids = items.filter((n) => !n.readAt).map((n) => n.id);
    if (ids.length === 0) {
      markedOnOpenRef.current = true;
      return;
    }
    const t = setTimeout(() => {
      markVisible(ids);
      markedOnOpenRef.current = true;
    }, 500);
    return () => clearTimeout(t);
  }, [isLoading, items, markVisible]);

  // Infinite scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "0px 0px 200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div
      className={cn(
        "flex flex-col",
        variant === "popover" ? "max-h-[480px]" : "h-full",
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-sm font-medium">Notifications</span>
        <button
          type="button"
          onClick={() => markAll()}
          disabled={!hasUnread || marking}
          className={cn(
            "text-[11px] uppercase tracking-[0.1em] text-muted-foreground transition-colors",
            "hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed",
          )}
        >
          Mark all read
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="px-3 py-3 space-y-3" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="size-9 h-[54px] shrink-0 rounded bg-muted/40 animate-pulse" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 rounded bg-muted/40 animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-muted/40 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <div className="flex items-center justify-between px-3 py-4 text-sm">
            <span className="text-muted-foreground">
              Couldn&apos;t load notifications
            </span>
            <button
              type="button"
              onClick={() => refetch()}
              className="text-xs underline underline-offset-4"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-medium">You&apos;re all caught up.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              We&apos;ll ping you when releases drop.
            </p>
          </div>
        )}

        {!isLoading && !isError && items.length > 0 && (
          <>
            {items.map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                onAfterNavigate={onRowNavigate}
              />
            ))}
            {hasNextPage && (
              <div
                ref={sentinelRef}
                className="px-3 py-3 text-center text-xs text-muted-foreground"
              >
                {isFetchingNextPage ? "Loading…" : ""}
              </div>
            )}
          </>
        )}
      </div>

      {variant === "popover" && (
        <Link
          href="/notifications"
          onClick={onRowNavigate}
          className="border-t border-border px-3 py-2 text-center text-[11px] uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors"
        >
          See all notifications →
        </Link>
      )}
    </div>
  );
}

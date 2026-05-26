"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useMarkRead } from "@/hooks/use-notifications";
import type { Notification } from "@/types/notification";

interface NotificationRowProps {
  notification: Notification;
  onAfterNavigate?: () => void;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationRow({
  notification,
  onAfterNavigate,
}: NotificationRowProps) {
  const router = useRouter();
  const { mutate: markRead } = useMarkRead();
  const isUnread = !notification.readAt;

  const handleClick = () => {
    if (isUnread) markRead(notification.id);
    if (notification.href) router.push(notification.href);
    onAfterNavigate?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "relative flex w-full items-start gap-3 px-3 py-3 text-left min-h-[56px]",
        "transition-colors hover:bg-secondary/60",
        "focus-visible:outline-none focus-visible:bg-secondary/60",
      )}
    >
      {isUnread && (
        <span
          aria-hidden="true"
          className="absolute left-1 top-1/2 -translate-y-1/2 size-2 rounded-full bg-primary"
        />
      )}
      <div className="relative size-9 h-[54px] shrink-0 overflow-hidden rounded bg-muted">
        {notification.posterPath ? (
          <Image
            src={`https://image.tmdb.org/t/p/w92${notification.posterPath}`}
            alt=""
            fill
            sizes="36px"
            className="object-cover"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium line-clamp-2">
          {notification.title}
        </div>
        {notification.body && (
          <div className="text-xs text-muted-foreground line-clamp-1">
            {notification.body}
          </div>
        )}
        <div className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
          {timeAgo(notification.createdAt)}
        </div>
      </div>
    </button>
  );
}

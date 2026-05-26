"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUnreadCount } from "@/hooks/use-notifications";
import { NotificationList } from "./notification-list";
import { cn } from "@/lib/utils";

const BUTTON_BASE =
  "relative grid h-9 w-9 place-items-center rounded-[10px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground";

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  const label = count > 9 ? "9+" : String(count);
  return (
    <span
      aria-hidden="true"
      className="absolute -top-0.5 -right-0.5 grid min-w-[16px] h-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-medium leading-none text-primary-foreground"
    >
      {label}
    </span>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: unread = 0 } = useUnreadCount();
  const ariaLabel = `Notifications${unread > 0 ? `, ${unread} unread` : ""}`;

  return (
    <>
      {/* Mobile: direct link to /notifications */}
      <Link
        href="/notifications"
        aria-label={ariaLabel}
        className={cn("md:hidden", BUTTON_BASE)}
      >
        <Bell className="size-4" aria-hidden="true" />
        <UnreadBadge count={unread} />
      </Link>

      {/* Desktop: popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={ariaLabel}
            className={cn("hidden md:grid", BUTTON_BASE)}
          >
            <Bell className="size-4" aria-hidden="true" />
            <UnreadBadge count={unread} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[380px] p-0"
          align="end"
          sideOffset={8}
        >
          <NotificationList
            variant="popover"
            onRowNavigate={() => setOpen(false)}
          />
        </PopoverContent>
      </Popover>
    </>
  );
}

"use client";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useOnlineStatus } from "@/hooks/use-online-status";

export function OfflineToast() {
  const isOnline = useOnlineStatus();
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return; // skip toast on initial mount
    }
    if (isOnline) {
      toast.success("Back online");
    } else {
      toast.warning("You're offline", {
        description: "Cached content is still available.",
        duration: Infinity,
        id: "offline-toast",
      });
    }
  }, [isOnline]);

  return null;
}

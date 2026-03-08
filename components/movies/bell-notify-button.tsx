"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Bell, BellRing, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  usePushSubscription,
  useNotificationSubscription,
} from "@/hooks/use-push-subscription";
import { cn } from "@/lib/utils";

interface BellNotifyButtonProps {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseDate: string | null;
}

export function BellNotifyButton({
  tmdbId,
  title,
  posterPath,
  releaseDate,
}: BellNotifyButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const { subscribe, isSupported } = usePushSubscription();
  const { isSubscribed, toggle, isLoading, isToggling } =
    useNotificationSubscription(tmdbId);
  const hasSubscribedPushRef = useRef(false);

  if (!isSupported) return null;

  const tapAnimation = prefersReducedMotion ? {} : { scale: 0.92 };
  const isBusy = isLoading || isToggling;

  const handleClick = async () => {
    if (isBusy) return;

    // On first bell tap, ensure browser push subscription exists
    if (!hasSubscribedPushRef.current && !isSubscribed) {
      const sub = await subscribe();
      if (!sub) return; // Permission denied or unsupported
      hasSubscribedPushRef.current = true;
    }

    toggle({ tmdbId, title, posterPath, releaseDate });
  };

  return (
    <motion.div whileTap={tapAnimation}>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        disabled={isBusy}
        aria-label={
          isSubscribed
            ? "Cancel release notification"
            : "Notify me when released"
        }
        className={cn(
          "transition-colors duration-200",
          isSubscribed && "text-primary",
        )}
      >
        {isBusy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isSubscribed ? (
          <BellRing className="h-4 w-4 fill-current" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
      </Button>
    </motion.div>
  );
}

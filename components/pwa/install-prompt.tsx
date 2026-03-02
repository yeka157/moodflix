"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { Button } from "@/components/ui/button";

export function InstallPrompt() {
  const { canInstall, install } = usePwaInstall();
  const [dismissed, setDismissed] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  if (!canInstall || dismissed) return null;

  return (
    <motion.div
      className="fixed bottom-16 left-0 right-0 z-50 md:bottom-0"
      initial={prefersReducedMotion ? { y: 0 } : { y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="mx-auto max-w-2xl border-t border-border bg-card/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {/* Icon + text */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {/* Moodflix icon — 24px */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon-192.png"
              alt="Moodflix"
              width={24}
              height={24}
              className="shrink-0 rounded-sm"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                Install Moodflix
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Get the full app experience
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            <Button
              size="sm"
              onClick={() => void install()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Install
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss install prompt"
              className="h-9 w-9 p-0"
            >
              ✕
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrowId?: string;
  eyebrowLabel?: string;
  title: ReactNode;
  isUpdating?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  canPrev?: boolean;
  canNext?: boolean;
  rightSlot?: ReactNode;
  className?: string;
}

export function SectionHeader({
  eyebrowId,
  eyebrowLabel,
  title,
  isUpdating = false,
  onPrev,
  onNext,
  canPrev = true,
  canNext = true,
  rightSlot,
  className,
}: SectionHeaderProps) {
  const hasArrows = onPrev != null || onNext != null;
  return (
    <div className={cn("flex items-end justify-between mb-7 gap-6", className)}>
      <div>
        {(eyebrowId || eyebrowLabel) && (
          <div className="flex items-center gap-2.5 mb-3">
            {eyebrowId && (
              <span className="font-mono text-[11px] text-muted-foreground tracking-[0.14em] uppercase">
                {eyebrowId}
              </span>
            )}
            {eyebrowLabel && (
              <span className="font-mono text-[11px] text-muted-foreground tracking-[0.14em] uppercase">
                {eyebrowLabel}
              </span>
            )}
          </div>
        )}
        <div className="flex items-center gap-3">
          <h2 className="section-title font-display uppercase text-[48px] leading-[0.9] tracking-[0.002em] m-0">
            {title}
          </h2>
          {isUpdating && (
            <span
              className="font-mono inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] tracking-[0.1em]"
              style={{
                background: "var(--red-soft)",
                color: "var(--red)",
              }}
            >
              <Loader2 className="size-3 animate-spin" />
              UPDATING
            </span>
          )}
        </div>
      </div>
      {(hasArrows || rightSlot) && (
        <div className="section-actions flex gap-2 items-center">
          {rightSlot}
          {hasArrows && (
            <>
              <button
                type="button"
                className="arrow"
                onClick={onPrev}
                disabled={!canPrev}
                aria-label="Scroll left"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                className="arrow"
                onClick={onNext}
                disabled={!canNext}
                aria-label="Scroll right"
              >
                <ChevronRight className="size-4" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

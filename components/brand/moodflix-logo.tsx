import { cn } from "@/lib/utils";
import { MoodflixIcon } from "./moodflix-icon";

interface MoodflixLogoProps {
  height?: number;
  variant?: "dark" | "light";
  showTagline?: boolean;
  className?: string;
}

export function MoodflixLogo({
  height = 32,
  variant = "dark",
  showTagline = false,
  className,
}: MoodflixLogoProps) {
  const textColor = variant === "dark" ? "#ffffff" : "#1a1a1a";

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <MoodflixIcon size={height} variant={variant} />
      <span
        style={{
          fontFamily: "var(--font-display), sans-serif",
          fontSize: height,
          lineHeight: 1,
          color: textColor,
          fontWeight: 400,
          display: "block",
        }}
      >
        oodflix
      </span>
    </div>
  );
}

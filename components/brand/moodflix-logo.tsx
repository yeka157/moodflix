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
  const crimson = "#FB2C36";
  const cutoutColor = variant === "dark" ? "#0a0a0a" : "#ffffff";
  const textColor = variant === "dark" ? "#ffffff" : "#1a1a1a";
  const letterColor = variant === "dark" ? crimson : "#1a1a1a";

  // ViewBox is 500x100. Width prop is derived from height to maintain 5:1 aspect ratio.
  const width = height * 5;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 500 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Moodflix"
    >
      {/* M icon (same geometry as MoodflixIcon, coordinates 0-100 of the 500-wide viewBox) */}
      <path
        d="M8 88 L8 12 L50 58 L92 12 L92 88 L80 88 L80 32 L50 70 L20 32 L20 88 Z"
        fill={letterColor}
      />
      <rect x="10" y="18" width="8" height="10" rx="1.5" fill={cutoutColor} />
      <rect x="10" y="34" width="8" height="10" rx="1.5" fill={cutoutColor} />
      <rect x="10" y="50" width="8" height="10" rx="1.5" fill={cutoutColor} />
      <rect x="10" y="66" width="8" height="10" rx="1.5" fill={cutoutColor} />

      {/* "oodflix" text — Bebas Neue via CSS variable --font-display */}
      {/* x=104 starts just after the M's right edge (x=92) with a small gap */}
      <text
        x="104"
        y="82"
        fontSize="78"
        fontWeight="400"
        fill={textColor}
        fontFamily="var(--font-display), sans-serif"
        letterSpacing="-1"
      >
        oodflix
      </text>

      {/* Optional tagline — landing page hero use only, not in navbar */}
      {showTagline && (
        <text
          x="104"
          y="98"
          fontSize="11"
          fill={textColor}
          opacity={0.55}
          fontFamily="var(--font-inter), sans-serif"
          letterSpacing="3.5"
        >
          AI MOVIE DISCOVERY
        </text>
      )}
    </svg>
  );
}

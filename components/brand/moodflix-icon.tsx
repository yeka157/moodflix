interface MoodflixIconProps {
  size?: number;
  variant?: "dark" | "light";
  className?: string;
}

export function MoodflixIcon({
  size = 32,
  variant = "dark",
  className,
}: MoodflixIconProps) {
  const crimson = "#FB2C36";
  // cutoutColor must match the background the icon is placed on
  // dark variant (app): rects are #0a0a0a (app background)
  // light variant (press): rects are #ffffff
  const cutoutColor = variant === "dark" ? "#0a0a0a" : "#ffffff";
  const letterColor = variant === "dark" ? crimson : "#1a1a1a";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Geometric sans M — two vertical strokes + diagonals meeting at center peak */}
      <path
        d="M8 88 L8 12 L50 58 L92 12 L92 88 L80 88 L80 32 L50 70 L20 32 L20 88 Z"
        fill={letterColor}
      />
      {/* Film-strip perforations — 4 dark rects on the left vertical stroke (x: 8–20) */}
      {/* These overlay the crimson M path, visually punching holes through the left stroke */}
      <rect x="10" y="18" width="8" height="10" rx="1.5" fill={cutoutColor} />
      <rect x="10" y="34" width="8" height="10" rx="1.5" fill={cutoutColor} />
      <rect x="10" y="50" width="8" height="10" rx="1.5" fill={cutoutColor} />
      <rect x="10" y="66" width="8" height="10" rx="1.5" fill={cutoutColor} />
    </svg>
  );
}

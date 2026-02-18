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
      {/* Film-strip: 6 rectangular holes on the left stroke (x: 8–20) */}
      {/* 1px rails at x=8–9 and x=19–20; 10px-wide holes at x=9–19; no border-radius */}
      <rect x="9" y="15" width="10" height="10" fill={cutoutColor} />
      <rect x="9" y="27" width="10" height="10" fill={cutoutColor} />
      <rect x="9" y="39" width="10" height="10" fill={cutoutColor} />
      <rect x="9" y="51" width="10" height="10" fill={cutoutColor} />
      <rect x="9" y="63" width="10" height="10" fill={cutoutColor} />
      <rect x="9" y="75" width="10" height="10" fill={cutoutColor} />
    </svg>
  );
}

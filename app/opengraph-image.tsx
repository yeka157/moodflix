import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Moodflix - AI-Powered Movie Discovery";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <span
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.02em",
            }}
          >
            Mood
          </span>
          <span
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: "#dc2626",
              letterSpacing: "-0.02em",
            }}
          >
            flix
          </span>
        </div>
        <p
          style={{
            fontSize: 28,
            color: "#a1a1aa",
            textAlign: "center",
            maxWidth: 600,
            lineHeight: 1.4,
          }}
        >
          AI-powered movie discovery. Find the perfect movie for any mood.
        </p>
      </div>
    ),
    { ...size }
  );
}

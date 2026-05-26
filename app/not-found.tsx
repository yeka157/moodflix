import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

export const metadata: Metadata = {
  title: "404 — Not found",
};

export default function NotFound() {
  return (
    <main
      className="page section flex flex-col items-center justify-center text-center"
      style={{ minHeight: "100dvh", paddingTop: 24, paddingBottom: 24 }}
    >
      <div className="section-eyebrow" style={{ justifyContent: "center" }}>
        <span className="id">ERR · 404 · LOST REEL</span>
      </div>
      <h1
        className="display"
        style={{
          fontSize: "clamp(120px, 22vw, 280px)",
          lineHeight: 0.85,
          margin: "16px 0 8px",
          color: "var(--primary, oklch(0.637 0.237 25.331))",
        }}
      >
        404.
      </h1>
      <h2
        className="display"
        style={{
          fontSize: "clamp(28px, 4vw, 48px)",
          margin: "0 0 18px",
        }}
      >
        This scene{" "}
        <span
          className="serif-it"
          style={{
            color: "var(--ink-2)",
            textTransform: "none",
            letterSpacing: "-0.015em",
          }}
        >
          was cut.
        </span>
      </h2>
      <p
        style={{
          color: "var(--ink-3)",
          maxWidth: 440,
          fontSize: 14,
          lineHeight: 1.55,
          margin: "0 0 32px",
        }}
      >
        The page you&apos;re looking for isn&apos;t in the catalog. Maybe it
        moved, maybe it never existed.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Link href="/home" className="btn btn-red">
          <Home size={14} />
          Back to home
        </Link>
        <Link href="/discover" className="btn btn-outline">
          <ArrowLeft size={14} />
          Browse catalog
        </Link>
      </div>
    </main>
  );
}

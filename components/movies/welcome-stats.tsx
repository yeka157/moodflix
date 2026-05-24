"use client";

import { useEffect, useState } from "react";

interface WelcomeStatsProps {
  displayName: string;
  inLibrary: number;
  watched: number;
  thisYear: number;
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function WelcomeStats({
  displayName,
  inLibrary,
  watched,
  thisYear,
}: WelcomeStatsProps) {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setTime(formatTime(new Date()));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="section reveal" style={{ paddingTop: 80, paddingBottom: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 24,
        }}
      >
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            Welcome back{time ? ` · ${time}` : ""}
          </div>
          <h2
            className="display"
            style={{
              fontSize: "clamp(48px, 6vw, 88px)",
              margin: 0,
            }}
          >
            Hello,{" "}
            <span
              className="serif-it"
              style={{
                color: "var(--ink-2)",
                textTransform: "none",
                letterSpacing: "-0.01em",
              }}
            >
              {displayName}.
            </span>
          </h2>
        </div>
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          <Stat label="In library" value={inLibrary} />
          <Stat label="Watched" value={watched} />
          <Stat label="This year" value={thisYear} hint="films" />
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="stat">
      <div className="lbl">{label}</div>
      <div className="val">
        <span className="tnum">{value}</span>
        {hint && <span className="hint">{hint}</span>}
      </div>
    </div>
  );
}

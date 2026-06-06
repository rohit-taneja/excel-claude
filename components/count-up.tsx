"use client";

import * as React from "react";

/**
 * Animates a number from 0 up to `value` once on mount using an ease-out curve.
 * Falls back to the final value immediately when the user prefers reduced
 * motion. Rendered with tabular figures so the width stays stable while ticking.
 */
export function CountUp({
  value,
  suffix = "",
  prefix = "",
  decimals = 0,
  durationMs = 650,
  className,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  durationMs?: number;
  className?: string;
}) {
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    let frame = 0;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReduced || durationMs <= 0) {
      // Jump straight to the final value (deferred a frame to avoid a
      // synchronous setState inside the effect body).
      frame = requestAnimationFrame(() => setDisplay(value));
      return () => cancelAnimationFrame(frame);
    }

    let start: number | null = null;
    const step = (now: number) => {
      start ??= now;
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);

  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

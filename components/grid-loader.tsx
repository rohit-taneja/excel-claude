import { cn } from "@/lib/utils";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

// A 3×3 block of spreadsheet "cells". Each cell's animation delay is derived
// from its diagonal position so the pulse ripples across the grid like a wave.
const CELLS = Array.from({ length: 9 }, (_, i) => {
  const row = Math.floor(i / 3);
  const col = i % 3;
  return {
    delay: (row + col) * 110,
    color: COLORS[(i * 2) % COLORS.length],
  };
});

/**
 * A small, on-brand loading indicator: a grid of spreadsheet cells that pulse
 * in a diagonal wave. Decorative and disabled under `prefers-reduced-motion`.
 */
export function GridLoader({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col items-center gap-4", className)}
    >
      <div className="grid grid-cols-3 gap-2">
        {CELLS.map((cell, i) => (
          <span
            key={i}
            className="size-5 rounded-[4px] animate-cell-pulse"
            style={{
              backgroundColor: cell.color,
              boxShadow: `0 0 14px ${cell.color}`,
              animationDelay: `${cell.delay}ms`,
            }}
          />
        ))}
      </div>
      {label ? (
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
      ) : null}
    </div>
  );
}

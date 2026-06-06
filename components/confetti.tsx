"use client";

import { cn } from "@/lib/utils";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

// Deterministic pseudo-spread so we avoid Math.random (keeps SSR/render pure).
const PIECES = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i % 7) * 90,
  duration: 900 + ((i * 53) % 700),
  color: COLORS[i % COLORS.length],
  size: 6 + (i % 4) * 2,
  round: i % 3 === 0,
}));

/**
 * A short, decorative confetti burst rendered over its (relatively positioned)
 * parent. Purely cosmetic and disabled under prefers-reduced-motion.
 */
export function Confetti({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden",
        className,
      )}
    >
      {PIECES.map((p, i) => (
        <span
          key={i}
          className={cn(
            "absolute top-0 block",
            p.round ? "rounded-full" : "rounded-[1px]",
          )}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration}ms ease-in ${p.delay}ms forwards`,
          }}
        />
      ))}
    </div>
  );
}

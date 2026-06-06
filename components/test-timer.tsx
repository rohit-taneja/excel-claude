"use client";

import * as React from "react";
import { Timer } from "lucide-react";

import { cn, formatDuration } from "@/lib/utils";

/**
 * Counts down from `durationSeconds`. Calls `onExpire` once when it reaches 0.
 */
export function TestTimer({
  durationSeconds,
  onExpire,
}: {
  durationSeconds: number;
  onExpire: () => void;
}) {
  const [remaining, setRemaining] = React.useState(durationSeconds);
  const expiredRef = React.useRef(false);
  const onExpireRef = React.useRef(onExpire);

  React.useEffect(() => {
    onExpireRef.current = onExpire;
  });

  React.useEffect(() => {
    const id = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0 && !expiredRef.current) {
          expiredRef.current = true;
          onExpireRef.current();
          clearInterval(id);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const low = remaining <= 30;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium tabular-nums",
        low
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "text-muted-foreground",
      )}
    >
      <Timer className="size-4" />
      {formatDuration(remaining)}
    </div>
  );
}

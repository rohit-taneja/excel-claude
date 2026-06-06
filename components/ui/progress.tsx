"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  // Animate from empty up to the target value on mount (and on change). The
  // initial render matches the server (0%), then eases to `value` once mounted.
  const [shown, setShown] = React.useState(0);
  React.useEffect(() => {
    // Defer to the next frame so the fill eases from 0 to the target (the
    // `motion-reduce` variant below removes the transition for reduced motion).
    const frame = requestAnimationFrame(() => setShown(value ?? 0));
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="relative h-full w-full flex-1 overflow-hidden bg-primary transition-transform duration-500 ease-out motion-reduce:transition-none"
        style={{ transform: `translateX(-${100 - shown}%)` }}
      >
        {/* A glossy sheen that travels across the filled portion. */}
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-1/3 animate-progress-sheen bg-white/45 motion-reduce:hidden"
        />
      </ProgressPrimitive.Indicator>
    </ProgressPrimitive.Root>
  );
}

export { Progress };

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A simple spinning indicator built on the Loader2 glyph. Honours
 * `prefers-reduced-motion` (the spin pauses) and exposes an accessible label.
 */
export function Spinner({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span role="status" aria-label={label} className="inline-flex">
      <Loader2
        className={cn(
          "size-4 animate-spin text-muted-foreground motion-reduce:animate-none",
          className,
        )}
      />
    </span>
  );
}

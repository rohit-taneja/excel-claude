"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A monospace formula entry field with a leading `fx` affordance. Users can
 * type the formula with or without a leading `=` (grading is tolerant).
 */
export function FormulaInput({
  value,
  onChange,
  placeholder = "=IF(A2>=50,\"Pass\",\"Fail\")",
  disabled,
  className,
}: {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-stretch overflow-hidden rounded-md border border-input bg-background shadow-sm focus-within:ring-1 focus-within:ring-ring",
        disabled && "opacity-60",
        className,
      )}
    >
      <span className="flex select-none items-center border-r bg-muted px-3 font-mono text-sm italic text-muted-foreground">
        fx
      </span>
      <input
        type="text"
        spellCheck={false}
        autoCapitalize="characters"
        autoComplete="off"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent px-3 py-2 font-mono text-sm outline-none placeholder:text-muted-foreground/60"
      />
    </div>
  );
}

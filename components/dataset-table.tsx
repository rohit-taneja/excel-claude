import * as React from "react";

import { cn } from "@/lib/utils";
import type { Dataset } from "@/lib/types";
import type { AppliedFormula } from "@/lib/evaluate";

function columnLetter(index: number): string {
  let n = index;
  let label = "";
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

/**
 * Render text with the "extra" whitespace that TRIM-style functions remove made
 * visible: leading/trailing spaces and any run of two or more internal spaces
 * are shown as faint dots. Ordinary single word-spaces are left as-is.
 */
function CellText({ value }: { value: string | number }) {
  if (typeof value === "number") return <>{value}</>;
  const text = value;
  if (text === "") return null;

  // Split into alternating space / non-space runs.
  const runs = text.match(/(\s+|\S+)/g) ?? [];
  return (
    <span className="whitespace-pre">
      {runs.map((run, i) => {
        const isSpace = /^\s+$/.test(run);
        if (!isSpace) return <React.Fragment key={i}>{run}</React.Fragment>;
        const isEdge = i === 0 || i === runs.length - 1;
        const isExtra = isEdge || run.length >= 2;
        if (!isExtra) return <React.Fragment key={i}>{run}</React.Fragment>;
        return (
          <span
            key={i}
            title={`${run.length} space${run.length === 1 ? "" : "s"}`}
            className="rounded-[2px] bg-amber-400/20 text-amber-700/70 dark:text-amber-300/60"
          >
            {"·".repeat(run.length)}
          </span>
        );
      })}
    </span>
  );
}

/**
 * Renders a dataset as a spreadsheet-like grid with column letters (A, B, …)
 * and row numbers, so question prompts can reference cells like Excel.
 *
 * When `applied` is provided (the output of `applyFormula`), the computed
 * results are written into the relevant column and animated in.
 */
export function DatasetTable({
  dataset,
  className,
  applied,
}: {
  dataset: Dataset;
  className?: string;
  applied?: AppliedFormula | null;
}) {
  const baseColCount = dataset.headers.length;
  const colCount = applied?.appended ? baseColCount + 1 : baseColCount;
  const headers = applied?.appended
    ? [...dataset.headers, applied.header]
    : dataset.headers;
  const resultCol = applied?.columnIndex ?? -1;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted/60 text-muted-foreground">
              <th className="w-10 border-b border-r px-2 py-1 text-center text-xs font-normal" />
              {Array.from({ length: colCount }).map((_, i) => (
                <th
                  key={i}
                  className={cn(
                    "border-b border-r px-3 py-1 text-center text-xs font-semibold last:border-r-0",
                    applied &&
                      i === resultCol &&
                      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                  )}
                >
                  {columnLetter(i)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="bg-muted/30 font-medium">
              <td className="border-b border-r bg-muted/60 px-2 py-1.5 text-center text-xs text-muted-foreground">
                1
              </td>
              {headers.map((h, i) => (
                <td
                  key={i}
                  className={cn(
                    "border-b border-r px-3 py-1.5 last:border-r-0",
                    applied && i === resultCol && "bg-emerald-500/10",
                  )}
                >
                  {h}
                </td>
              ))}
            </tr>
            {dataset.rows.map((row, r) => (
              <tr key={r} className="even:bg-muted/10">
                <td className="border-b border-r bg-muted/60 px-2 py-1.5 text-center text-xs text-muted-foreground">
                  {r + 2}
                </td>
                {Array.from({ length: colCount }).map((_, c) => {
                  const result =
                    applied && c === resultCol ? applied.values[r] : undefined;
                  if (result) {
                    return (
                      <td
                        key={c}
                        className={cn(
                          "animate-cell-fill border-b border-r px-3 py-1.5 font-mono tabular-nums last:border-r-0",
                          result.isValue
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : "bg-destructive/10 text-destructive",
                        )}
                        style={{ animationDelay: `${r * 60}ms` }}
                      >
                        {result.display}
                      </td>
                    );
                  }
                  return (
                    <td
                      key={c}
                      className={cn(
                        "border-b border-r px-3 py-1.5 tabular-nums last:border-r-0",
                        applied && c === resultCol && "bg-emerald-500/5",
                      )}
                    >
                      <CellText value={row[c] ?? ""} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {dataset.note ? (
        <p className="text-xs text-muted-foreground">{dataset.note}</p>
      ) : null}
    </div>
  );
}

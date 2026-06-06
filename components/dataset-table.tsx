import { cn } from "@/lib/utils";
import type { Dataset } from "@/lib/types";

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
 * Renders a dataset as a spreadsheet-like grid with column letters (A, B, …)
 * and row numbers, so question prompts can reference cells like Excel.
 */
export function DatasetTable({
  dataset,
  className,
}: {
  dataset: Dataset;
  className?: string;
}) {
  const colCount = dataset.headers.length;

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
                  className="border-b border-r px-3 py-1 text-center text-xs font-semibold last:border-r-0"
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
              {dataset.headers.map((h, i) => (
                <td
                  key={i}
                  className="border-b border-r px-3 py-1.5 last:border-r-0"
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
                {Array.from({ length: colCount }).map((_, c) => (
                  <td
                    key={c}
                    className="border-b border-r px-3 py-1.5 tabular-nums last:border-r-0"
                  >
                    {row[c] ?? ""}
                  </td>
                ))}
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

/**
 * Helpers for normalizing and inspecting Excel formulas so that grading does
 * not depend on exact string matching.
 */

/**
 * Normalize an Excel formula for safe comparison:
 * - strips a single leading `=`
 * - uppercases everything (Excel is case-insensitive)
 * - converts smart/curly quotes to straight quotes
 * - removes all whitespace (Excel ignores spaces between tokens)
 * - removes `$` absolute-reference markers
 * - treats `;` and `,` as the same argument separator (locale differences)
 */
export function normalizeFormula(input: string): string {
  if (!input) return "";
  let f = input.trim();
  if (f.startsWith("=")) f = f.slice(1);
  f = f.toUpperCase();
  f = f.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  f = f.replace(/\s+/g, "");
  f = f.replace(/\$/g, "");
  f = f.replace(/;/g, ",");
  return f;
}

const FUNCTION_RE = /([A-Z][A-Z0-9_.]*)\s*\(/gi;

/** Extract the unique, uppercased function names used in a formula. */
export function extractFunctions(input: string): string[] {
  if (!input) return [];
  const set = new Set<string>();
  const re = new RegExp(FUNCTION_RE);
  let match: RegExpExecArray | null;
  while ((match = re.exec(input)) !== null) {
    set.add(match[1].toUpperCase());
  }
  return [...set];
}

/** Normalize free text (case-insensitive, collapsed whitespace). */
export function normalizeText(input: string): string {
  return (input ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Compare two answers as numbers when both look numeric (ignoring currency
 * symbols, commas and percent signs); otherwise fall back to text comparison.
 */
export function answersEqual(a: string, b: string): boolean {
  const na = parseNumeric(a);
  const nb = parseNumeric(b);
  if (na !== null && nb !== null) {
    return Math.abs(na - nb) < 1e-6;
  }
  return normalizeText(a) === normalizeText(b);
}

function parseNumeric(value: string): number | null {
  if (value == null) return null;
  const cleaned = String(value)
    .trim()
    .replace(/[$₹€£,%\s]/g, "");
  if (cleaned === "" || Number.isNaN(Number(cleaned))) return null;
  return Number(cleaned);
}

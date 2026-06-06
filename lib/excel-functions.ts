/**
 * Catalogue of Excel functions surfaced by the formula autocomplete. The same
 * list also documents which functions the in-app evaluator (`lib/evaluate.ts`)
 * understands, so the two stay in sync.
 */

export interface ExcelFunctionDoc {
  /** Upper-case function name, e.g. "VLOOKUP". */
  name: string;
  /** Human-readable argument signature. */
  signature: string;
  /** One-line description shown in the autocomplete dropdown. */
  summary: string;
  /** Loose grouping used only for ordering/hints. */
  category: "Logic" | "Text" | "Lookup" | "Math" | "Statistical" | "Date";
}

export const EXCEL_FUNCTIONS: ExcelFunctionDoc[] = [
  // Logic
  {
    name: "IF",
    signature: "IF(condition, value_if_true, value_if_false)",
    summary: "Returns one value when a test is TRUE and another when FALSE.",
    category: "Logic",
  },
  {
    name: "IFS",
    signature: "IFS(test1, value1, [test2, value2], …)",
    summary: "Checks multiple conditions in order and returns the first match.",
    category: "Logic",
  },
  {
    name: "IFERROR",
    signature: "IFERROR(value, value_if_error)",
    summary: "Returns a fallback when a formula evaluates to an error.",
    category: "Logic",
  },
  {
    name: "AND",
    signature: "AND(logical1, [logical2], …)",
    summary: "TRUE only when every condition is TRUE.",
    category: "Logic",
  },
  {
    name: "OR",
    signature: "OR(logical1, [logical2], …)",
    summary: "TRUE when at least one condition is TRUE.",
    category: "Logic",
  },
  {
    name: "NOT",
    signature: "NOT(logical)",
    summary: "Reverses a TRUE/FALSE value.",
    category: "Logic",
  },
  {
    name: "ISNUMBER",
    signature: "ISNUMBER(value)",
    summary: "TRUE when the value is a number.",
    category: "Logic",
  },
  {
    name: "ISBLANK",
    signature: "ISBLANK(value)",
    summary: "TRUE when the cell is empty.",
    category: "Logic",
  },

  // Text
  {
    name: "TRIM",
    signature: "TRIM(text)",
    summary: "Removes leading, trailing and double spaces from text.",
    category: "Text",
  },
  {
    name: "UPPER",
    signature: "UPPER(text)",
    summary: "Converts text to UPPERCASE.",
    category: "Text",
  },
  {
    name: "LOWER",
    signature: "LOWER(text)",
    summary: "Converts text to lowercase.",
    category: "Text",
  },
  {
    name: "PROPER",
    signature: "PROPER(text)",
    summary: "Capitalises The First Letter Of Each Word.",
    category: "Text",
  },
  {
    name: "LEFT",
    signature: "LEFT(text, [num_chars])",
    summary: "Returns characters from the start of the text.",
    category: "Text",
  },
  {
    name: "RIGHT",
    signature: "RIGHT(text, [num_chars])",
    summary: "Returns characters from the end of the text.",
    category: "Text",
  },
  {
    name: "MID",
    signature: "MID(text, start_num, num_chars)",
    summary: "Returns characters from the middle of the text.",
    category: "Text",
  },
  {
    name: "LEN",
    signature: "LEN(text)",
    summary: "Counts the number of characters in text.",
    category: "Text",
  },
  {
    name: "CONCAT",
    signature: "CONCAT(text1, [text2], …)",
    summary: "Joins several pieces of text into one.",
    category: "Text",
  },
  {
    name: "CONCATENATE",
    signature: "CONCATENATE(text1, [text2], …)",
    summary: "Joins text values (legacy version of CONCAT).",
    category: "Text",
  },
  {
    name: "TEXTJOIN",
    signature: "TEXTJOIN(delimiter, ignore_empty, text1, …)",
    summary: "Joins text with a delimiter between each piece.",
    category: "Text",
  },
  {
    name: "SUBSTITUTE",
    signature: "SUBSTITUTE(text, old_text, new_text, [instance])",
    summary: "Replaces matching text with new text.",
    category: "Text",
  },
  {
    name: "REPLACE",
    signature: "REPLACE(old_text, start, num_chars, new_text)",
    summary: "Replaces characters by position.",
    category: "Text",
  },
  {
    name: "FIND",
    signature: "FIND(find_text, within_text, [start])",
    summary: "Case-sensitive position of text within text.",
    category: "Text",
  },
  {
    name: "SEARCH",
    signature: "SEARCH(find_text, within_text, [start])",
    summary: "Case-insensitive position of text within text.",
    category: "Text",
  },
  {
    name: "EXACT",
    signature: "EXACT(text1, text2)",
    summary: "TRUE when two strings match exactly (case-sensitive).",
    category: "Text",
  },
  {
    name: "CLEAN",
    signature: "CLEAN(text)",
    summary: "Removes non-printable characters from text.",
    category: "Text",
  },
  {
    name: "VALUE",
    signature: "VALUE(text)",
    summary: "Converts text that looks like a number into a number.",
    category: "Text",
  },
  {
    name: "TEXT",
    signature: "TEXT(value, format_text)",
    summary: "Formats a number as text using a pattern.",
    category: "Text",
  },

  // Lookup
  {
    name: "VLOOKUP",
    signature: "VLOOKUP(lookup, table, col_index, [exact])",
    summary: "Looks up a value in the first column of a table.",
    category: "Lookup",
  },
  {
    name: "HLOOKUP",
    signature: "HLOOKUP(lookup, table, row_index, [exact])",
    summary: "Looks up a value in the first row of a table.",
    category: "Lookup",
  },
  {
    name: "XLOOKUP",
    signature: "XLOOKUP(lookup, lookup_array, return_array, [if_not_found])",
    summary: "Flexible lookup that returns a matching value.",
    category: "Lookup",
  },
  {
    name: "INDEX",
    signature: "INDEX(array, row_num, [col_num])",
    summary: "Returns a value at a position in a range.",
    category: "Lookup",
  },
  {
    name: "MATCH",
    signature: "MATCH(lookup, array, [match_type])",
    summary: "Returns the position of a value in a range.",
    category: "Lookup",
  },

  // Math & statistical
  {
    name: "SUM",
    signature: "SUM(number1, [number2], …)",
    summary: "Adds up numbers or ranges.",
    category: "Math",
  },
  {
    name: "SUMIF",
    signature: "SUMIF(range, criteria, [sum_range])",
    summary: "Adds cells that meet one condition.",
    category: "Math",
  },
  {
    name: "SUMIFS",
    signature: "SUMIFS(sum_range, criteria_range1, criteria1, …)",
    summary: "Adds cells that meet several conditions.",
    category: "Math",
  },
  {
    name: "ROUND",
    signature: "ROUND(number, num_digits)",
    summary: "Rounds a number to a set number of digits.",
    category: "Math",
  },
  {
    name: "ROUNDUP",
    signature: "ROUNDUP(number, num_digits)",
    summary: "Rounds a number up, away from zero.",
    category: "Math",
  },
  {
    name: "ROUNDDOWN",
    signature: "ROUNDDOWN(number, num_digits)",
    summary: "Rounds a number down, toward zero.",
    category: "Math",
  },
  {
    name: "ABS",
    signature: "ABS(number)",
    summary: "Returns the absolute (positive) value.",
    category: "Math",
  },
  {
    name: "INT",
    signature: "INT(number)",
    summary: "Rounds a number down to the nearest integer.",
    category: "Math",
  },
  {
    name: "MIN",
    signature: "MIN(number1, [number2], …)",
    summary: "Returns the smallest value.",
    category: "Statistical",
  },
  {
    name: "MAX",
    signature: "MAX(number1, [number2], …)",
    summary: "Returns the largest value.",
    category: "Statistical",
  },
  {
    name: "AVERAGE",
    signature: "AVERAGE(number1, [number2], …)",
    summary: "Returns the arithmetic mean.",
    category: "Statistical",
  },
  {
    name: "AVERAGEIF",
    signature: "AVERAGEIF(range, criteria, [average_range])",
    summary: "Averages cells that meet one condition.",
    category: "Statistical",
  },
  {
    name: "AVERAGEIFS",
    signature: "AVERAGEIFS(average_range, criteria_range1, criteria1, …)",
    summary: "Averages cells that meet several conditions.",
    category: "Statistical",
  },
  {
    name: "COUNT",
    signature: "COUNT(value1, [value2], …)",
    summary: "Counts how many cells contain numbers.",
    category: "Statistical",
  },
  {
    name: "COUNTA",
    signature: "COUNTA(value1, [value2], …)",
    summary: "Counts how many cells are not empty.",
    category: "Statistical",
  },
  {
    name: "COUNTIF",
    signature: "COUNTIF(range, criteria)",
    summary: "Counts cells that meet one condition.",
    category: "Statistical",
  },
  {
    name: "COUNTIFS",
    signature: "COUNTIFS(criteria_range1, criteria1, …)",
    summary: "Counts cells that meet several conditions.",
    category: "Statistical",
  },
];

/** All known function names, upper-case. */
export const EXCEL_FUNCTION_NAMES: string[] = EXCEL_FUNCTIONS.map(
  (f) => f.name,
);

const byName = new Map(EXCEL_FUNCTIONS.map((f) => [f.name, f]));

export function getFunctionDoc(name: string): ExcelFunctionDoc | undefined {
  return byName.get(name.toUpperCase());
}

/**
 * Return up to `limit` function docs whose name starts with (then merely
 * contains) the given fragment, ranked so prefix matches come first.
 */
export function searchFunctions(
  fragment: string,
  limit = 8,
): ExcelFunctionDoc[] {
  const q = fragment.trim().toUpperCase();
  if (!q) return [];
  const prefix: ExcelFunctionDoc[] = [];
  const contains: ExcelFunctionDoc[] = [];
  for (const fn of EXCEL_FUNCTIONS) {
    if (fn.name.startsWith(q)) prefix.push(fn);
    else if (fn.name.includes(q)) contains.push(fn);
  }
  return [...prefix, ...contains].slice(0, limit);
}

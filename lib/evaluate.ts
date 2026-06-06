/**
 * A small, dependency-free Excel formula evaluator used to "apply" a learner's
 * formula to the mini-grid shown beside a question and display the result —
 * just like typing the formula into a real spreadsheet cell.
 *
 * It is intentionally scoped to the functions exercised by the question bank
 * (see `lib/excel-functions.ts`). Anything it cannot evaluate returns a normal
 * Excel error value (#NAME?, #VALUE!, #N/A, …) rather than throwing.
 */

import type { Dataset } from "./types";

/* ------------------------------------------------------------------ */
/* Values & errors                                                     */
/* ------------------------------------------------------------------ */

export class ExcelError {
  constructor(public readonly code: string) {}
  toString() {
    return this.code;
  }
}

const ERR = {
  value: () => new ExcelError("#VALUE!"),
  name: () => new ExcelError("#NAME?"),
  na: () => new ExcelError("#N/A"),
  div0: () => new ExcelError("#DIV/0!"),
  ref: () => new ExcelError("#REF!"),
  num: () => new ExcelError("#NUM!"),
} as const;

type Scalar = number | string | boolean | ExcelError;

interface RangeValue {
  kind: "range";
  /** Row-major grid of cell values within the range. */
  cells: Scalar[][];
}

type Value = Scalar | RangeValue;

function isRange(v: Value): v is RangeValue {
  return typeof v === "object" && v !== null && (v as RangeValue).kind === "range";
}

function isError(v: Value): v is ExcelError {
  return v instanceof ExcelError;
}

/* ------------------------------------------------------------------ */
/* Tokenizer                                                           */
/* ------------------------------------------------------------------ */

type TokenType =
  | "number"
  | "string"
  | "ident"
  | "op"
  | "lparen"
  | "rparen"
  | "comma";

interface Token {
  type: TokenType;
  value: string;
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = input.length;

  while (i < n) {
    const ch = input[i];

    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      i++;
      continue;
    }

    // String literal "…" with "" as an escaped quote.
    if (ch === '"') {
      let str = "";
      i++;
      while (i < n) {
        if (input[i] === '"') {
          if (input[i + 1] === '"') {
            str += '"';
            i += 2;
            continue;
          }
          i++;
          break;
        }
        str += input[i++];
      }
      tokens.push({ type: "string", value: str });
      continue;
    }

    // Number (a leading sign is handled by the parser as a unary op).
    if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(input[i + 1] ?? ""))) {
      let num = "";
      while (i < n && /[0-9.]/.test(input[i])) num += input[i++];
      tokens.push({ type: "number", value: num });
      continue;
    }

    // Identifier / cell reference (TRUE, FALSE, SUM, A2, $B$3, …).
    if (/[A-Za-z_$]/.test(ch)) {
      let id = "";
      while (i < n && /[A-Za-z0-9_$.]/.test(input[i])) id += input[i++];
      tokens.push({ type: "ident", value: id });
      continue;
    }

    // Multi-character operators first.
    const two = input.slice(i, i + 2);
    if (two === "<=" || two === ">=" || two === "<>") {
      tokens.push({ type: "op", value: two });
      i += 2;
      continue;
    }

    if ("+-*/^&=<>%".includes(ch)) {
      tokens.push({ type: "op", value: ch });
      i++;
      continue;
    }
    if (ch === "(") {
      tokens.push({ type: "lparen", value: ch });
      i++;
      continue;
    }
    if (ch === ")") {
      tokens.push({ type: "rparen", value: ch });
      i++;
      continue;
    }
    if (ch === "," || ch === ";") {
      tokens.push({ type: "comma", value: "," });
      i++;
      continue;
    }
    if (ch === ":") {
      tokens.push({ type: "op", value: ":" });
      i++;
      continue;
    }

    // Unknown character — bail out so the caller surfaces a parse error.
    throw new ParseError(`Unexpected character "${ch}"`);
  }

  return tokens;
}

class ParseError extends Error {}

/* ------------------------------------------------------------------ */
/* AST                                                                 */
/* ------------------------------------------------------------------ */

type Node =
  | { type: "number"; value: number }
  | { type: "string"; value: string }
  | { type: "bool"; value: boolean }
  | { type: "ref"; col: number; colAbs: boolean; row: number; rowAbs: boolean }
  | { type: "range"; from: Extract<Node, { type: "ref" }>; to: Extract<Node, { type: "ref" }> }
  | { type: "unary"; op: string; operand: Node }
  | { type: "postfix"; op: string; operand: Node }
  | { type: "binary"; op: string; left: Node; right: Node }
  | { type: "call"; name: string; args: Node[] };

const CELL_RE = /^(\$?)([A-Za-z]{1,3})(\$?)(\d+)$/;

function colToIndex(letters: string): number {
  let n = 0;
  for (const c of letters.toUpperCase()) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
}

function parseRef(id: string): Extract<Node, { type: "ref" }> | null {
  const m = CELL_RE.exec(id);
  if (!m) return null;
  return {
    type: "ref",
    colAbs: m[1] === "$",
    col: colToIndex(m[2]),
    rowAbs: m[3] === "$",
    row: Number(m[4]),
  };
}

class Parser {
  private pos = 0;
  constructor(private readonly tokens: Token[]) {}

  parse(): Node {
    const node = this.parseExpression();
    if (this.pos < this.tokens.length) {
      throw new ParseError("Unexpected trailing input");
    }
    return node;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private next(): Token {
    const t = this.tokens[this.pos++];
    if (!t) throw new ParseError("Unexpected end of formula");
    return t;
  }

  private expect(type: TokenType): Token {
    const t = this.next();
    if (t.type !== type) throw new ParseError(`Expected ${type}`);
    return t;
  }

  // expression := comparison
  private parseExpression(): Node {
    return this.parseComparison();
  }

  private parseComparison(): Node {
    let left = this.parseConcat();
    while (
      this.peek()?.type === "op" &&
      ["=", "<>", "<", ">", "<=", ">="].includes(this.peek()!.value)
    ) {
      const op = this.next().value;
      const right = this.parseConcat();
      left = { type: "binary", op, left, right };
    }
    return left;
  }

  private parseConcat(): Node {
    let left = this.parseAdditive();
    while (this.peek()?.type === "op" && this.peek()!.value === "&") {
      this.next();
      const right = this.parseAdditive();
      left = { type: "binary", op: "&", left, right };
    }
    return left;
  }

  private parseAdditive(): Node {
    let left = this.parseMultiplicative();
    while (
      this.peek()?.type === "op" &&
      ["+", "-"].includes(this.peek()!.value)
    ) {
      const op = this.next().value;
      const right = this.parseMultiplicative();
      left = { type: "binary", op, left, right };
    }
    return left;
  }

  private parseMultiplicative(): Node {
    let left = this.parsePower();
    while (
      this.peek()?.type === "op" &&
      ["*", "/"].includes(this.peek()!.value)
    ) {
      const op = this.next().value;
      const right = this.parsePower();
      left = { type: "binary", op, left, right };
    }
    return left;
  }

  private parsePower(): Node {
    const left = this.parseUnary();
    if (this.peek()?.type === "op" && this.peek()!.value === "^") {
      this.next();
      const right = this.parsePower(); // right-associative
      return { type: "binary", op: "^", left, right };
    }
    return left;
  }

  private parseUnary(): Node {
    if (
      this.peek()?.type === "op" &&
      ["+", "-"].includes(this.peek()!.value)
    ) {
      const op = this.next().value;
      return { type: "unary", op, operand: this.parseUnary() };
    }
    return this.parsePostfix();
  }

  private parsePostfix(): Node {
    let node = this.parsePrimary();
    while (this.peek()?.type === "op" && this.peek()!.value === "%") {
      this.next();
      node = { type: "postfix", op: "%", operand: node };
    }
    return node;
  }

  private parsePrimary(): Node {
    const t = this.peek();
    if (!t) throw new ParseError("Unexpected end of formula");

    if (t.type === "number") {
      this.next();
      return { type: "number", value: Number(t.value) };
    }
    if (t.type === "string") {
      this.next();
      return { type: "string", value: t.value };
    }
    if (t.type === "lparen") {
      this.next();
      const expr = this.parseExpression();
      this.expect("rparen");
      return expr;
    }
    if (t.type === "ident") {
      this.next();
      // Function call?
      if (this.peek()?.type === "lparen") {
        this.next();
        const args: Node[] = [];
        if (this.peek()?.type !== "rparen") {
          args.push(this.parseExpression());
          while (this.peek()?.type === "comma") {
            this.next();
            args.push(this.parseExpression());
          }
        }
        this.expect("rparen");
        return { type: "call", name: t.value.toUpperCase(), args };
      }
      // Boolean literal?
      const upper = t.value.toUpperCase();
      if (upper === "TRUE") return { type: "bool", value: true };
      if (upper === "FALSE") return { type: "bool", value: false };
      // Cell reference, optionally a range.
      const ref = parseRef(t.value);
      if (!ref) throw new ParseError(`Unknown name "${t.value}"`);
      if (this.peek()?.type === "op" && this.peek()!.value === ":") {
        this.next();
        const toTok = this.expect("ident");
        const toRef = parseRef(toTok.value);
        if (!toRef) throw new ParseError(`Invalid range end "${toTok.value}"`);
        return { type: "range", from: ref, to: toRef };
      }
      return ref;
    }
    throw new ParseError(`Unexpected token "${t.value}"`);
  }
}

/* ------------------------------------------------------------------ */
/* Evaluation context                                                  */
/* ------------------------------------------------------------------ */

export interface EvalContext {
  headers: string[];
  rows: (string | number)[][];
  /**
   * Row shift applied to relative references, used when a formula written for
   * the first data row (row 2) is filled down to row 2 + rowOffset.
   */
  rowOffset: number;
}

/** Resolve a spreadsheet cell (1-based row; row 1 = the header row). */
function cellAt(ctx: EvalContext, col: number, row: number): Scalar {
  if (col < 0 || row < 1) return ERR.ref();
  if (row === 1) {
    const h = ctx.headers[col];
    return h ?? "";
  }
  const dataRow = ctx.rows[row - 2];
  if (!dataRow) return "";
  const v = dataRow[col];
  return v ?? "";
}

function effectiveRow(ref: Extract<Node, { type: "ref" }>, ctx: EvalContext): number {
  return ref.rowAbs ? ref.row : ref.row + ctx.rowOffset;
}

/* ------------------------------------------------------------------ */
/* Coercion helpers                                                    */
/* ------------------------------------------------------------------ */

function toNumber(v: Scalar): number | ExcelError {
  if (isError(v)) return v;
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  const s = v.trim();
  if (s === "") return 0;
  const cleaned = s.replace(/[$₹€£,%\s]/g, "");
  const num = Number(cleaned);
  if (Number.isNaN(num)) return ERR.value();
  return num;
}

function toText(v: Scalar): string | ExcelError {
  if (isError(v)) return v;
  if (typeof v === "string") return v;
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  return formatNumber(v);
}

function toBool(v: Scalar): boolean | ExcelError {
  if (isError(v)) return v;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  const s = v.trim().toUpperCase();
  if (s === "TRUE") return true;
  if (s === "FALSE") return false;
  if (s === "") return false;
  const num = Number(s);
  if (!Number.isNaN(num)) return num !== 0;
  return ERR.value();
}

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return "#NUM!";
  // Trim floating-point noise while keeping reasonable precision.
  const rounded = Math.round(n * 1e10) / 1e10;
  return String(rounded);
}

/** Collapse a range/scalar down to the flat list of cell values. */
function flatten(v: Value): Scalar[] {
  if (isRange(v)) return v.cells.flat();
  return [v];
}

/* ------------------------------------------------------------------ */
/* Criteria matching (SUMIF/COUNTIF family)                            */
/* ------------------------------------------------------------------ */

function matchesCriteria(cell: Scalar, criteria: Scalar): boolean {
  if (isError(cell) || isError(criteria)) return false;
  const critText = typeof criteria === "string" ? criteria : String(criteria);
  const m = /^(<=|>=|<>|=|<|>)?(.*)$/.exec(critText.trim());
  const op = (m?.[1] ?? "").trim();
  const rhsRaw = (m?.[2] ?? "").trim();

  const rhsNum = Number(rhsRaw);
  const cellNum = typeof cell === "number" ? cell : Number(String(cell).trim());
  const bothNumeric = !Number.isNaN(rhsNum) && !Number.isNaN(cellNum) && String(cell).trim() !== "";

  switch (op) {
    case "<":
      return bothNumeric && cellNum < rhsNum;
    case "<=":
      return bothNumeric && cellNum <= rhsNum;
    case ">":
      return bothNumeric && cellNum > rhsNum;
    case ">=":
      return bothNumeric && cellNum >= rhsNum;
    case "<>":
      return !looseEquals(cell, rhsRaw);
    case "=":
    case "":
    default:
      return looseEquals(cell, rhsRaw);
  }
}

function looseEquals(cell: Scalar, rhs: string): boolean {
  // Wildcards: * (any run) and ? (single char).
  if (/[*?]/.test(rhs)) {
    const re = new RegExp(
      "^" +
        rhs
          .replace(/[.+^${}()|[\]\\]/g, "\\$&")
          .replace(/\*/g, ".*")
          .replace(/\?/g, ".") +
        "$",
      "i",
    );
    return re.test(String(cell));
  }
  const rhsNum = Number(rhs);
  if (!Number.isNaN(rhsNum) && rhs.trim() !== "") {
    const cellNum = typeof cell === "number" ? cell : Number(String(cell).trim());
    if (!Number.isNaN(cellNum) && String(cell).trim() !== "") return cellNum === rhsNum;
  }
  return String(cell).trim().toLowerCase() === rhs.trim().toLowerCase();
}

/* ------------------------------------------------------------------ */
/* Evaluator                                                           */
/* ------------------------------------------------------------------ */

function evalNode(node: Node, ctx: EvalContext): Value {
  switch (node.type) {
    case "number":
      return node.value;
    case "string":
      return node.value;
    case "bool":
      return node.value;
    case "ref":
      return cellAt(ctx, node.col, effectiveRow(node, ctx));
    case "range": {
      const r1 = effectiveRow(node.from, ctx);
      const r2 = effectiveRow(node.to, ctx);
      const c1 = node.from.col;
      const c2 = node.to.col;
      const rowStart = Math.min(r1, r2);
      const rowEnd = Math.max(r1, r2);
      const colStart = Math.min(c1, c2);
      const colEnd = Math.max(c1, c2);
      const cells: Scalar[][] = [];
      for (let r = rowStart; r <= rowEnd; r++) {
        const rowCells: Scalar[] = [];
        for (let c = colStart; c <= colEnd; c++) rowCells.push(cellAt(ctx, c, r));
        cells.push(rowCells);
      }
      return { kind: "range", cells };
    }
    case "unary": {
      const v = scalar(evalNode(node.operand, ctx));
      if (isError(v)) return v;
      const num = toNumber(v);
      if (isError(num)) return num;
      return node.op === "-" ? -num : num;
    }
    case "postfix": {
      const v = scalar(evalNode(node.operand, ctx));
      const num = toNumber(v as Scalar);
      if (isError(num)) return num;
      return num / 100; // only "%" is supported
    }
    case "binary":
      return evalBinary(node, ctx);
    case "call":
      return evalCall(node, ctx);
  }
}

/** Reduce a range to a single value via implicit-intersection-ish rules. */
function scalar(v: Value): Scalar {
  if (isRange(v)) {
    const flat = v.cells.flat();
    if (flat.length === 1) return flat[0];
    return ERR.value();
  }
  return v;
}

function evalBinary(node: Extract<Node, { type: "binary" }>, ctx: EvalContext): Value {
  const op = node.op;
  const left = scalar(evalNode(node.left, ctx));
  const right = scalar(evalNode(node.right, ctx));
  if (isError(left)) return left;
  if (isError(right)) return right;

  if (op === "&") {
    const a = toText(left);
    if (isError(a)) return a;
    const b = toText(right);
    if (isError(b)) return b;
    return a + b;
  }

  if (["=", "<>", "<", ">", "<=", ">="].includes(op)) {
    return compare(left, right, op);
  }

  const a = toNumber(left);
  if (isError(a)) return a;
  const b = toNumber(right);
  if (isError(b)) return b;
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      return b === 0 ? ERR.div0() : a / b;
    case "^":
      return Math.pow(a, b);
  }
  return ERR.value();
}

function compare(a: Scalar, b: Scalar, op: string): boolean {
  let cmp: number;
  if (typeof a === "number" && typeof b === "number") {
    cmp = a < b ? -1 : a > b ? 1 : 0;
  } else if (typeof a === "boolean" || typeof b === "boolean") {
    const an = typeof a === "boolean" ? (a ? 1 : 0) : Number(a);
    const bn = typeof b === "boolean" ? (b ? 1 : 0) : Number(b);
    cmp = an < bn ? -1 : an > bn ? 1 : 0;
  } else {
    const as = String(a).toLowerCase();
    const bs = String(b).toLowerCase();
    cmp = as < bs ? -1 : as > bs ? 1 : 0;
  }
  switch (op) {
    case "=":
      return cmp === 0;
    case "<>":
      return cmp !== 0;
    case "<":
      return cmp < 0;
    case ">":
      return cmp > 0;
    case "<=":
      return cmp <= 0;
    case ">=":
      return cmp >= 0;
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* Function implementations                                            */
/* ------------------------------------------------------------------ */

function evalCall(node: Extract<Node, { type: "call" }>, ctx: EvalContext): Value {
  const name = node.name;

  // IFERROR / IF need lazy-ish handling of errors, so evaluate args inside.
  const argValues = () => node.args.map((a) => evalNode(a, ctx));
  const scalars = () => node.args.map((a) => scalar(evalNode(a, ctx)));

  switch (name) {
    /* ---- Logic ---- */
    case "IF": {
      const cond = toBool(scalar(evalNode(node.args[0], ctx)));
      if (isError(cond)) return cond;
      const branch = cond ? node.args[1] : node.args[2];
      if (!branch) return cond ? ERR.value() : false;
      return scalar(evalNode(branch, ctx));
    }
    case "IFS": {
      for (let i = 0; i + 1 < node.args.length; i += 2) {
        const cond = toBool(scalar(evalNode(node.args[i], ctx)));
        if (isError(cond)) return cond;
        if (cond) return scalar(evalNode(node.args[i + 1], ctx));
      }
      return ERR.na();
    }
    case "IFERROR": {
      const v = scalar(evalNode(node.args[0], ctx));
      if (isError(v)) return scalar(evalNode(node.args[1], ctx));
      return v;
    }
    case "AND": {
      const vals = flattenAll(argValues());
      for (const v of vals) {
        const b = toBool(v);
        if (isError(b)) return b;
        if (!b) return false;
      }
      return true;
    }
    case "OR": {
      const vals = flattenAll(argValues());
      for (const v of vals) {
        const b = toBool(v);
        if (isError(b)) return b;
        if (b) return true;
      }
      return false;
    }
    case "NOT": {
      const b = toBool(scalars()[0]);
      if (isError(b)) return b;
      return !b;
    }
    case "ISNUMBER": {
      const v = scalars()[0];
      return typeof v === "number";
    }
    case "ISBLANK": {
      const v = scalars()[0];
      return v === "" || v == null;
    }
    case "ISERROR": {
      return isError(scalars()[0]);
    }

    /* ---- Text ---- */
    case "TRIM": {
      const t = reqText(scalars()[0]);
      if (isError(t)) return t;
      return t.replace(/\s+/g, " ").trim();
    }
    case "CLEAN": {
      const t = reqText(scalars()[0]);
      if (isError(t)) return t;
      // eslint-disable-next-line no-control-regex
      return t.replace(/[\x00-\x1F]/g, "");
    }
    case "UPPER": {
      const t = reqText(scalars()[0]);
      return isError(t) ? t : t.toUpperCase();
    }
    case "LOWER": {
      const t = reqText(scalars()[0]);
      return isError(t) ? t : t.toLowerCase();
    }
    case "PROPER": {
      const t = reqText(scalars()[0]);
      if (isError(t)) return t;
      return t.replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\B\w/g, (c) => c.toLowerCase());
    }
    case "LEFT": {
      const args = scalars();
      const t = reqText(args[0]);
      if (isError(t)) return t;
      const num = args[1] == null ? 1 : reqNum(args[1]);
      if (isError(num)) return num;
      return t.slice(0, Math.max(0, Math.floor(num)));
    }
    case "RIGHT": {
      const args = scalars();
      const t = reqText(args[0]);
      if (isError(t)) return t;
      const num = args[1] == null ? 1 : reqNum(args[1]);
      if (isError(num)) return num;
      const k = Math.max(0, Math.floor(num));
      return k === 0 ? "" : t.slice(-k);
    }
    case "MID": {
      const args = scalars();
      const t = reqText(args[0]);
      if (isError(t)) return t;
      const start = reqNum(args[1]);
      if (isError(start)) return start;
      const len = reqNum(args[2]);
      if (isError(len)) return len;
      if (start < 1) return ERR.value();
      return t.slice(Math.floor(start) - 1, Math.floor(start) - 1 + Math.max(0, Math.floor(len)));
    }
    case "LEN": {
      const t = reqText(scalars()[0]);
      return isError(t) ? t : t.length;
    }
    case "CONCAT":
    case "CONCATENATE": {
      let out = "";
      for (const v of flattenAll(argValues())) {
        const t = toText(v);
        if (isError(t)) return t;
        out += t;
      }
      return out;
    }
    case "TEXTJOIN": {
      const all = argValues();
      const delim = toText(scalar(all[0]));
      if (isError(delim)) return delim;
      const ignoreEmpty = toBool(scalar(all[1]));
      if (isError(ignoreEmpty)) return ignoreEmpty;
      const parts: string[] = [];
      for (const v of flattenAll(all.slice(2))) {
        const t = toText(v);
        if (isError(t)) return t;
        if (ignoreEmpty && t === "") continue;
        parts.push(t);
      }
      return parts.join(delim);
    }
    case "SUBSTITUTE": {
      const args = scalars();
      const t = reqText(args[0]);
      if (isError(t)) return t;
      const oldT = reqText(args[1]);
      if (isError(oldT)) return oldT;
      const newT = reqText(args[2]);
      if (isError(newT)) return newT;
      if (oldT === "") return t;
      if (args[3] != null) {
        const inst = reqNum(args[3]);
        if (isError(inst)) return inst;
        let count = 0;
        let idx = 0;
        let result = t;
        while ((idx = result.indexOf(oldT, idx)) !== -1) {
          count++;
          if (count === Math.floor(inst)) {
            result = result.slice(0, idx) + newT + result.slice(idx + oldT.length);
            break;
          }
          idx += oldT.length;
        }
        return result;
      }
      return t.split(oldT).join(newT);
    }
    case "REPLACE": {
      const args = scalars();
      const t = reqText(args[0]);
      if (isError(t)) return t;
      const start = reqNum(args[1]);
      if (isError(start)) return start;
      const numChars = reqNum(args[2]);
      if (isError(numChars)) return numChars;
      const newT = reqText(args[3]);
      if (isError(newT)) return newT;
      const s = Math.floor(start) - 1;
      return t.slice(0, s) + newT + t.slice(s + Math.floor(numChars));
    }
    case "FIND":
    case "SEARCH": {
      const args = scalars();
      const find = reqText(args[0]);
      if (isError(find)) return find;
      const within = reqText(args[1]);
      if (isError(within)) return within;
      const start = args[2] == null ? 1 : reqNum(args[2]);
      if (isError(start)) return start;
      const hay = name === "SEARCH" ? within.toLowerCase() : within;
      const needle = name === "SEARCH" ? find.toLowerCase() : find;
      const idx = hay.indexOf(needle, Math.floor(start) - 1);
      return idx === -1 ? ERR.value() : idx + 1;
    }
    case "EXACT": {
      const args = scalars();
      const a = reqText(args[0]);
      if (isError(a)) return a;
      const b = reqText(args[1]);
      if (isError(b)) return b;
      return a === b;
    }
    case "VALUE": {
      const t = reqText(scalars()[0]);
      if (isError(t)) return t;
      return reqNum(t);
    }
    case "TEXT": {
      const args = scalars();
      const num = reqNum(args[0]);
      if (isError(num)) return num;
      const fmt = reqText(args[1]);
      if (isError(fmt)) return fmt;
      return formatWithPattern(num, fmt);
    }

    /* ---- Lookup ---- */
    case "VLOOKUP":
      return vlookup(node, ctx, "v");
    case "HLOOKUP":
      return vlookup(node, ctx, "h");
    case "XLOOKUP":
      return xlookup(node, ctx);
    case "INDEX":
      return indexFn(node, ctx);
    case "MATCH":
      return matchFn(node, ctx);

    /* ---- Math / statistical ---- */
    case "SUM":
      return reduceNumbers(argValues(), 0, (acc, n) => acc + n);
    case "MIN":
      return reduceNumbers(argValues(), Infinity, Math.min, 0);
    case "MAX":
      return reduceNumbers(argValues(), -Infinity, Math.max, 0);
    case "AVERAGE": {
      const nums = collectNumbers(argValues());
      if (isError(nums)) return nums;
      if (nums.length === 0) return ERR.div0();
      return nums.reduce((a, b) => a + b, 0) / nums.length;
    }
    case "COUNT": {
      const nums = collectNumbers(argValues(), true);
      return isError(nums) ? nums : nums.length;
    }
    case "COUNTA": {
      return flattenAll(argValues()).filter((v) => !(v === "" || v == null)).length;
    }
    case "ROUND":
    case "ROUNDUP":
    case "ROUNDDOWN": {
      const args = scalars();
      const num = reqNum(args[0]);
      if (isError(num)) return num;
      const digits = args[1] == null ? 0 : reqNum(args[1]);
      if (isError(digits)) return digits;
      const factor = Math.pow(10, Math.floor(digits));
      const scaled = num * factor;
      const rounded =
        name === "ROUNDUP"
          ? Math.sign(scaled) * Math.ceil(Math.abs(scaled))
          : name === "ROUNDDOWN"
            ? Math.sign(scaled) * Math.floor(Math.abs(scaled))
            : Math.round(scaled);
      return rounded / factor;
    }
    case "ABS": {
      const num = reqNum(scalars()[0]);
      return isError(num) ? num : Math.abs(num);
    }
    case "INT": {
      const num = reqNum(scalars()[0]);
      return isError(num) ? num : Math.floor(num);
    }
    case "SUMIF":
      return sumif(scalarsAndRanges(node, ctx));
    case "SUMIFS":
      return sumifs(node, ctx);
    case "COUNTIF": {
      const all = argValues();
      const range = flatten(all[0]);
      const crit = scalar(all[1]);
      return range.filter((c) => matchesCriteria(c, crit)).length;
    }
    case "COUNTIFS":
      return countifs(node, ctx);
    case "AVERAGEIF": {
      const res = sumif(scalarsAndRanges(node, ctx), true);
      return res;
    }
    case "AVERAGEIFS":
      return averageifs(node, ctx);
  }

  return ERR.name();
}

/* --- function helpers --- */

function reqText(v: Scalar): string | ExcelError {
  return toText(v);
}
function reqNum(v: Scalar): number | ExcelError {
  return toNumber(v);
}

function flattenAll(values: Value[]): Scalar[] {
  return values.flatMap((v) => flatten(v));
}

function collectNumbers(values: Value[], strict = false): number[] | ExcelError {
  const out: number[] = [];
  for (const s of flattenAll(values)) {
    if (isError(s)) return s;
    if (typeof s === "number") {
      out.push(s);
    } else if (!strict) {
      if (s === "" || typeof s === "boolean") continue;
      const num = Number(String(s).replace(/[$₹€£,%\s]/g, ""));
      if (!Number.isNaN(num) && String(s).trim() !== "") out.push(num);
    }
  }
  return out;
}

function reduceNumbers(
  values: Value[],
  init: number,
  fn: (acc: number, n: number) => number,
  emptyFallback?: number,
): Value {
  const nums = collectNumbers(values);
  if (isError(nums)) return nums;
  if (nums.length === 0) return emptyFallback ?? init;
  return nums.reduce(fn, init);
}

interface RangeCritArgs {
  range: Scalar[];
  criteria: Scalar;
  sumRange?: Scalar[];
}

function scalarsAndRanges(
  node: Extract<Node, { type: "call" }>,
  ctx: EvalContext,
): RangeCritArgs {
  const range = flatten(evalNode(node.args[0], ctx));
  const criteria = scalar(evalNode(node.args[1], ctx));
  const sumRange = node.args[2] ? flatten(evalNode(node.args[2], ctx)) : undefined;
  return { range, criteria, sumRange };
}

function sumif(args: RangeCritArgs, average = false): Value {
  const { range, criteria, sumRange } = args;
  const target = sumRange ?? range;
  let total = 0;
  let count = 0;
  for (let i = 0; i < range.length; i++) {
    if (matchesCriteria(range[i], criteria)) {
      const num = toNumber(target[i] ?? 0);
      if (isError(num)) return num;
      total += num;
      count++;
    }
  }
  if (average) return count === 0 ? ERR.div0() : total / count;
  return total;
}

function gatherCriteriaPairs(
  node: Extract<Node, { type: "call" }>,
  ctx: EvalContext,
  startIndex: number,
): { ranges: Scalar[][]; crits: Scalar[] } {
  const ranges: Scalar[][] = [];
  const crits: Scalar[] = [];
  for (let i = startIndex; i + 1 < node.args.length; i += 2) {
    ranges.push(flatten(evalNode(node.args[i], ctx)));
    crits.push(scalar(evalNode(node.args[i + 1], ctx)));
  }
  return { ranges, crits };
}

function rowsMatch(
  ranges: Scalar[][],
  crits: Scalar[],
  rowIdx: number,
): boolean {
  for (let c = 0; c < ranges.length; c++) {
    if (!matchesCriteria(ranges[c][rowIdx], crits[c])) return false;
  }
  return true;
}

function sumifs(node: Extract<Node, { type: "call" }>, ctx: EvalContext): Value {
  const sumRange = flatten(evalNode(node.args[0], ctx));
  const { ranges, crits } = gatherCriteriaPairs(node, ctx, 1);
  let total = 0;
  for (let i = 0; i < sumRange.length; i++) {
    if (rowsMatch(ranges, crits, i)) {
      const num = toNumber(sumRange[i] ?? 0);
      if (isError(num)) return num;
      total += num;
    }
  }
  return total;
}

function averageifs(node: Extract<Node, { type: "call" }>, ctx: EvalContext): Value {
  const avgRange = flatten(evalNode(node.args[0], ctx));
  const { ranges, crits } = gatherCriteriaPairs(node, ctx, 1);
  let total = 0;
  let count = 0;
  for (let i = 0; i < avgRange.length; i++) {
    if (rowsMatch(ranges, crits, i)) {
      const num = toNumber(avgRange[i] ?? 0);
      if (isError(num)) return num;
      total += num;
      count++;
    }
  }
  return count === 0 ? ERR.div0() : total / count;
}

function countifs(node: Extract<Node, { type: "call" }>, ctx: EvalContext): Value {
  const { ranges, crits } = gatherCriteriaPairs(node, ctx, 0);
  if (ranges.length === 0) return 0;
  let count = 0;
  for (let i = 0; i < ranges[0].length; i++) {
    if (rowsMatch(ranges, crits, i)) count++;
  }
  return count;
}

function asRange(v: Value): Scalar[][] | ExcelError {
  if (isRange(v)) return v.cells;
  if (isError(v)) return v;
  return [[v]];
}

function vlookup(
  node: Extract<Node, { type: "call" }>,
  ctx: EvalContext,
  mode: "v" | "h",
): Value {
  const lookup = scalar(evalNode(node.args[0], ctx));
  if (isError(lookup)) return lookup;
  const table = asRange(evalNode(node.args[1], ctx));
  if (isError(table)) return table;
  const indexN = toNumber(scalar(evalNode(node.args[2], ctx)));
  if (isError(indexN)) return indexN;
  const exact =
    node.args[3] == null ? true : !toBoolSafe(scalar(evalNode(node.args[3], ctx)));

  const idx = Math.floor(indexN) - 1;
  if (mode === "v") {
    for (const row of table) {
      if (matchLookup(row[0], lookup, exact)) {
        return row[idx] ?? ERR.ref();
      }
    }
  } else {
    const firstRow = table[0] ?? [];
    for (let c = 0; c < firstRow.length; c++) {
      if (matchLookup(firstRow[c], lookup, exact)) {
        return table[idx]?.[c] ?? ERR.ref();
      }
    }
  }
  return ERR.na();
}

function xlookup(node: Extract<Node, { type: "call" }>, ctx: EvalContext): Value {
  const lookup = scalar(evalNode(node.args[0], ctx));
  if (isError(lookup)) return lookup;
  const lookupArr = flatten(evalNode(node.args[1], ctx));
  const returnArr = flatten(evalNode(node.args[2], ctx));
  for (let i = 0; i < lookupArr.length; i++) {
    if (matchLookup(lookupArr[i], lookup, true)) {
      return returnArr[i] ?? ERR.ref();
    }
  }
  if (node.args[3] != null) return scalar(evalNode(node.args[3], ctx));
  return ERR.na();
}

function indexFn(node: Extract<Node, { type: "call" }>, ctx: EvalContext): Value {
  const array = asRange(evalNode(node.args[0], ctx));
  if (isError(array)) return array;
  const rowNum = toNumber(scalar(evalNode(node.args[1], ctx)));
  if (isError(rowNum)) return rowNum;
  const colNum = node.args[2] ? toNumber(scalar(evalNode(node.args[2], ctx))) : 1;
  if (isError(colNum)) return colNum;

  // A single-row or single-column range can be indexed one-dimensionally.
  if (array.length === 1 && node.args[2] == null) {
    return array[0][Math.floor(rowNum) - 1] ?? ERR.ref();
  }
  if (array[0]?.length === 1 && node.args[2] == null) {
    return array[Math.floor(rowNum) - 1]?.[0] ?? ERR.ref();
  }
  return array[Math.floor(rowNum) - 1]?.[Math.floor(colNum) - 1] ?? ERR.ref();
}

function matchFn(node: Extract<Node, { type: "call" }>, ctx: EvalContext): Value {
  const lookup = scalar(evalNode(node.args[0], ctx));
  if (isError(lookup)) return lookup;
  const arr = flatten(evalNode(node.args[1], ctx));
  const matchType = node.args[2] ? toNumber(scalar(evalNode(node.args[2], ctx))) : 1;
  if (isError(matchType)) return matchType;

  if (matchType === 0) {
    for (let i = 0; i < arr.length; i++) {
      if (matchLookup(arr[i], lookup, true)) return i + 1;
    }
    return ERR.na();
  }
  // Approximate match: largest value <= lookup (matchType 1) — simple pass.
  let best = -1;
  for (let i = 0; i < arr.length; i++) {
    if (compare(arr[i], lookup, "<=")) best = i + 1;
  }
  return best === -1 ? ERR.na() : best;
}

function matchLookup(cell: Scalar, lookup: Scalar, exact: boolean): boolean {
  if (isError(cell) || isError(lookup)) return false;
  if (exact) {
    if (typeof cell === "number" && typeof lookup === "number") return cell === lookup;
    return String(cell).trim().toLowerCase() === String(lookup).trim().toLowerCase();
  }
  return compare(cell, lookup, "<=");
}

function toBoolSafe(v: Scalar): boolean {
  const b = toBool(v);
  return isError(b) ? false : b;
}

function formatWithPattern(num: number, fmt: string): string {
  // Minimal: handle "0", "0.00", "0%", "#,##0" style patterns.
  if (/%/.test(fmt)) {
    const decimals = (fmt.split(".")[1] ?? "").replace(/[^0]/g, "").length;
    return (num * 100).toFixed(decimals) + "%";
  }
  const decimals = (fmt.split(".")[1] ?? "").replace(/[^0#]/g, "").length;
  const useThousands = /,/.test(fmt);
  const fixed = num.toFixed(decimals);
  if (!useThousands) return fixed;
  const [int, dec] = fixed.split(".");
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec ? `${withCommas}.${dec}` : withCommas;
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export interface FormulaResult {
  ok: boolean;
  /** Display string (the computed value, or an Excel error code). */
  display: string;
  /** True when the result is a normal value (not an Excel error). */
  isValue: boolean;
}

/** Convert an evaluated value to the string Excel would show in the cell. */
function display(v: Value): { display: string; isValue: boolean } {
  if (isError(v)) return { display: v.code, isValue: false };
  if (isRange(v)) {
    const flat = v.cells.flat();
    if (flat.length === 1) return display(flat[0]);
    return { display: "#VALUE!", isValue: false };
  }
  if (typeof v === "boolean") return { display: v ? "TRUE" : "FALSE", isValue: true };
  if (typeof v === "number") return { display: formatNumber(v), isValue: true };
  return { display: v, isValue: true };
}

/**
 * Evaluate a single formula against a dataset.
 *
 * @param formula  The raw formula text (a leading `=` is optional).
 * @param ctx      Grid data plus the row offset for fill-down semantics.
 */
export function evaluateFormula(formula: string, ctx: EvalContext): FormulaResult {
  let src = formula.trim();
  if (src.startsWith("=")) src = src.slice(1);
  // Normalise smart quotes that creep in from copy/paste.
  src = src.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  if (!src) return { ok: false, display: "", isValue: false };

  try {
    const tokens = tokenize(src);
    const ast = new Parser(tokens).parse();
    const value = evalNode(ast, ctx);
    const { display: text, isValue } = display(value);
    return { ok: true, display: text, isValue };
  } catch {
    return { ok: false, display: "#ERROR!", isValue: false };
  }
}

export interface AppliedFormula {
  /** Index of the column the results were written into. */
  columnIndex: number;
  /** Header label for that column (existing or the appended "Result"). */
  header: string;
  /** True when a brand-new column was appended to hold the results. */
  appended: boolean;
  /** Results keyed by data-row index; `null` means "leave blank". */
  values: (FormulaResult | null)[];
}

/**
 * Decide where a formula's output belongs and compute it.
 *
 * - If the grid has a column whose data cells are all empty, that is treated as
 *   a fill-down target and the formula is evaluated for every row.
 * - Otherwise the formula is assumed to live in a new cell just past the table
 *   (e.g. an aggregate in E2); a "Result" column is appended and only the first
 *   data row is computed.
 */
export function applyFormula(dataset: Dataset, formula: string): AppliedFormula {
  const colCount = dataset.headers.length;
  const rows = dataset.rows;

  let targetCol = -1;
  for (let c = 0; c < colCount; c++) {
    const allEmpty = rows.every((row) => String(row[c] ?? "").trim() === "");
    if (allEmpty) {
      targetCol = c;
      break;
    }
  }

  if (targetCol !== -1) {
    const values = rows.map((_, i) =>
      evaluateFormula(formula, {
        headers: dataset.headers,
        rows,
        rowOffset: i,
      }),
    );
    return {
      columnIndex: targetCol,
      header: dataset.headers[targetCol] || "Result",
      appended: false,
      values,
    };
  }

  // Appended single-cell result (aggregate-style formula).
  const first = evaluateFormula(formula, {
    headers: dataset.headers,
    rows,
    rowOffset: 0,
  });
  const values = rows.map((_, i) => (i === 0 ? first : null));
  return { columnIndex: colCount, header: "Result", appended: true, values };
}

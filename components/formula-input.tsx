"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { searchFunctions, type ExcelFunctionDoc } from "@/lib/excel-functions";

/**
 * A monospace formula entry field with a leading `fx` affordance and Excel
 * function autocomplete. Users can type the formula with or without a leading
 * `=` (grading is tolerant). As they type a function name, a dropdown of
 * matching functions appears; selecting one inserts `NAME(` at the cursor.
 */
export function FormulaInput({
  value,
  onChange,
  placeholder = "=IF(A2>=50,\"Pass\",\"Fail\")",
  disabled,
  className,
  onEnter,
}: {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Called when Enter is pressed while no suggestion is being accepted. */
  onEnter?: () => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = React.useState<ExcelFunctionDoc[]>([]);
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);

  /** The alphabetic "word" immediately before the caret, e.g. the `VLO` in `=VLO`. */
  const currentWord = React.useCallback((caret: number) => {
    const upto = value.slice(0, caret);
    const match = /[A-Za-z]+$/.exec(upto);
    if (!match) return { word: "", start: caret };
    return { word: match[0], start: caret - match[0].length };
  }, [value]);

  const refreshSuggestions = React.useCallback(
    (caret: number) => {
      const { word } = currentWord(caret);
      if (word.length >= 1) {
        const next = searchFunctions(word);
        setSuggestions(next);
        setOpen(next.length > 0);
        setActive(0);
      } else {
        setOpen(false);
        setSuggestions([]);
      }
    },
    [currentWord],
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange?.(e.target.value);
    refreshSuggestions(e.target.selectionStart ?? e.target.value.length);
  }

  function accept(doc: ExcelFunctionDoc) {
    const input = inputRef.current;
    const caret = input?.selectionStart ?? value.length;
    const { start } = currentWord(caret);
    const before = value.slice(0, start);
    const after = value.slice(caret);
    const insertion = `${doc.name}(`;
    const next = `${before}${insertion}${after}`;
    onChange?.(next);
    setOpen(false);
    setSuggestions([]);
    // Restore focus and place the caret just after the opening paren.
    requestAnimationFrame(() => {
      const pos = before.length + insertion.length;
      input?.focus();
      input?.setSelectionRange(pos, pos);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (open && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => (a + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => (a - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        accept(suggestions[active]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
    } else if (e.key === "Enter") {
      onEnter?.();
    }
  }

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "flex items-stretch overflow-hidden rounded-md border border-input bg-background shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-ring/40",
          disabled && "opacity-60",
        )}
      >
        <span className="flex select-none items-center border-r bg-muted px-3 font-mono text-sm italic text-muted-foreground">
          fx
        </span>
        <input
          ref={inputRef}
          type="text"
          spellCheck={false}
          autoCapitalize="characters"
          autoComplete="off"
          disabled={disabled}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={(e) => refreshSuggestions(e.target.selectionStart ?? 0)}
          onBlur={() => {
            // Delay so a mousedown on a suggestion can fire first.
            window.setTimeout(() => setOpen(false), 120);
          }}
          onClick={(e) =>
            refreshSuggestions((e.target as HTMLInputElement).selectionStart ?? 0)
          }
          placeholder={placeholder}
          className="w-full bg-transparent px-3 py-2 font-mono text-sm outline-none placeholder:text-muted-foreground/60"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
        />
      </div>

      {open && suggestions.length > 0 ? (
        <ul
          className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-md border bg-popover p-1 shadow-lg animate-in fade-in-0 zoom-in-95"
          role="listbox"
        >
          {suggestions.map((doc, i) => (
            <li key={doc.name} role="option" aria-selected={i === active}>
              <button
                type="button"
                // Use mousedown so selection happens before the input blurs.
                onMouseDown={(e) => {
                  e.preventDefault();
                  accept(doc);
                }}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "flex w-full flex-col gap-0.5 rounded-sm px-2.5 py-1.5 text-left transition-colors",
                  i === active ? "bg-accent" : "hover:bg-accent/60",
                )}
              >
                <span className="flex items-baseline gap-2">
                  <span className="font-mono text-sm font-semibold text-foreground">
                    {doc.name}
                  </span>
                  <span className="truncate font-mono text-[11px] text-muted-foreground">
                    {doc.signature}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">{doc.summary}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

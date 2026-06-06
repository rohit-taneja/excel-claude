"use client";

import * as React from "react";
import { CheckCircle2, Eraser, Lightbulb, PlayCircle, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import type { PublicQuestion } from "@/lib/content";
import { applyFormula, type AppliedFormula } from "@/lib/evaluate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DatasetTable } from "@/components/dataset-table";
import { FormulaInput } from "@/components/formula-input";
import { DifficultyBadge } from "@/components/skill-badges";

const FORMULA_TYPES: ReadonlySet<PublicQuestion["type"]> = new Set([
  "formula_input",
  "fix_formula",
  "multi_function_formula",
]);

const TYPE_LABEL: Record<PublicQuestion["type"], string> = {
  mcq: "Multiple choice",
  scenario: "Scenario",
  output_prediction: "Predict the output",
  fix_formula: "Fix the formula",
  formula_input: "Write the formula",
  multi_function_formula: "Multi-function formula",
};

export interface ReviewInfo {
  isCorrect: boolean;
  pointsAwarded: number;
  maxPoints: number;
  feedback?: string;
  correctText?: string;
  explanation?: string;
}

export function QuestionRenderer({
  question,
  value,
  onChange,
  disabled,
  review,
  index,
  total,
}: {
  question: PublicQuestion;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  review?: ReviewInfo;
  index?: number;
  total?: number;
}) {
  const readOnly = disabled || Boolean(review);
  const isChoice = question.type === "mcq" || question.type === "scenario";
  const isFormula = FORMULA_TYPES.has(question.type);
  const canApply = isFormula && Boolean(question.dataset);

  const [applied, setApplied] = React.useState<AppliedFormula | null>(null);

  // Drop stale results whenever the formula or the question changes.
  React.useEffect(() => {
    setApplied(null);
  }, [value, question.id]);

  function runFormula() {
    if (!question.dataset || !value.trim()) return;
    setApplied(applyFormula(question.dataset, value));
  }

  return (
    <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{TYPE_LABEL[question.type]}</Badge>
          <DifficultyBadge difficulty={question.difficulty} />
        </div>
        {index != null && total != null ? (
          <span className="text-xs font-medium text-muted-foreground">
            Question {index + 1} of {total}
          </span>
        ) : null}
      </div>

      <p className="text-base font-medium leading-relaxed">{question.prompt}</p>

      {question.dataset ? (
        <DatasetTable dataset={question.dataset} applied={applied} />
      ) : null}

      {question.type === "fix_formula" && question.brokenFormula ? (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Broken formula
          </Label>
          <pre className="overflow-x-auto rounded-md border bg-muted/50 px-3 py-2 font-mono text-sm">
            {question.brokenFormula}
          </pre>
        </div>
      ) : null}

      {/* Answer controls */}
      {isChoice ? (
        <RadioGroup
          value={value}
          onValueChange={(v) => onChange?.(v)}
          disabled={readOnly}
          className="gap-2"
        >
          {question.options?.map((opt, i) => {
            const selected = value === opt;
            const isCorrectOption =
              review?.correctText != null && review.correctText === opt;
            return (
              <Label
                key={i}
                htmlFor={`${question.id}-${i}`}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm font-normal transition-colors",
                  !readOnly && "hover:bg-accent",
                  review && isCorrectOption && "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40",
                  review && selected && !isCorrectOption && "border-destructive bg-destructive/10",
                )}
              >
                <RadioGroupItem id={`${question.id}-${i}`} value={opt} />
                <span>{opt}</span>
              </Label>
            );
          })}
        </RadioGroup>
      ) : question.type === "output_prediction" ? (
        <div className="space-y-1.5">
          <Label htmlFor={`${question.id}-out`} className="text-xs text-muted-foreground">
            Predicted result
          </Label>
          <Input
            id={`${question.id}-out`}
            value={value}
            disabled={readOnly}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder="e.g. Pass, 42, Not Found"
            className="max-w-sm font-mono"
          />
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {question.type === "fix_formula" ? "Corrected formula" : "Your formula"}
          </Label>
          <FormulaInput
            value={value}
            onChange={onChange}
            disabled={disabled}
            onEnter={canApply ? runFormula : undefined}
          />
          {canApply ? (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={runFormula}
                disabled={!value.trim() || disabled}
                className="gap-1.5"
              >
                <PlayCircle className="size-4" />
                Apply to grid
              </Button>
              {applied ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setApplied(null)}
                  className="gap-1.5 text-muted-foreground"
                >
                  <Eraser className="size-4" />
                  Clear
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Run your formula on the grid above to see the result.
                </span>
              )}
            </div>
          ) : null}
        </div>
      )}

      {question.hint && !review ? (
        <Accordion type="single" collapsible>
          <AccordionItem value="hint" className="border-b-0">
            <AccordionTrigger className="py-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Lightbulb className="size-4" />
                Need a hint?
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              {question.hint}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : null}

      {review ? (
        <div
          className={cn(
            "space-y-2 rounded-lg border p-4 text-sm animate-in fade-in-0 zoom-in-95 duration-300",
            review.isCorrect
              ? "border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30"
              : review.pointsAwarded > 0
                ? "border-amber-500/40 bg-amber-50 dark:bg-amber-950/30"
                : "border-destructive/40 bg-destructive/10 animate-shake",
          )}
        >
          <div className="flex items-center gap-2 font-medium">
            {review.isCorrect ? (
              <CheckCircle2 className="size-4 text-emerald-600 animate-pop" />
            ) : (
              <XCircle className="size-4 text-destructive" />
            )}
            <span>
              {review.isCorrect
                ? "Correct"
                : review.pointsAwarded > 0
                  ? "Partially correct"
                  : "Incorrect"}{" "}
              · {review.pointsAwarded}/{review.maxPoints} points
            </span>
          </div>
          {review.feedback ? (
            <p className="text-muted-foreground">{review.feedback}</p>
          ) : null}
          {!review.isCorrect && review.correctText ? (
            <p>
              <span className="font-medium">Answer: </span>
              <span className="font-mono">{review.correctText}</span>
            </p>
          ) : null}
          {review.explanation ? (
            <p className="text-muted-foreground">{review.explanation}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

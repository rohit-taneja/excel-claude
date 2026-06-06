"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";

import type { GradeResult, Question } from "@/lib/types";
import { gradeQuestion } from "@/lib/grading";
import { recordPractice } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  QuestionRenderer,
  type ReviewInfo,
} from "@/components/question-renderer";
import { Confetti } from "@/components/confetti";

function correctText(q: Question): string {
  if (q.type === "mcq" || q.type === "scenario") return q.correctAnswer ?? "";
  if (q.type === "output_prediction")
    return q.expectedOutput ?? q.correctAnswer ?? "";
  return q.acceptedAnswers?.[0] ?? "";
}

export function PracticeRunner({
  skillId,
  skillTitle,
  questions,
}: {
  skillId: string;
  skillTitle: string;
  questions: Question[];
}) {
  const [index, setIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [results, setResults] = React.useState<Record<string, GradeResult>>({});
  const recordedRef = React.useRef(false);

  const total = questions.length;
  const question = questions[index];
  const checkedCount = Object.keys(results).length;

  const earned = Object.values(results).reduce(
    (s, r) => s + r.pointsAwarded,
    0,
  );
  const max = Object.values(results).reduce((s, r) => s + r.maxPoints, 0);
  const finished = checkedCount === total && total > 0;
  const scorePercent = max > 0 ? Math.round((earned / max) * 100) : 0;

  React.useEffect(() => {
    if (finished && !recordedRef.current) {
      recordedRef.current = true;
      void recordPractice({ skillId, scorePercent }).catch(() => {});
    }
  }, [finished, scorePercent, skillId]);

  function check() {
    const answer = answers[question.id] ?? "";
    if (!answer.trim()) {
      toast.warning("Enter an answer first.");
      return;
    }
    setResults((prev) => ({
      ...prev,
      [question.id]: gradeQuestion(question, answer),
    }));
  }

  function reset() {
    setAnswers({});
    setResults({});
    setIndex(0);
    recordedRef.current = false;
  }

  function retryQuestion() {
    setResults((prev) => {
      const next = { ...prev };
      delete next[question.id];
      return next;
    });
    setAnswers((prev) => ({ ...prev, [question.id]: "" }));
    // Allow progress to be re-recorded if the run was already complete.
    recordedRef.current = false;
  }

  if (!question) {
    return (
      <p className="text-sm text-muted-foreground">
        No practice questions are available for this skill yet.
      </p>
    );
  }

  const result = results[question.id];
  const review: ReviewInfo | undefined = result
    ? {
        isCorrect: result.isCorrect,
        pointsAwarded: result.pointsAwarded,
        maxPoints: result.maxPoints,
        feedback: result.feedback,
        correctText: correctText(question),
        explanation: question.explanation,
      }
    : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {checkedCount} of {total} checked
        </span>
        {checkedCount > 0 ? (
          <span className="font-medium">
            Score so far: {earned}/{max}
          </span>
        ) : null}
      </div>
      <Progress value={(checkedCount / total) * 100} />

      <Card className="transition-shadow duration-300 hover:shadow-md">
        <CardContent className="pt-6">
          <QuestionRenderer
            key={question.id}
            question={question}
            value={answers[question.id] ?? ""}
            onChange={(v) =>
              setAnswers((prev) => ({ ...prev, [question.id]: v }))
            }
            review={review}
            index={index}
            total={total}
          />
        </CardContent>
        <CardFooter className="flex-wrap justify-between gap-2">
          <Button
            variant="outline"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="gap-1.5"
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <div className="flex items-center gap-2">
            {!result ? (
              <Button onClick={check} className="gap-1.5">
                <CheckCircle2 className="size-4" />
                Check answer
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={retryQuestion}
                  className="gap-1.5"
                >
                  <RotateCcw className="size-4" />
                  Retry
                </Button>
                {index < total - 1 ? (
                  <Button
                    onClick={() => setIndex((i) => i + 1)}
                    className="gap-1.5"
                  >
                    Next question
                    <ChevronRight className="size-4" />
                  </Button>
                ) : (
                  <span className="text-sm font-medium text-muted-foreground">
                    All done!
                  </span>
                )}
              </>
            )}
          </div>
        </CardFooter>
      </Card>

      {finished ? (
        <Card className="relative overflow-hidden border-primary/30 animate-in fade-in-0 zoom-in-95 duration-500">
          <Confetti />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-5 text-amber-500 animate-pop" />
              Practice complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-bold">{scorePercent}%</p>
            <p className="text-sm text-muted-foreground">
              You earned {earned} of {max} points across {total} questions on{" "}
              {skillTitle}. Your progress has been saved.
            </p>
          </CardContent>
          <CardFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={reset}>
              <RotateCcw />
              Practice again
            </Button>
            <Button asChild>
              <Link href="/tests">
                <CheckCircle2 />
                Try a test
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ) : null}
    </div>
  );
}

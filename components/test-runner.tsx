"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import type { PublicQuestion } from "@/lib/content";
import { submitTest } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TestTimer } from "@/components/test-timer";
import { QuestionRenderer } from "@/components/question-renderer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function TestRunner({
  testId,
  title,
  durationMinutes,
  questions,
}: {
  testId: string;
  title: string;
  durationMinutes: number;
  questions: PublicQuestion[];
}) {
  const router = useRouter();
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [current, setCurrent] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const startedAtRef = React.useRef<string | null>(null);
  const startMsRef = React.useRef<number | null>(null);
  const submittedRef = React.useRef(false);

  // Record the start time once, after mount (kept out of render to stay pure).
  React.useEffect(() => {
    startedAtRef.current = new Date().toISOString();
    startMsRef.current = Date.now();
  }, []);

  const total = questions.length;
  const answeredCount = questions.filter((q) =>
    (answers[q.id] ?? "").trim(),
  ).length;
  const question = questions[current];

  const setAnswer = React.useCallback(
    (id: string, value: string) =>
      setAnswers((prev) => ({ ...prev, [id]: value })),
    [],
  );

  const handleSubmit = React.useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const startMs = startMsRef.current ?? Date.now();
      const durationSeconds = Math.round((Date.now() - startMs) / 1000);
      const { attemptId } = await submitTest({
        testId,
        answers,
        startedAt: startedAtRef.current ?? new Date().toISOString(),
        durationSeconds,
      });
      router.push(`/tests/${testId}/result?attempt=${attemptId}`);
    } catch (err) {
      submittedRef.current = false;
      setSubmitting(false);
      toast.error(
        err instanceof Error ? err.message : "Could not submit the test.",
      );
    }
  }, [answers, router, testId]);

  if (!question) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {answeredCount} of {total} answered
          </p>
        </div>
        <TestTimer
          durationSeconds={durationMinutes * 60}
          onExpire={() => {
            toast.info("Time's up — submitting your test.");
            void handleSubmit();
          }}
        />
      </div>

      <Progress value={(answeredCount / total) * 100} />

      {/* Question palette */}
      <div className="flex flex-wrap gap-1.5">
        {questions.map((q, i) => {
          const answered = (answers[q.id] ?? "").trim().length > 0;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => setCurrent(i)}
              className={cn(
                "size-8 rounded-md border text-xs font-medium transition-colors",
                i === current
                  ? "border-primary bg-primary text-primary-foreground"
                  : answered
                    ? "border-emerald-500/50 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "hover:bg-accent",
              )}
              aria-label={`Go to question ${i + 1}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <Card className="transition-shadow duration-300 hover:shadow-md">
        <CardContent className="pt-6">
          <div
            key={question.id}
            className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-6 motion-safe:duration-300"
          >
            <QuestionRenderer
              question={question}
              value={answers[question.id] ?? ""}
              onChange={(v) => setAnswer(question.id, v)}
              index={current}
              total={total}
              disabled={submitting}
            />
          </div>
        </CardContent>
        <CardFooter className="justify-between gap-2">
          <Button
            variant="outline"
            disabled={current === 0 || submitting}
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          >
            <ChevronLeft />
            Previous
          </Button>

          {current < total - 1 ? (
            <Button
              variant="default"
              disabled={submitting}
              onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
            >
              Next
              <ChevronRight />
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin" /> : <Send />}
                  Submit test
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Submit your test?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You have answered {answeredCount} of {total} questions.
                    {answeredCount < total
                      ? " Unanswered questions will be marked incorrect."
                      : ""}{" "}
                    You can&apos;t change your answers after submitting.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep working</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void handleSubmit()}>
                    Submit
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

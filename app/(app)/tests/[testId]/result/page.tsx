import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { getQuestion, getResolvedTest, getSkills, getTest } from "@/lib/content";
import { getAnswersForAttempt, getAttempt } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { ResultSummary, type ResultRow } from "@/components/result-summary";

export default async function TestResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ testId: string }>;
  searchParams: Promise<{ attempt?: string }>;
}) {
  const user = await requireUser();
  const { testId } = await params;
  const { attempt: attemptId } = await searchParams;

  if (!attemptId) notFound();
  const attempt = await getAttempt(attemptId);

  // Guard: attempt must exist, belong to the user, and match the test.
  if (!attempt || attempt.userKey !== user.userKey || attempt.testId !== testId) {
    notFound();
  }

  const [answers, test] = await Promise.all([
    getAnswersForAttempt(attempt.id),
    Promise.resolve(getTest(testId)),
  ]);

  // Order the rows by the test's question sequence.
  const order = getResolvedTest(testId)?.questions.map((q) => q.id) ?? [];
  const orderIndex = new Map(order.map((id, i) => [id, i]));

  const rows: ResultRow[] = answers
    .map((a) => {
      const question = getQuestion(a.questionId);
      if (!question) return null;
      return {
        question,
        userAnswer: a.userAnswer == null ? "" : String(a.userAnswer),
        isCorrect: a.isCorrect,
        pointsAwarded: a.pointsAwarded,
        maxPoints: a.maxPoints,
      } satisfies ResultRow;
    })
    .filter((r): r is ResultRow => r !== null)
    .sort(
      (a, b) =>
        (orderIndex.get(a.question.id) ?? 0) -
        (orderIndex.get(b.question.id) ?? 0),
    );

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/tests">
          <ArrowLeft />
          All tests
        </Link>
      </Button>

      <ResultSummary
        attempt={attempt}
        testTitle={test?.title ?? testId}
        rows={rows}
        skills={getSkills()}
      />
    </div>
  );
}

import Link from "next/link";
import { ClipboardCheck, Clock, ListChecks, Trophy } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { getResolvedTest, getTests } from "@/lib/content";
import { getAttemptsForUser } from "@/lib/db";
import type { TestCategory } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DifficultyBadge } from "@/components/skill-badges";

const CATEGORY_LABEL: Record<TestCategory, string> = {
  "single-skill": "Single skill",
  mixed: "Mixed",
  "job-simulation": "Job simulation",
};

export default async function TestsPage() {
  const user = await requireUser();
  const [tests, attempts] = await Promise.all([
    getTests(),
    getAttemptsForUser(user.userKey, 200),
  ]);

  const bestByTest = new Map<string, number>();
  for (const a of attempts) {
    bestByTest.set(a.testId, Math.max(bestByTest.get(a.testId) ?? 0, a.score));
  }

  return (
    <div className="space-y-6">
      <div className="animate-enter">
        <h1 className="text-2xl font-semibold tracking-tight">Tests</h1>
        <p className="text-muted-foreground">
          Timed, auto-graded tests with partial credit on formula questions.
        </p>
      </div>

      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tests.map((test) => {
          const resolved = getResolvedTest(test.id);
          const count = resolved?.questions.length ?? 0;
          const best = bestByTest.get(test.id);
          return (
            <Card
              key={test.id}
              className="group flex flex-col transition-all duration-200 ease-out hover:-translate-y-2 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/25 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <CardHeader className="gap-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{test.title}</CardTitle>
                  {best != null ? (
                    <Badge variant={best >= 60 ? "success" : "warning"}>
                      <Trophy />
                      {best}%
                    </Badge>
                  ) : null}
                </div>
                <CardDescription>{test.description}</CardDescription>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="info">{CATEGORY_LABEL[test.category]}</Badge>
                  <DifficultyBadge difficulty={test.difficulty} />
                </div>
              </CardHeader>
              <CardContent className="mt-auto flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <ListChecks className="size-4" />
                  {count} questions
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4" />
                  {test.durationMinutes} min
                </span>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/tests/${test.id}`}>
                    <ClipboardCheck />
                    {best != null ? "Retake test" : "Start test"}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Info,
  ListChecks,
  Play,
  Target,
} from "lucide-react";

import { requireUser } from "@/lib/auth";
import { getResolvedTest, getSkill, toPublicQuestion } from "@/lib/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DifficultyBadge } from "@/components/skill-badges";
import { TestRunner } from "@/components/test-runner";

export default async function TestPage({
  params,
  searchParams,
}: {
  params: Promise<{ testId: string }>;
  searchParams: Promise<{ begin?: string }>;
}) {
  await requireUser();
  const { testId } = await params;
  const { begin } = await searchParams;

  const test = getResolvedTest(testId);
  if (!test || test.questions.length === 0) notFound();

  if (begin === "1") {
    const publicQuestions = test.questions.map(toPublicQuestion);
    return (
      <div className="mx-auto max-w-3xl">
        <TestRunner
          testId={test.id}
          title={test.title}
          durationMinutes={test.durationMinutes}
          questions={publicQuestions}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/tests">
          <ArrowLeft />
          All tests
        </Link>
      </Button>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{test.title}</h1>
        <p className="text-muted-foreground">{test.description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Before you start</CardTitle>
          <CardDescription>Here&apos;s what to expect.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Detail
              icon={<ListChecks className="size-4" />}
              label="Questions"
              value={`${test.questions.length}`}
            />
            <Detail
              icon={<Clock className="size-4" />}
              label="Time limit"
              value={`${test.durationMinutes} min`}
            />
            <Detail
              icon={<Target className="size-4" />}
              label="Passing score"
              value={`${test.passingScore}%`}
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Skills covered</p>
            <div className="flex flex-wrap gap-1.5">
              {test.skills.map((skillId) => {
                const skill = getSkill(skillId);
                return (
                  <Badge key={skillId} variant="secondary">
                    {skill?.title ?? skillId}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            <p>
              The timer starts as soon as you begin and the test auto-submits when
              it runs out. Formula questions accept multiple correct variants and
              award partial credit. <DifficultyBadge difficulty={test.difficulty} />
            </p>
          </div>
        </CardContent>
      </Card>

      <Button asChild size="lg" className="w-full">
        <Link href={`/tests/${test.id}?begin=1`}>
          <Play />
          Begin test
        </Link>
      </Button>
    </div>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

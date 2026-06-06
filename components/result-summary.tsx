import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Flame,
  Timer,
  TriangleAlert,
  Trophy,
  XCircle,
} from "lucide-react";

import { cn, formatDuration } from "@/lib/utils";
import { correctAnswerText } from "@/lib/content";
import type { Question, Skill, TestAttempt } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SkillIcon } from "@/components/skill-icon";
import { QuestionRenderer } from "@/components/question-renderer";

export interface ResultRow {
  question: Question;
  userAnswer: string;
  isCorrect: boolean;
  pointsAwarded: number;
  maxPoints: number;
}

const PASS = 60;

export function ResultSummary({
  attempt,
  testTitle,
  rows,
  skills,
}: {
  attempt: TestAttempt;
  testTitle: string;
  rows: ResultRow[];
  skills: Skill[];
}) {
  const skillsById = new Map(skills.map((s) => [s.id, s]));

  // Aggregate per skill.
  const perSkill = new Map<string, { earned: number; max: number }>();
  for (const row of rows) {
    for (const skillId of row.question.skills) {
      const cur = perSkill.get(skillId) ?? { earned: 0, max: 0 };
      cur.earned += row.pointsAwarded;
      cur.max += row.maxPoints;
      perSkill.set(skillId, cur);
    }
  }

  const skillRows = [...perSkill.entries()]
    .map(([skillId, sc]) => ({
      skill: skillsById.get(skillId),
      skillId,
      percent: sc.max > 0 ? Math.round((sc.earned / sc.max) * 100) : 0,
    }))
    .sort((a, b) => a.percent - b.percent);

  const weak = skillRows.filter((s) => s.percent < PASS);
  const recommended = weak[0] ?? skillRows[0];
  const passed = attempt.score >= PASS;

  return (
    <div className="space-y-6">
      {/* Headline */}
      <Card className={cn(passed ? "border-emerald-500/40" : "border-amber-500/40")}>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardDescription>{testTitle}</CardDescription>
              <CardTitle className="text-2xl">
                {passed ? "Great work!" : "Keep practising"}
              </CardTitle>
            </div>
            <Badge variant={passed ? "success" : "warning"} className="text-sm">
              <Trophy />
              {attempt.score}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Score" value={`${attempt.score}%`} icon={<Trophy className="size-4" />} />
            <Stat
              label="Correct"
              value={`${attempt.correctCount}/${attempt.totalQuestions}`}
              icon={<CheckCircle2 className="size-4 text-emerald-600" />}
            />
            <Stat
              label="Incorrect"
              value={`${attempt.totalQuestions - attempt.correctCount}`}
              icon={<XCircle className="size-4 text-destructive" />}
            />
            <Stat
              label="Time taken"
              value={formatDuration(attempt.durationSeconds)}
              icon={<Timer className="size-4" />}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Skill-wise */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Skill-wise performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {skillRows.map(({ skill, skillId, percent }) => (
              <div key={skillId} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <SkillIcon
                      name={skill?.icon}
                      className="size-4 text-muted-foreground"
                    />
                    {skill?.title ?? skillId}
                  </span>
                  <span
                    className={cn(
                      "tabular-nums",
                      percent < PASS ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {percent}%
                  </span>
                </div>
                <Progress value={percent} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Weak areas + recommendation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TriangleAlert className="size-5 text-amber-500" />
              Weak areas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {weak.length ? (
              <ul className="space-y-1.5 text-sm">
                {weak.map(({ skill, skillId, percent }) => (
                  <li key={skillId} className="flex items-center justify-between">
                    <span>{skill?.title ?? skillId}</span>
                    <Badge variant="warning">{percent}%</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No weak areas — you scored above {PASS}% on every skill. 🎉
              </p>
            )}

            {recommended?.skill ? (
              <div className="rounded-lg border bg-muted/40 p-4">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Flame className="size-4 text-amber-500" />
                  Recommended next practice
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sharpen <span className="font-medium">{recommended.skill.title}</span>{" "}
                  to boost your score.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild size="sm">
                    <Link href={`/practice/${recommended.skill.id}`}>
                      Practice {recommended.skill.title}
                      <ArrowRight />
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/learn/${recommended.skill.id}`}>
                      Review lesson
                    </Link>
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Question review */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Answer review</CardTitle>
          <CardDescription>
            See where you went right and wrong, with explanations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {rows.map((row, i) => (
            <div key={row.question.id} className="border-t pt-6 first:border-t-0 first:pt-0">
              <QuestionRenderer
                question={row.question}
                value={row.userAnswer}
                index={i}
                total={rows.length}
                review={{
                  isCorrect: row.isCorrect,
                  pointsAwarded: row.pointsAwarded,
                  maxPoints: row.maxPoints,
                  correctText: correctAnswerText(row.question),
                  explanation: row.question.explanation,
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/tests">Back to tests</Link>
        </Button>
        <Button asChild>
          <Link href="/reports">View reports</Link>
        </Button>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

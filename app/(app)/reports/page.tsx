import Link from "next/link";
import { ArrowRight, BarChart3, TriangleAlert } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { getTest } from "@/lib/content";
import { getAttemptsForUser } from "@/lib/db";
import { getUserOverview } from "@/lib/reports";
import { formatDate, formatDuration } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CountUp } from "@/components/count-up";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SkillIcon } from "@/components/skill-icon";
import { StatusBadge } from "@/components/skill-badges";

export default async function ReportsPage() {
  const user = await requireUser();
  const [overview, attempts] = await Promise.all([
    getUserOverview(user.userKey),
    getAttemptsForUser(user.userKey, 200),
  ]);

  return (
    <div className="space-y-6">
      <div className="animate-enter">
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Track your mastery across skills and review every test attempt.
        </p>
      </div>

      {/* Summary stats */}
      <div className="stagger grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overall completion</CardDescription>
            <CardTitle className="text-3xl">
              <CountUp value={overview.overallPercent} suffix="%" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={overview.overallPercent} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Skills completed</CardDescription>
            <CardTitle className="text-3xl">
              <CountUp value={overview.completedCount} />/{overview.totalSkills}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average test score</CardDescription>
            <CardTitle className="text-3xl">
              {overview.averageScore != null ? (
                <CountUp value={overview.averageScore} suffix="%" />
              ) : (
                "—"
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="stagger grid gap-6 lg:grid-cols-3">
        {/* Skill mastery */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="size-5" />
              Skill mastery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {overview.skillViews.map(({ skill, status, score }) => (
              <div key={skill.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <Link
                    href={`/practice/${skill.id}`}
                    className="flex items-center gap-2 font-medium hover:underline"
                  >
                    <SkillIcon
                      name={skill.icon}
                      className="size-4 text-muted-foreground"
                    />
                    {skill.title}
                  </Link>
                  <div className="flex items-center gap-2">
                    {score > 0 ? (
                      <span className="tabular-nums text-muted-foreground">
                        {Math.round(score)}%
                      </span>
                    ) : null}
                    <StatusBadge status={status} />
                  </div>
                </div>
                <Progress
                  value={
                    status === "completed"
                      ? 100
                      : status === "in_progress"
                        ? Math.max(score, 50)
                        : 0
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Weak areas & next steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TriangleAlert className="size-5 text-amber-500" />
              Weak areas
            </CardTitle>
            <CardDescription>Below 60% — focus here next.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {overview.weakSkills.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No weak areas detected yet. Take more tests to surface gaps.
              </p>
            ) : (
              overview.weakSkills.map(({ skill, score }) => (
                <Link
                  key={skill.id}
                  href={`/practice/${skill.id}`}
                  className="flex items-center justify-between rounded-md border p-2.5 text-sm transition-colors hover:bg-accent"
                >
                  <span className="font-medium">{skill.title}</span>
                  <span className="flex items-center gap-2">
                    <Badge variant="warning">{Math.round(score)}%</Badge>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attempt history */}
      <Card className="animate-enter">
        <CardHeader>
          <CardTitle className="text-lg">Test attempt history</CardTitle>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No attempts yet.{" "}
              <Link href="/tests" className="font-medium underline">
                Take a test
              </Link>{" "}
              to start building your history.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Correct</TableHead>
                  <TableHead className="text-center">Time</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/tests/${attempt.testId}/result?attempt=${attempt.id}`}
                        className="hover:underline"
                      >
                        {getTest(attempt.testId)?.title ?? attempt.testId}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(attempt.submittedAt)}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {attempt.correctCount}/{attempt.totalQuestions}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {formatDuration(attempt.durationSeconds)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={attempt.score >= 60 ? "success" : "warning"}
                      >
                        {attempt.score}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

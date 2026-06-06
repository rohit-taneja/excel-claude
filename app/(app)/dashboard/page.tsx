import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  Flame,
  PencilLine,
  Sparkles,
  Trophy,
} from "lucide-react";

import { requireUser } from "@/lib/auth";
import { getUserOverview } from "@/lib/reports";
import { getTest } from "@/lib/content";
import { formatDate, formatDuration } from "@/lib/utils";
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
import { CountUp } from "@/components/count-up";
import { SkillIcon } from "@/components/skill-icon";
import { WeakSkillsCard } from "@/components/weak-skills-card";
import {
  DifficultyBadge,
  PriorityBadge,
  StatusBadge,
} from "@/components/skill-badges";

export default async function DashboardPage() {
  const user = await requireUser();
  const overview = await getUserOverview(user.userKey);

  return (
    <div className="space-y-6">
      <div className="animate-enter">
        <h1 className="text-2xl font-semibold tracking-tight">
          Hi, <span className="capitalize">{user.username}</span> 👋
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s your progress towards job-ready Excel skills.
        </p>
      </div>

      {/* Top stats */}
      <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overall progress</CardDescription>
            <CardTitle className="text-3xl">
              <CountUp value={overview.overallPercent} suffix="%" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={overview.overallPercent} />
            <p className="text-xs text-muted-foreground">
              {overview.completedCount} of {overview.totalSkills} skills
              completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In progress</CardDescription>
            <CardTitle className="text-3xl">
              <CountUp value={overview.inProgressCount} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Skills you&apos;ve started but not finished
            </p>
          </CardContent>
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
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {overview.recentAttempts.length} recent attempt
              {overview.recentAttempts.length === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tests taken</CardDescription>
            <CardTitle className="text-3xl">
              <CountUp value={overview.recentAttempts.length} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link href="/tests">
                <ClipboardCheck />
                Take a test
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="stagger grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Continue learning + recommended */}
          <div className="grid gap-4 sm:grid-cols-2">
            {overview.continueSkill ? (
              <Card className="border-primary/30">
                <CardHeader>
                  <CardDescription className="flex items-center gap-1.5">
                    <Sparkles className="size-4" />
                    Continue learning
                  </CardDescription>
                  <CardTitle className="flex items-center gap-2">
                    <SkillIcon
                      name={overview.continueSkill.icon}
                      className="size-5"
                    />
                    {overview.continueSkill.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {overview.continueSkill.summary}
                  </p>
                  <div className="flex gap-2">
                    <Button asChild size="sm">
                      <Link href={`/learn/${overview.continueSkill.id}`}>
                        <BookOpen />
                        Learn
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/practice/${overview.continueSkill.id}`}>
                        <PencilLine />
                        Practice
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {overview.nextRecommendedSkill ? (
              <Card>
                <CardHeader>
                  <CardDescription className="flex items-center gap-1.5">
                    <ArrowRight className="size-4" />
                    Next recommended
                  </CardDescription>
                  <CardTitle className="flex items-center gap-2">
                    <SkillIcon
                      name={overview.nextRecommendedSkill.icon}
                      className="size-5"
                    />
                    {overview.nextRecommendedSkill.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    <PriorityBadge
                      priority={overview.nextRecommendedSkill.priority}
                    />
                    <DifficultyBadge
                      difficulty={overview.nextRecommendedSkill.difficulty}
                    />
                  </div>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/learn/${overview.nextRecommendedSkill.id}`}>
                      Start lesson
                      <ArrowRight />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Trophy className="size-5 text-amber-500" />
                    All skills started!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    You&apos;ve begun every skill. Revisit weak areas or take
                    the final readiness test.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* High-priority skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Flame className="size-5 text-amber-500" />
                High-priority skills
              </CardTitle>
              <CardDescription>
                The skills employers ask about most. Master these first.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {overview.highPrioritySkills.map((skill) => {
                const view = overview.skillViews.find(
                  (v) => v.skill.id === skill.id,
                );
                return (
                  <Link
                    key={skill.id}
                    href={`/learn/${skill.id}`}
                    className="flex items-center justify-between rounded-md border p-2.5 text-sm transition-colors hover:bg-accent"
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <SkillIcon
                        name={skill.icon}
                        className="size-4 text-muted-foreground"
                      />
                      {skill.title}
                    </span>
                    <StatusBadge status={view?.status ?? "not_started"} />
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          {/* Recent attempts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent test attempts</CardTitle>
            </CardHeader>
            <CardContent>
              {overview.recentAttempts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No attempts yet.{" "}
                  <Link href="/tests" className="font-medium underline">
                    Take your first test
                  </Link>
                  .
                </p>
              ) : (
                <ul className="divide-y">
                  {overview.recentAttempts.map((attempt) => {
                    const test = getTest(attempt.testId);
                    return (
                      <li
                        key={attempt.id}
                        className="flex items-center justify-between gap-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <Link
                            href={`/tests/${attempt.testId}/result?attempt=${attempt.id}`}
                            className="truncate font-medium hover:underline"
                          >
                            {test?.title ?? attempt.testId}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(attempt.submittedAt)} ·{" "}
                            {attempt.correctCount}/{attempt.totalQuestions}{" "}
                            correct · {formatDuration(attempt.durationSeconds)}
                          </p>
                        </div>
                        <Badge
                          variant={attempt.score >= 60 ? "success" : "warning"}
                        >
                          {attempt.score}%
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <WeakSkillsCard weakSkills={overview.weakSkills} />
        </div>
      </div>
    </div>
  );
}

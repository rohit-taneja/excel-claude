import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CircleCheck,
  Lightbulb,
  PencilLine,
  XCircle,
} from "lucide-react";

import { getSkill, getSkills, getTests } from "@/lib/content";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SkillIcon } from "@/components/skill-icon";
import { DifficultyBadge, PriorityBadge } from "@/components/skill-badges";

export default async function SkillLessonPage({
  params,
}: {
  params: Promise<{ skillId: string }>;
}) {
  const { skillId } = await params;
  const skill = getSkill(skillId);
  if (!skill) notFound();

  const skills = getSkills();
  const idx = skills.findIndex((s) => s.id === skill.id);
  const prev = idx > 0 ? skills[idx - 1] : undefined;
  const next = idx < skills.length - 1 ? skills[idx + 1] : undefined;

  const relatedTest = getTests().find((t) => t.skills.includes(skill.id));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/learn">
          <ArrowLeft />
          All skills
        </Link>
      </Button>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
            <SkillIcon name={skill.icon} className="size-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{skill.category}</p>
            <h1 className="text-2xl font-semibold tracking-tight">{skill.title}</h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <PriorityBadge priority={skill.priority} />
          <DifficultyBadge difficulty={skill.difficulty} />
          <Badge variant="outline">Lesson {skill.order} of {skills.length}</Badge>
        </div>
        <p className="text-base text-muted-foreground">{skill.summary}</p>
      </div>

      {/* Syntax */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Syntax</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-md border bg-muted/50 px-4 py-3 font-mono text-sm">
            {skill.syntax}
          </pre>
        </CardContent>
      </Card>

      {/* Job use cases */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="size-4" />
            Where it&apos;s used at work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 sm:grid-cols-2">
            {skill.jobUseCases.map((useCase, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                {useCase}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Examples */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Examples</h2>
        {skill.examples.map((example, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{example.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <pre className="overflow-x-auto rounded-md border bg-muted/50 px-4 py-3 font-mono text-sm">
                {example.formula}
              </pre>
              <p className="text-sm text-muted-foreground">{example.explanation}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mistakes & tips */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <XCircle className="size-4 text-destructive" />
              Common mistakes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {skill.commonMistakes.map((mistake, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-destructive" />
                  {mistake}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {skill.practiceTips && skill.practiceTips.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="size-4 text-amber-500" />
                Practice tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {skill.practiceTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* CTA */}
      <Card className="border-primary/30 bg-muted/30">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div>
            <CardTitle className="text-base">Ready to practise?</CardTitle>
            <CardDescription>
              Try {skill.title} questions
              {relatedTest ? ` or take the ${relatedTest.title}` : ""}.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`/practice/${skill.id}`}>
                <PencilLine />
                Practice {skill.title}
              </Link>
            </Button>
            {relatedTest ? (
              <Button asChild variant="outline">
                <Link href={`/tests/${relatedTest.id}`}>Take test</Link>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Prev / next */}
      <div className="flex items-center justify-between gap-2 border-t pt-4">
        {prev ? (
          <Button asChild variant="ghost" size="sm">
            <Link href={`/learn/${prev.id}`}>
              <ArrowLeft />
              {prev.title}
            </Link>
          </Button>
        ) : (
          <span />
        )}
        {next ? (
          <Button asChild variant="ghost" size="sm">
            <Link href={`/learn/${next.id}`}>
              {next.title}
              <ArrowRight />
            </Link>
          </Button>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}

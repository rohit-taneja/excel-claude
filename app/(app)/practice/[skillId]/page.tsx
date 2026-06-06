import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { getQuestionsForSkill, getSkill } from "@/lib/content";
import { Button } from "@/components/ui/button";
import { SkillIcon } from "@/components/skill-icon";
import { DifficultyBadge, PriorityBadge } from "@/components/skill-badges";
import { PracticeRunner } from "@/components/practice-runner";

export default async function PracticeSkillPage({
  params,
}: {
  params: Promise<{ skillId: string }>;
}) {
  await requireUser();
  const { skillId } = await params;
  const skill = getSkill(skillId);
  if (!skill) notFound();

  const questions = getQuestionsForSkill(skill.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/practice">
          <ArrowLeft />
          All skills
        </Link>
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
              <SkillIcon name={skill.icon} className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Practice: {skill.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {questions.length} question{questions.length === 1 ? "" : "s"} ·
                instant feedback
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <PriorityBadge priority={skill.priority} />
            <DifficultyBadge difficulty={skill.difficulty} />
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/learn/${skill.id}`}>
            <BookOpen />
            Review lesson
          </Link>
        </Button>
      </div>

      {questions.length > 0 ? (
        <PracticeRunner
          skillId={skill.id}
          skillTitle={skill.title}
          questions={questions}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          No practice questions are available for this skill yet. Try the lesson
          or take a related test.
        </p>
      )}
    </div>
  );
}

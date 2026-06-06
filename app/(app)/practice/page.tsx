import Link from "next/link";
import { PencilLine } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { getQuestionsForSkill, getSkills } from "@/lib/content";
import { getProgressForUser } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SkillIcon } from "@/components/skill-icon";
import {
  DifficultyBadge,
  PriorityBadge,
  StatusBadge,
} from "@/components/skill-badges";

export default async function PracticePage() {
  const user = await requireUser();
  const [skills, progress] = await Promise.all([
    getSkills(),
    getProgressForUser(user.userKey),
  ]);
  const progressById = new Map(progress.map((p) => [p.skillId, p]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Practice</h1>
        <p className="text-muted-foreground">
          Drill individual skills with instant feedback and partial-credit grading.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {skills.map((skill) => {
          const count = getQuestionsForSkill(skill.id).length;
          const status = progressById.get(skill.id)?.status ?? "not_started";
          return (
            <Card key={skill.id} className="flex flex-col">
              <CardHeader className="gap-2 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <SkillIcon name={skill.icon} className="size-5" />
                    {skill.title}
                  </CardTitle>
                  <StatusBadge status={status} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <PriorityBadge priority={skill.priority} />
                  <DifficultyBadge difficulty={skill.difficulty} />
                </div>
              </CardHeader>
              <CardContent className="mt-auto flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {count} question{count === 1 ? "" : "s"}
                </span>
                <Button asChild size="sm">
                  <Link href={`/practice/${skill.id}`}>
                    <PencilLine />
                    Practice
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

import Link from "next/link";
import { PencilLine } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { getQuestionsForSkill, getSkills } from "@/lib/content";
import { getProgressForUser } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="animate-enter">
        <h1 className="text-2xl font-semibold tracking-tight">Practice</h1>
        <p className="text-muted-foreground">
          Drill individual skills with instant feedback and partial-credit
          grading.
        </p>
      </div>

      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {skills.map((skill) => {
          const count = getQuestionsForSkill(skill.id).length;
          const status = progressById.get(skill.id)?.status ?? "not_started";
          return (
            <Card
              key={skill.id}
              className="group flex flex-col transition-all duration-200 ease-out hover:-translate-y-2 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/25 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <CardHeader className="gap-2 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <SkillIcon
                      name={skill.icon}
                      className="size-5 transition-transform duration-200 group-hover:scale-125 group-hover:-rotate-6 group-hover:text-primary motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-hover:rotate-0"
                    />
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

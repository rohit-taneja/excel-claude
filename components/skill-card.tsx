import Link from "next/link";
import { BookOpen, PencilLine } from "lucide-react";

import type { Skill, SkillStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SkillIcon } from "@/components/skill-icon";
import {
  DifficultyBadge,
  PriorityBadge,
  StatusBadge,
} from "@/components/skill-badges";

export function statusToPercent(status: SkillStatus): number {
  if (status === "completed") return 100;
  if (status === "in_progress") return 50;
  return 0;
}

export function SkillCard({
  skill,
  status = "not_started",
  score = 0,
}: {
  skill: Skill;
  status?: SkillStatus;
  score?: number;
}) {
  const percent = statusToPercent(status);

  return (
    <Card className="flex flex-col">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground">
              <SkillIcon name={skill.icon} className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold leading-tight">{skill.title}</h3>
              <p className="text-xs text-muted-foreground">{skill.category}</p>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <PriorityBadge priority={skill.priority} />
          <DifficultyBadge difficulty={skill.difficulty} />
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <p className="text-sm text-muted-foreground">{skill.summary}</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>
              {percent}%{score > 0 ? ` · best ${Math.round(score)}%` : ""}
            </span>
          </div>
          <Progress value={percent} />
        </div>
      </CardContent>

      <CardFooter className="gap-2">
        <Button asChild variant="default" size="sm" className="flex-1">
          <Link href={`/learn/${skill.id}`}>
            <BookOpen />
            Learn
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link href={`/practice/${skill.id}`}>
            <PencilLine />
            Practice
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

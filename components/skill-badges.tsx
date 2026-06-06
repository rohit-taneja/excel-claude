import { CheckCircle2, Flame, type LucideProps } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Difficulty, Priority, SkillStatus } from "@/lib/types";

export function PriorityBadge({ priority }: { priority: Priority }) {
  if (priority === "high") {
    return (
      <Badge variant="warning">
        <Flame />
        High priority
      </Badge>
    );
  }
  if (priority === "medium") {
    return <Badge variant="secondary">Medium priority</Badge>;
  }
  return <Badge variant="outline">Low priority</Badge>;
}

const DIFFICULTY_VARIANT: Record<
  Difficulty,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  easy: "success",
  medium: "info",
  hard: "destructive",
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <Badge variant={DIFFICULTY_VARIANT[difficulty]} className="capitalize">
      {difficulty}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: SkillStatus }) {
  if (status === "completed") {
    return (
      <Badge variant="success">
        <CheckCircle2 />
        Completed
      </Badge>
    );
  }
  if (status === "in_progress") {
    return <Badge variant="info">In progress</Badge>;
  }
  return <Badge variant="outline">Not started</Badge>;
}

export type { LucideProps };

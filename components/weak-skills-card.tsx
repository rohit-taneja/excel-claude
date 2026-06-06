import Link from "next/link";
import { ArrowRight, TriangleAlert } from "lucide-react";

import type { SkillProgressView } from "@/lib/reports";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SkillIcon } from "@/components/skill-icon";

export function WeakSkillsCard({ weakSkills }: { weakSkills: SkillProgressView[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TriangleAlert className="size-5 text-amber-500" />
          Weak skills
        </CardTitle>
        <CardDescription>Skills scoring below 60% — worth revisiting.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {weakSkills.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No weak skills yet. Take a test to find areas to improve.
          </p>
        ) : (
          weakSkills.slice(0, 6).map(({ skill, score }) => (
            <Link
              key={skill.id}
              href={`/practice/${skill.id}`}
              className="flex items-center justify-between rounded-md border p-2.5 text-sm transition-colors hover:bg-accent"
            >
              <span className="flex items-center gap-2 font-medium">
                <SkillIcon name={skill.icon} className="size-4 text-muted-foreground" />
                {skill.title}
              </span>
              <span className="flex items-center gap-2">
                <Badge variant="warning">{Math.round(score)}%</Badge>
                <ArrowRight className="size-4 text-muted-foreground" />
              </span>
            </Link>
          ))
        )}
        {weakSkills.length > 0 ? (
          <Button asChild variant="outline" size="sm" className="mt-1 w-full">
            <Link href="/reports">View full report</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

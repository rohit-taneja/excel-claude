import { requireUser } from "@/lib/auth";
import { getSkills } from "@/lib/content";
import { getProgressForUser } from "@/lib/db";
import { SkillCard } from "@/components/skill-card";

export default async function LearnPage() {
  const user = await requireUser();
  const [skills, progress] = await Promise.all([
    getSkills(),
    getProgressForUser(user.userKey),
  ]);
  const progressById = new Map(progress.map((p) => [p.skillId, p]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Learn</h1>
        <p className="text-muted-foreground">
          17 job-ready Excel skills in a recommended learning order. Start at the
          top and work down.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {skills.map((skill) => {
          const p = progressById.get(skill.id);
          return (
            <SkillCard
              key={skill.id}
              skill={skill}
              status={p?.status ?? "not_started"}
              score={p?.score ?? 0}
            />
          );
        })}
      </div>
    </div>
  );
}

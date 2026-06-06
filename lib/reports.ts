import "server-only";
import { getHighPrioritySkills, getSkills } from "./content";
import { getAttemptsForUser, getProgressForUser } from "./db";
import type { Skill, SkillStatus, TestAttempt } from "./types";

const PASS = 60;

export interface SkillProgressView {
  skill: Skill;
  status: SkillStatus;
  score: number;
}

export interface UserOverview {
  skillViews: SkillProgressView[];
  totalSkills: number;
  completedCount: number;
  inProgressCount: number;
  overallPercent: number;
  continueSkill?: Skill;
  nextRecommendedSkill?: Skill;
  weakSkills: SkillProgressView[];
  highPrioritySkills: Skill[];
  recentAttempts: TestAttempt[];
  averageScore: number | null;
}

export async function getUserOverview(userKey: string): Promise<UserOverview> {
  const [progress, recentAttempts] = await Promise.all([
    getProgressForUser(userKey),
    getAttemptsForUser(userKey, 8),
  ]);

  const progressById = new Map(progress.map((p) => [p.skillId, p]));
  const skills = getSkills();

  const skillViews: SkillProgressView[] = skills.map((skill) => {
    const p = progressById.get(skill.id);
    return {
      skill,
      status: p?.status ?? "not_started",
      score: p?.score ?? 0,
    };
  });

  const completedCount = skillViews.filter(
    (s) => s.status === "completed",
  ).length;
  const inProgressCount = skillViews.filter(
    (s) => s.status === "in_progress",
  ).length;
  const totalSkills = skillViews.length;
  const overallPercent =
    totalSkills > 0 ? Math.round((completedCount / totalSkills) * 100) : 0;

  const continueSkill =
    skillViews.find((s) => s.status === "in_progress")?.skill ??
    skillViews.find((s) => s.status === "not_started")?.skill;

  const nextRecommendedSkill = skillViews.find(
    (s) => s.status === "not_started",
  )?.skill;

  const weakSkills = skillViews
    .filter((s) => s.status !== "not_started" && s.score < PASS)
    .sort((a, b) => a.score - b.score);

  const averageScore =
    recentAttempts.length > 0
      ? Math.round(
          recentAttempts.reduce((sum, a) => sum + a.score, 0) /
            recentAttempts.length,
        )
      : null;

  return {
    skillViews,
    totalSkills,
    completedCount,
    inProgressCount,
    overallPercent,
    continueSkill,
    nextRecommendedSkill,
    weakSkills,
    highPrioritySkills: getHighPrioritySkills(),
    recentAttempts,
    averageScore,
  };
}

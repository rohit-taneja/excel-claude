"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "./auth";
import { correctAnswerText, getResolvedTest, getSkill } from "./content";
import { gradeQuestion } from "./grading";
import { createAttempt, saveAnswers, upsertProgress, type NewAnswer } from "./db";
import type { SkillStatus, SubmitTestInput } from "./types";

const PASS_THRESHOLD = 60;

export async function submitTest(
  input: SubmitTestInput,
): Promise<{ attemptId: string }> {
  const user = await getSessionUser();
  if (!user) throw new Error("You must be signed in to submit a test.");

  const test = getResolvedTest(input.testId);
  if (!test) throw new Error("Unknown test.");

  let totalPoints = 0;
  let earnedPoints = 0;
  let correctCount = 0;
  const skillScores = new Map<string, { earned: number; max: number }>();
  const answerRows: NewAnswer[] = [];

  for (const q of test.questions) {
    const raw = input.answers[q.id] ?? "";
    const result = gradeQuestion(q, raw);

    totalPoints += result.maxPoints;
    earnedPoints += result.pointsAwarded;
    if (result.isCorrect) correctCount += 1;

    answerRows.push({
      questionId: q.id,
      userAnswer: raw,
      correctAnswer: correctAnswerText(q),
      isCorrect: result.isCorrect,
      pointsAwarded: result.pointsAwarded,
      maxPoints: result.maxPoints,
    });

    for (const skillId of q.skills) {
      const cur = skillScores.get(skillId) ?? { earned: 0, max: 0 };
      cur.earned += result.pointsAwarded;
      cur.max += result.maxPoints;
      skillScores.set(skillId, cur);
    }
  }

  const scorePct =
    totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

  const attempt = await createAttempt({
    userKey: user.userKey,
    testId: test.id,
    score: scorePct,
    totalQuestions: test.questions.length,
    correctCount,
    startedAt: input.startedAt,
    durationSeconds: input.durationSeconds,
  });

  await saveAnswers(attempt.id, answerRows);

  for (const [skillId, sc] of skillScores) {
    if (!getSkill(skillId)) continue;
    const pct = sc.max > 0 ? Math.round((sc.earned / sc.max) * 100) : 0;
    const status: SkillStatus =
      pct >= PASS_THRESHOLD ? "completed" : "in_progress";
    await upsertProgress({ userKey: user.userKey, skillId, status, score: pct });
  }

  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return { attemptId: attempt.id };
}

export async function recordPractice(input: {
  skillId: string;
  scorePercent: number;
}): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;
  if (!getSkill(input.skillId)) return;

  const status: SkillStatus =
    input.scorePercent >= PASS_THRESHOLD ? "completed" : "in_progress";
  await upsertProgress({
    userKey: user.userKey,
    skillId: input.skillId,
    status,
    score: Math.round(input.scorePercent),
  });
  revalidatePath("/dashboard");
  revalidatePath("/reports");
}

import "server-only";
import { randomUUID } from "node:crypto";
import { getServiceClient } from "./supabase";
import type {
  SkillStatus,
  TestAnswerRow,
  TestAttempt,
  UserProgress,
} from "./types";

/**
 * Data-access layer. Uses Supabase when configured; otherwise falls back to an
 * in-memory store (per server process) so the app runs without a database.
 */

/* ------------------------------------------------------------------ */
/* In-memory fallback store                                            */
/* ------------------------------------------------------------------ */

interface MemoryStore {
  progress: Map<string, UserProgress>; // key: `${userKey}:${skillId}`
  attempts: Map<string, TestAttempt>;
  answers: TestAnswerRow[];
}

const globalRef = globalThis as unknown as { __excelStore?: MemoryStore };

function memory(): MemoryStore {
  if (!globalRef.__excelStore) {
    globalRef.__excelStore = {
      progress: new Map(),
      attempts: new Map(),
      answers: [],
    };
  }
  return globalRef.__excelStore;
}

function nowIso(): string {
  return new Date().toISOString();
}

/* ------------------------------------------------------------------ */
/* Supabase row shapes                                                 */
/* ------------------------------------------------------------------ */

interface ProgressRow {
  user_key: string;
  skill_id: string;
  status: string;
  score: number | null;
  completed_at: string | null;
  updated_at: string;
}

interface AttemptRow {
  id: string;
  user_key: string;
  test_id: string;
  score: number;
  total_questions: number;
  correct_count: number;
  started_at: string;
  submitted_at: string | null;
  duration_seconds: number | null;
}

interface AnswerRow {
  id: string;
  attempt_id: string;
  question_id: string;
  user_answer: unknown;
  correct_answer: unknown;
  is_correct: boolean;
  points_awarded: number;
  max_points: number;
  time_taken_seconds: number | null;
}

function toProgress(row: ProgressRow): UserProgress {
  return {
    userKey: row.user_key,
    skillId: row.skill_id,
    status: row.status as SkillStatus,
    score: row.score ?? 0,
    completedAt: row.completed_at,
    updatedAt: row.updated_at,
  };
}

function toAttempt(row: AttemptRow): TestAttempt {
  return {
    id: row.id,
    userKey: row.user_key,
    testId: row.test_id,
    score: row.score,
    totalQuestions: row.total_questions,
    correctCount: row.correct_count,
    startedAt: row.started_at,
    submittedAt: row.submitted_at,
    durationSeconds: row.duration_seconds,
  };
}

function toAnswer(row: AnswerRow): TestAnswerRow {
  return {
    id: row.id,
    attemptId: row.attempt_id,
    questionId: row.question_id,
    userAnswer: row.user_answer,
    correctAnswer: row.correct_answer,
    isCorrect: row.is_correct,
    pointsAwarded: row.points_awarded,
    maxPoints: row.max_points,
    timeTakenSeconds: row.time_taken_seconds,
  };
}

/* ------------------------------------------------------------------ */
/* Progress                                                            */
/* ------------------------------------------------------------------ */

export async function getProgressForUser(userKey: string): Promise<UserProgress[]> {
  const db = getServiceClient();
  if (!db) {
    return [...memory().progress.values()].filter((p) => p.userKey === userKey);
  }
  const { data, error } = await db
    .from("user_progress")
    .select("*")
    .eq("user_key", userKey);
  if (error) {
    console.error("getProgressForUser:", error.message);
    return [];
  }
  return (data as ProgressRow[]).map(toProgress);
}

export interface ProgressUpsert {
  userKey: string;
  skillId: string;
  status: SkillStatus;
  score: number;
}

export async function upsertProgress(input: ProgressUpsert): Promise<void> {
  const completedAt = input.status === "completed" ? nowIso() : null;
  const db = getServiceClient();

  if (!db) {
    const store = memory();
    const key = `${input.userKey}:${input.skillId}`;
    const existing = store.progress.get(key);
    // Keep the best score and don't downgrade a completed status.
    const status =
      existing?.status === "completed" ? "completed" : input.status;
    const score = Math.max(existing?.score ?? 0, input.score);
    store.progress.set(key, {
      userKey: input.userKey,
      skillId: input.skillId,
      status,
      score,
      completedAt: completedAt ?? existing?.completedAt ?? null,
      updatedAt: nowIso(),
    });
    return;
  }

  const { error } = await db.from("user_progress").upsert(
    {
      user_key: input.userKey,
      skill_id: input.skillId,
      status: input.status,
      score: input.score,
      completed_at: completedAt,
      updated_at: nowIso(),
    },
    { onConflict: "user_key,skill_id" },
  );
  if (error) console.error("upsertProgress:", error.message);
}

/* ------------------------------------------------------------------ */
/* Attempts & answers                                                  */
/* ------------------------------------------------------------------ */

export interface NewAttempt {
  userKey: string;
  testId: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  startedAt: string;
  durationSeconds: number;
}

export async function createAttempt(input: NewAttempt): Promise<TestAttempt> {
  const attempt: TestAttempt = {
    id: randomUUID(),
    userKey: input.userKey,
    testId: input.testId,
    score: input.score,
    totalQuestions: input.totalQuestions,
    correctCount: input.correctCount,
    startedAt: input.startedAt,
    submittedAt: nowIso(),
    durationSeconds: input.durationSeconds,
  };

  const db = getServiceClient();
  if (!db) {
    memory().attempts.set(attempt.id, attempt);
    return attempt;
  }

  const { error } = await db.from("test_attempts").insert({
    id: attempt.id,
    user_key: attempt.userKey,
    test_id: attempt.testId,
    score: attempt.score,
    total_questions: attempt.totalQuestions,
    correct_count: attempt.correctCount,
    started_at: attempt.startedAt,
    submitted_at: attempt.submittedAt,
    duration_seconds: attempt.durationSeconds,
  });
  if (error) console.error("createAttempt:", error.message);
  return attempt;
}

export interface NewAnswer {
  questionId: string;
  userAnswer: unknown;
  correctAnswer: unknown;
  isCorrect: boolean;
  pointsAwarded: number;
  maxPoints: number;
}

export async function saveAnswers(
  attemptId: string,
  answers: NewAnswer[],
): Promise<void> {
  const rows: TestAnswerRow[] = answers.map((a) => ({
    id: randomUUID(),
    attemptId,
    questionId: a.questionId,
    userAnswer: a.userAnswer,
    correctAnswer: a.correctAnswer,
    isCorrect: a.isCorrect,
    pointsAwarded: a.pointsAwarded,
    maxPoints: a.maxPoints,
    timeTakenSeconds: null,
  }));

  const db = getServiceClient();
  if (!db) {
    memory().answers.push(...rows);
    return;
  }

  const { error } = await db.from("test_answers").insert(
    rows.map((r) => ({
      id: r.id,
      attempt_id: r.attemptId,
      question_id: r.questionId,
      user_answer: r.userAnswer,
      correct_answer: r.correctAnswer,
      is_correct: r.isCorrect,
      points_awarded: r.pointsAwarded,
      max_points: r.maxPoints,
      time_taken_seconds: r.timeTakenSeconds,
    })),
  );
  if (error) console.error("saveAnswers:", error.message);
}

export async function getAttempt(id: string): Promise<TestAttempt | null> {
  const db = getServiceClient();
  if (!db) {
    return memory().attempts.get(id) ?? null;
  }
  const { data, error } = await db
    .from("test_attempts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("getAttempt:", error.message);
    return null;
  }
  return data ? toAttempt(data as AttemptRow) : null;
}

export async function getAnswersForAttempt(
  attemptId: string,
): Promise<TestAnswerRow[]> {
  const db = getServiceClient();
  if (!db) {
    return memory().answers.filter((a) => a.attemptId === attemptId);
  }
  const { data, error } = await db
    .from("test_answers")
    .select("*")
    .eq("attempt_id", attemptId);
  if (error) {
    console.error("getAnswersForAttempt:", error.message);
    return [];
  }
  return (data as AnswerRow[]).map(toAnswer);
}

export async function getAttemptsForUser(
  userKey: string,
  limit = 50,
): Promise<TestAttempt[]> {
  const db = getServiceClient();
  if (!db) {
    return [...memory().attempts.values()]
      .filter((a) => a.userKey === userKey)
      .sort((a, b) => (a.submittedAt ?? "") < (b.submittedAt ?? "") ? 1 : -1)
      .slice(0, limit);
  }
  const { data, error } = await db
    .from("test_attempts")
    .select("*")
    .eq("user_key", userKey)
    .order("submitted_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("getAttemptsForUser:", error.message);
    return [];
  }
  return (data as AttemptRow[]).map(toAttempt);
}

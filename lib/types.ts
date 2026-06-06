/** Shared domain types for the Excel learning app. */

export type Priority = "high" | "medium" | "low";
export type Difficulty = "easy" | "medium" | "hard";
export type SkillStatus = "not_started" | "in_progress" | "completed";
export type UserRole = "learner" | "admin";

/** A user record as stored in the APP_USERS_JSON environment variable. */
export interface AppUser {
  userKey: string;
  username: string;
  password: string;
  role: UserRole;
}

/** The minimal, non-sensitive user data stored in the session cookie. */
export interface SessionUser {
  userKey: string;
  username: string;
  role: UserRole;
}

export interface SkillExample {
  title: string;
  formula: string;
  explanation: string;
}

export interface Skill {
  id: string;
  title: string;
  order: number;
  priority: Priority;
  category: string;
  summary: string;
  syntax: string;
  difficulty: Difficulty;
  /** Optional lucide-react icon name used by the UI. */
  icon?: string;
  jobUseCases: string[];
  examples: SkillExample[];
  commonMistakes: string[];
  practiceTips?: string[];
}

export type QuestionType =
  | "mcq"
  | "formula_input"
  | "output_prediction"
  | "fix_formula"
  | "scenario"
  | "multi_function_formula";

export interface Dataset {
  headers: string[];
  rows: (string | number)[][];
  note?: string;
}

export interface Question {
  id: string;
  title: string;
  skills: string[];
  type: QuestionType;
  difficulty: Difficulty;
  prompt: string;
  dataset?: Dataset;
  /** Choices for `mcq` / `scenario` questions. */
  options?: string[];
  /** Exact answer for `mcq` / `scenario` / `output_prediction`. */
  correctAnswer?: string;
  /** Starting (broken) formula for `fix_formula` questions. */
  brokenFormula?: string;
  /** Functions/concepts required by the solution (used for partial credit). */
  expectedConcepts?: string[];
  /** Accepted formula variants for formula-based questions. */
  acceptedAnswers?: string[];
  expectedOutput?: string;
  explanation?: string;
  hint?: string;
  points: number;
}

export type TestCategory = "single-skill" | "mixed" | "job-simulation";

export interface Test {
  id: string;
  title: string;
  description: string;
  category: TestCategory;
  difficulty: Difficulty;
  skills: string[];
  durationMinutes: number;
  /** Passing score as a percentage (0-100). */
  passingScore: number;
  questionIds: string[];
}

/** A test with its questions resolved from the question bank. */
export interface ResolvedTest extends Test {
  questions: Question[];
}

/* ------------------------------------------------------------------ */
/* Persistence rows                                                    */
/* ------------------------------------------------------------------ */

export interface UserProgress {
  userKey: string;
  skillId: string;
  status: SkillStatus;
  score: number;
  completedAt: string | null;
  updatedAt: string;
}

export interface TestAttempt {
  id: string;
  userKey: string;
  testId: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  startedAt: string;
  submittedAt: string | null;
  durationSeconds: number | null;
}

export interface TestAnswerRow {
  id: string;
  attemptId: string;
  questionId: string;
  userAnswer: unknown;
  correctAnswer: unknown;
  isCorrect: boolean;
  pointsAwarded: number;
  maxPoints: number;
  timeTakenSeconds: number | null;
}

/** Payload sent from the test runner to the submitTest server action. */
export interface SubmitTestInput {
  testId: string;
  answers: Record<string, string>;
  startedAt: string;
  durationSeconds: number;
}

/* ------------------------------------------------------------------ */
/* Grading                                                             */
/* ------------------------------------------------------------------ */

export interface GradeResult {
  isCorrect: boolean;
  pointsAwarded: number;
  maxPoints: number;
  feedback: string;
  matchedConcepts: string[];
  missingConcepts: string[];
}

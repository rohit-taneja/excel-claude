import type { GradeResult, Question } from "./types";
import {
  answersEqual,
  extractFunctions,
  normalizeFormula,
  normalizeText,
} from "./formula";

/**
 * Grade a single question against a user's answer.
 *
 * - `mcq` / `scenario`: exact answer matching.
 * - `output_prediction`: numeric-aware exact matching.
 * - `formula_input` / `fix_formula` / `multi_function_formula`: accepted-answer
 *   matching with partial credit based on required functions/concepts.
 */
export function gradeQuestion(question: Question, rawAnswer: unknown): GradeResult {
  const maxPoints = question.points ?? 10;
  const answer =
    typeof rawAnswer === "string"
      ? rawAnswer
      : rawAnswer == null
        ? ""
        : String(rawAnswer);

  switch (question.type) {
    case "mcq":
    case "scenario":
      return gradeExactChoice(question, answer, maxPoints);
    case "output_prediction":
      return gradeOutput(question, answer, maxPoints);
    case "formula_input":
    case "fix_formula":
    case "multi_function_formula":
      return gradeFormula(question, answer, maxPoints);
    default:
      return blank(maxPoints, question);
  }
}

function gradeExactChoice(
  question: Question,
  answer: string,
  maxPoints: number,
): GradeResult {
  const candidates = [
    question.correctAnswer,
    ...(question.acceptedAnswers ?? []),
  ].filter((c): c is string => Boolean(c));

  if (!answer.trim()) {
    return {
      isCorrect: false,
      pointsAwarded: 0,
      maxPoints,
      feedback: "No answer selected.",
      matchedConcepts: [],
      missingConcepts: [],
    };
  }

  const correct = candidates.some((c) => normalizeText(c) === normalizeText(answer));
  return {
    isCorrect: correct,
    pointsAwarded: correct ? maxPoints : 0,
    maxPoints,
    feedback: correct
      ? "Correct."
      : `Incorrect. Expected: ${question.correctAnswer ?? candidates[0] ?? "—"}.`,
    matchedConcepts: [],
    missingConcepts: [],
  };
}

function gradeOutput(
  question: Question,
  answer: string,
  maxPoints: number,
): GradeResult {
  const candidates = [
    question.expectedOutput,
    question.correctAnswer,
    ...(question.acceptedAnswers ?? []),
  ].filter((c): c is string => Boolean(c));

  if (!answer.trim()) {
    return {
      isCorrect: false,
      pointsAwarded: 0,
      maxPoints,
      feedback: "No answer provided.",
      matchedConcepts: [],
      missingConcepts: [],
    };
  }

  const correct = candidates.some((c) => answersEqual(c, answer));
  return {
    isCorrect: correct,
    pointsAwarded: correct ? maxPoints : 0,
    maxPoints,
    feedback: correct
      ? "Correct output."
      : `Incorrect. Expected output: ${question.expectedOutput ?? candidates[0] ?? "—"}.`,
    matchedConcepts: [],
    missingConcepts: [],
  };
}

/**
 * Grade a formula answer. Full marks for an accepted variant; otherwise partial
 * credit proportional to the required functions present (capped below full so
 * that only an accepted answer earns 100%).
 */
function gradeFormula(
  question: Question,
  answer: string,
  maxPoints: number,
): GradeResult {
  const userNorm = normalizeFormula(answer);
  const required = (question.expectedConcepts ?? []).map((c) => c.toUpperCase());

  if (!userNorm) {
    return {
      isCorrect: false,
      pointsAwarded: 0,
      maxPoints,
      feedback: "No formula provided.",
      matchedConcepts: [],
      missingConcepts: required,
    };
  }

  // 1. Exact / accepted-answer match → full marks.
  const accepted = question.acceptedAnswers ?? [];
  const isAccepted = accepted.some((a) => normalizeFormula(a) === userNorm);
  if (isAccepted) {
    const used = extractFunctions(answer);
    return {
      isCorrect: true,
      pointsAwarded: maxPoints,
      maxPoints,
      feedback: "Correct — your formula matches an accepted solution.",
      matchedConcepts: required.length ? required : used,
      missingConcepts: [],
    };
  }

  // 2. Partial credit by required-function coverage.
  if (required.length === 0) {
    return {
      isCorrect: false,
      pointsAwarded: 0,
      maxPoints,
      feedback: "Your formula did not match an accepted solution.",
      matchedConcepts: [],
      missingConcepts: [],
    };
  }

  const used = extractFunctions(answer);
  const matched = required.filter((r) => used.includes(r));
  const missing = required.filter((r) => !used.includes(r));
  const coverage = matched.length / required.length;

  // Up to 80% of the marks for using the right functions; never full credit
  // unless an accepted answer matched above.
  let pointsAwarded = Math.round(maxPoints * coverage * 0.8);
  if (pointsAwarded >= maxPoints) pointsAwarded = maxPoints - 1;
  pointsAwarded = Math.max(0, pointsAwarded);

  let feedback: string;
  if (matched.length === required.length) {
    feedback = `You used the right functions (${matched.join(
      ", ",
    )}) but the exact formula did not match an accepted answer. Partial credit awarded.`;
  } else if (matched.length > 0) {
    feedback = `Partial credit: you used ${matched.join(", ")}. Missing: ${missing.join(
      ", ",
    )}.`;
  } else {
    feedback = `Your formula is missing the expected functions: ${missing.join(", ")}.`;
  }

  return {
    isCorrect: false,
    pointsAwarded,
    maxPoints,
    feedback,
    matchedConcepts: matched,
    missingConcepts: missing,
  };
}

function blank(maxPoints: number, question: Question): GradeResult {
  return {
    isCorrect: false,
    pointsAwarded: 0,
    maxPoints,
    feedback: `Unsupported question type: ${question.type}.`,
    matchedConcepts: [],
    missingConcepts: [],
  };
}

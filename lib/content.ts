import type {
  Question,
  ResolvedTest,
  Skill,
  Test,
} from "./types";

// Skills
import ifSkill from "@/content/skills/if.json";
import sumifsSkill from "@/content/skills/sumifs.json";
import countifsSkill from "@/content/skills/countifs.json";
import xlookupSkill from "@/content/skills/xlookup.json";
import vlookupSkill from "@/content/skills/vlookup.json";
import indexMatchSkill from "@/content/skills/index-match.json";
import iferrorSkill from "@/content/skills/iferror.json";
import trimSkill from "@/content/skills/trim.json";
import textFunctionsSkill from "@/content/skills/text-functions.json";
import pivotTablesSkill from "@/content/skills/pivot-tables.json";
import conditionalFormattingSkill from "@/content/skills/conditional-formatting.json";
import dataValidationSkill from "@/content/skills/data-validation.json";
import datedifSkill from "@/content/skills/datedif.json";
import networkdaysSkill from "@/content/skills/networkdays.json";
import filterSkill from "@/content/skills/filter.json";
import sortSkill from "@/content/skills/sort.json";
import uniqueSkill from "@/content/skills/unique.json";

// Question banks
import ifQuestions from "@/content/questions/if.json";
import sumifsQuestions from "@/content/questions/sumifs.json";
import countifsQuestions from "@/content/questions/countifs.json";
import lookupQuestions from "@/content/questions/lookup.json";
import cleaningQuestions from "@/content/questions/cleaning.json";
import comboQuestions from "@/content/questions/combo.json";
import pivotQuestions from "@/content/questions/pivot-tables.json";
import miscQuestions from "@/content/questions/misc.json";

// Tests
import beginnerTest from "@/content/tests/beginner-test.json";
import lookupTest from "@/content/tests/lookup-test.json";
import dataCleaningTest from "@/content/tests/data-cleaning-test.json";
import formulaComboTest from "@/content/tests/formula-combo-test.json";
import jobInterviewTest from "@/content/tests/job-interview-test.json";
import hrExcelTest from "@/content/tests/hr-excel-test.json";
import salesExcelTest from "@/content/tests/sales-excel-test.json";

/** A question with answer-revealing fields removed (safe to send to clients during a test). */
export type PublicQuestion = Omit<
  Question,
  "correctAnswer" | "acceptedAnswers" | "expectedOutput" | "expectedConcepts" | "explanation"
>;

export const skills: Skill[] = (
  [
    ifSkill,
    sumifsSkill,
    countifsSkill,
    xlookupSkill,
    vlookupSkill,
    indexMatchSkill,
    iferrorSkill,
    trimSkill,
    textFunctionsSkill,
    pivotTablesSkill,
    conditionalFormattingSkill,
    dataValidationSkill,
    datedifSkill,
    networkdaysSkill,
    filterSkill,
    sortSkill,
    uniqueSkill,
  ] as unknown as Skill[]
).sort((a, b) => a.order - b.order);

export const questions: Question[] = [
  ...ifQuestions,
  ...sumifsQuestions,
  ...countifsQuestions,
  ...lookupQuestions,
  ...cleaningQuestions,
  ...comboQuestions,
  ...pivotQuestions,
  ...miscQuestions,
] as unknown as Question[];

export const tests: Test[] = [
  beginnerTest,
  lookupTest,
  dataCleaningTest,
  formulaComboTest,
  jobInterviewTest,
  hrExcelTest,
  salesExcelTest,
] as unknown as Test[];

const skillsById = new Map(skills.map((s) => [s.id, s]));
const questionsById = new Map(questions.map((q) => [q.id, q]));
const testsById = new Map(tests.map((t) => [t.id, t]));

export function getSkills(): Skill[] {
  return skills;
}

export function getSkill(id: string): Skill | undefined {
  return skillsById.get(id);
}

export function getHighPrioritySkills(): Skill[] {
  return skills.filter((s) => s.priority === "high");
}

export function getQuestion(id: string): Question | undefined {
  return questionsById.get(id);
}

export function getQuestionsForSkill(skillId: string): Question[] {
  return questions.filter((q) => q.skills.includes(skillId));
}

export function getTests(): Test[] {
  return tests;
}

export function getTest(id: string): Test | undefined {
  return testsById.get(id);
}

/** Resolve a test's question ids into full questions (skips any unknown ids). */
export function getResolvedTest(id: string): ResolvedTest | null {
  const test = testsById.get(id);
  if (!test) return null;
  const resolved = test.questionIds
    .map((qid) => questionsById.get(qid))
    .filter((q): q is Question => Boolean(q));
  return { ...test, questions: resolved };
}

/** Human-readable "correct answer" for a question, used for storage and review. */
export function correctAnswerText(q: Question): string {
  if (q.type === "mcq" || q.type === "scenario") return q.correctAnswer ?? "";
  if (q.type === "output_prediction")
    return q.expectedOutput ?? q.correctAnswer ?? "";
  return q.acceptedAnswers?.[0] ?? "";
}

/** Strip answer-revealing fields so a question can be safely rendered during a test. */
export function toPublicQuestion(q: Question): PublicQuestion {
  return {
    id: q.id,
    title: q.title,
    skills: q.skills,
    type: q.type,
    difficulty: q.difficulty,
    prompt: q.prompt,
    dataset: q.dataset,
    options: q.options,
    brokenFormula: q.brokenFormula,
    hint: q.hint,
    points: q.points,
  };
}

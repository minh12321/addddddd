import { normalizeQuestions, normalizeQuestionType } from "./normalizer";
import { validateQuestions } from "./validator";
import type { ParseResult, RawSheetRow, ValidationIssue } from "../types/moodle";

export function buildParseResult(rawRows: RawSheetRow[]): ParseResult {
  const rawIssues: ValidationIssue[] = rawRows
    .filter((row) => !row.type || !normalizeQuestionType(row.type))
    .map((row) => ({
      level: "error",
      sheetName: row.sheetName,
      rowNumber: row.rowNumber,
      questionId: row.questionId,
      message: row.type ? `Type không hợp lệ: ${row.type}.` : "Thiếu type.",
    }));

  const validRows = rawRows.filter((row) => Boolean(row.type) && Boolean(normalizeQuestionType(row.type)));
  const questions = normalizeQuestions(validRows);
  const issues = [...rawIssues, ...validateQuestions(questions)];

  return {
    rawRows,
    questions,
    issues,
  };
}

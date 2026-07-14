import { OPTION_KEYS, SUPPORTED_TYPES } from "./constants";
import { normalizeTrueFalse } from "./text";
import type { NormalizedQuestion, ValidationIssue } from "../types/moodle";

function createIssue(question: NormalizedQuestion, level: "error" | "warning", message: string): ValidationIssue {
  return {
    level,
    sheetName: question.sourceSheet,
    rowNumber: question.sourceRow,
    questionId: question.questionId,
    message,
  };
}

function validateCommon(question: NormalizedQuestion, issues: ValidationIssue[]) {
  if (!question.questionId) {
    issues.push(createIssue(question, "error", "Thiếu question_id."));
  }

  if (!SUPPORTED_TYPES.includes(question.type)) {
    issues.push(createIssue(question, "error", `Type không hợp lệ: ${question.type}.`));
  }

  if (!question.questionText) {
    issues.push(createIssue(question, "error", "Thiếu question_text."));
  }

  if (question.grade < 0) {
    issues.push(createIssue(question, "error", "grade phải >= 0."));
  }
}

function validateChoice(question: NormalizedQuestion, issues: ValidationIssue[]) {
  if (question.options.length < 2) {
    issues.push(createIssue(question, "error", "Câu trắc nghiệm cần ít nhất 2 lựa chọn."));
  }

  if (question.correctAnswers.length === 0) {
    issues.push(createIssue(question, "error", "Thiếu correct_answer."));
  }

  const optionKeys = new Set(question.options.map((option) => option.key));
  question.correctAnswers.forEach((answer) => {
    if (!OPTION_KEYS.includes(answer as any) || !optionKeys.has(answer as any)) {
      issues.push(createIssue(question, "error", `Đáp án đúng '${answer}' không tồn tại trong các option.`));
    }
  });

  if (question.type === "single" && question.correctAnswers.length > 1) {
    issues.push(createIssue(question, "error", "Type single chỉ được có 1 đáp án đúng."));
  }

  if (question.type === "multi" && question.correctAnswers.length < 2) {
    issues.push(createIssue(question, "warning", "Type multi thường nên có từ 2 đáp án đúng trở lên."));
  }
}

function validateMatching(question: NormalizedQuestion, issues: ValidationIssue[]) {
  if (question.matchingPairs.length < 2) {
    issues.push(createIssue(question, "error", "Câu matching cần ít nhất 2 cặp ghép."));
  }

  question.matchingPairs.forEach((pair) => {
    if (!pair.left || !pair.right) {
      issues.push({
        level: "error",
        sheetName: question.sourceSheet,
        rowNumber: pair.rowNumber,
        questionId: question.questionId,
        message: "Matching thiếu left_text hoặc right_text.",
      });
    }
  });
}


function extractDragPlaceholders(questionText: string): number[] {
  const values = new Set<number>();
  const regex = /\[\[(\d+)\]\]/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(questionText)) !== null) {
    const value = Number.parseInt(match[1], 10);
    if (Number.isFinite(value) && value > 0) values.add(value);
  }

  return [...values].sort((a, b) => a - b);
}

function validatePlaceholderChoiceQuestion(question: NormalizedQuestion, issues: ValidationIssue[], typeLabel: string) {
  const placeholders = extractDragPlaceholders(question.questionText);

  if (placeholders.length === 0) {
    issues.push(createIssue(question, "error", `${typeLabel} cần có chỗ trống dạng [[1]], [[2]], ... trong question_text.`));
  }

  if (question.dragDropTextItems.length === 0) {
    issues.push(createIssue(question, "error", `${typeLabel} cần ít nhất 1 drag_text.`));
  }

  const itemNos = new Set<number>();
  question.dragDropTextItems.forEach((item) => {
    if (!item.text) {
      issues.push({
        level: "error",
        sheetName: question.sourceSheet,
        rowNumber: item.rowNumber,
        questionId: question.questionId,
        message: "Drag & drop thiếu drag_text.",
      });
    }

    if (!Number.isInteger(item.no) || item.no < 1) {
      issues.push({
        level: "error",
        sheetName: question.sourceSheet,
        rowNumber: item.rowNumber,
        questionId: question.questionId,
        message: "drag_no phải là số nguyên >= 1.",
      });
    }

    if (itemNos.has(item.no)) {
      issues.push({
        level: "error",
        sheetName: question.sourceSheet,
        rowNumber: item.rowNumber,
        questionId: question.questionId,
        message: `drag_no bị trùng: ${item.no}.`,
      });
    }
    itemNos.add(item.no);

    if (!Number.isInteger(item.group) || item.group < 1) {
      issues.push({
        level: "error",
        sheetName: question.sourceSheet,
        rowNumber: item.rowNumber,
        questionId: question.questionId,
        message: "group phải là số nguyên >= 1.",
      });
    }
  });

  placeholders.forEach((placeholder) => {
    if (!itemNos.has(placeholder)) {
      issues.push(createIssue(question, "error", `Thiếu drag_text cho chỗ trống [[${placeholder}]].`));
    }
  });

  question.dragDropTextItems.forEach((item) => {
    if (!placeholders.includes(item.no)) {
      issues.push({
        level: "warning",
        sheetName: question.sourceSheet,
        rowNumber: item.rowNumber,
        questionId: question.questionId,
        message: `drag_no ${item.no} không xuất hiện trong question_text, sẽ được xem là lựa chọn nhiễu.`,
      });
    }
  });
}

function validateDragDropText(question: NormalizedQuestion, issues: ValidationIssue[]) {
  validatePlaceholderChoiceQuestion(question, issues, "dragdrop_text");
}

function validateSelectMissingWords(question: NormalizedQuestion, issues: ValidationIssue[]) {
  validatePlaceholderChoiceQuestion(question, issues, "select_missing_words");
}

export function validateQuestions(questions: NormalizedQuestion[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const ids = new Map<string, NormalizedQuestion>();

  questions.forEach((question) => {
    validateCommon(question, issues);

    const idKey = `${question.sourceSheet}::${question.questionId}`;
    const existed = ids.get(idKey);
    if (existed && question.type !== "description" && !question.isGeneratedPassage) {
      issues.push(createIssue(question, "error", `question_id bị trùng trong cùng tab: ${question.questionId}.`));
    }
    ids.set(idKey, question);

    switch (question.type) {
      case "single":
      case "multi":
        validateChoice(question, issues);
        break;
      case "truefalse":
        if (!normalizeTrueFalse(question.correctAnswers[0] || "")) {
          issues.push(createIssue(question, "error", "truefalse chỉ nhận TRUE/FALSE, Đúng/Sai hoặc 1/0."));
        }
        break;
      case "shortanswer":
        if (question.correctAnswers.length === 0) {
          issues.push(createIssue(question, "error", "shortanswer cần ít nhất 1 correct_answer."));
        }
        break;
      case "numerical":
        if (question.correctAnswers.length === 0 || Number.isNaN(Number(question.correctAnswers[0]))) {
          issues.push(createIssue(question, "error", "numerical cần correct_answer là số."));
        }
        break;
      case "matching":
        validateMatching(question, issues);
        break;
      case "dragdrop_text":
        validateDragDropText(question, issues);
        break;
      case "select_missing_words":
        validateSelectMissingWords(question, issues);
        break;
      case "cloze":
        if (!question.questionText.includes("{")) {
          issues.push(createIssue(question, "warning", "Cloze thường cần cú pháp {1:SHORTANSWER:=...}."));
        }
        break;
      case "essay":
      case "description":
      default:
        break;
    }
  });

  return issues;
}

import { DEFAULT_CATEGORY, OPTION_KEYS, SUPPORTED_TYPES } from "./constants";
import { cleanText, normalizeTrueFalse, splitAnswers } from "./text";
import type { NormalizedQuestion, OptionKey, RawSheetRow, SupportedQuestionType } from "../types/moodle";

export function normalizeQuestionType(type: string): SupportedQuestionType | "" {
  const normalized = cleanText(type)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "");

  const aliases: Record<string, SupportedQuestionType> = {
    single: "single",
    singlechoice: "single",
    mcq: "single",
    multichoice: "single",
    tracnghiem: "single",
    motdapan: "single",
    multi: "multi",
    multiple: "multi",
    multiplechoice: "multi",
    nhieudapan: "multi",
    truefalse: "truefalse",
    true_false: "truefalse",
    dung_sai: "truefalse",
    dungsai: "truefalse",
    shortanswer: "shortanswer",
    short_answer: "shortanswer",
    traloingan: "shortanswer",
    numerical: "numerical",
    number: "numerical",
    so: "numerical",
    matching: "matching",
    match: "matching",
    ghepdoi: "matching",
    essay: "essay",
    tuluan: "essay",
    description: "description",
    desc: "description",
    mota: "description",
    cloze: "cloze",
    embedded: "cloze",
    ddwtos: "dragdrop_text",
    dragdroptext: "dragdrop_text",
    dragdropintotext: "dragdrop_text",
    dragdrop: "dragdrop_text",
    keothachu: "dragdrop_text",
    keothavanban: "dragdrop_text",
    keothavaotext: "dragdrop_text",
    gapselect: "select_missing_words",
    selectmissingwords: "select_missing_words",
    selectmissingword: "select_missing_words",
    missingwords: "select_missing_words",
    missingword: "select_missing_words",
    selectmissing: "select_missing_words",
    chontuthieu: "select_missing_words",
    dienkhuyet: "select_missing_words",
  };

  const result = aliases[normalized] || normalized;
  return SUPPORTED_TYPES.includes(result as SupportedQuestionType) ? (result as SupportedQuestionType) : "";
}

function parseGrade(value: string, fallback = 1): number {
  const number = Number(cleanText(value).replace(",", "."));
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function parseTolerance(value: string): number {
  const number = Number(cleanText(value).replace(",", "."));
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function parsePositiveInteger(value: string, fallback: number): number {
  const number = Number.parseInt(cleanText(value), 10);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function parseBoolean(value: string): boolean {
  const normalized = cleanText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");

  return ["true", "t", "1", "yes", "y", "co", "dung", "infinite", "unlimited", "reuse"].includes(normalized);
}

function buildOptions(row: RawSheetRow) {
  return OPTION_KEYS.map((key: OptionKey) => ({ key, text: cleanText(row.options[key]) })).filter((item) => item.text);
}

function buildCorrectAnswers(row: RawSheetRow, type: SupportedQuestionType): string[] {
  if (type === "truefalse") return [normalizeTrueFalse(row.correctAnswer)].filter(Boolean);

  const answers = splitAnswers(row.correctAnswer);
  if (type === "single" || type === "multi") return answers.map((answer) => answer.toUpperCase());

  return answers;
}

function buildQuestionFromRow(row: RawSheetRow, type: SupportedQuestionType): NormalizedQuestion {
  const correctAnswers = buildCorrectAnswers(row, type);

  return {
    sourceSheet: row.sheetName,
    sourceRow: row.rowNumber,
    category: row.category || DEFAULT_CATEGORY,
    questionId: row.questionId,
    type,
    questionName: row.questionName || row.questionId || `${row.sheetName} dòng ${row.rowNumber}`,
    questionText: row.questionText,
    options: buildOptions(row),
    correctAnswers,
    explanation: row.explanation,
    grade: parseGrade(row.grade, type === "description" ? 0 : 1),
    tolerance: parseTolerance(row.tolerance),
    matchingPairs: [],
    dragDropTextItems: [],
  };
}

export function normalizeQuestions(rows: RawSheetRow[]): NormalizedQuestion[] {
  const questions: NormalizedQuestion[] = [];
  const matchingMap = new Map<string, NormalizedQuestion>();
  const placeholderChoiceMap = new Map<string, NormalizedQuestion>();
  const seenPassages = new Set<string>();

  rows.forEach((row) => {
    const type = normalizeQuestionType(row.type);
    if (!type) {
      questions.push(buildQuestionFromRow(row, "description"));
      return;
    }

    const passageKey = cleanText(row.passageId);
    if (passageKey && row.passageText && !seenPassages.has(passageKey)) {
      seenPassages.add(passageKey);
      questions.push({
        sourceSheet: row.sheetName,
        sourceRow: row.rowNumber,
        category: row.category || DEFAULT_CATEGORY,
        questionId: `PASSAGE_${passageKey}`,
        type: "description",
        questionName: `Đoạn đọc ${passageKey}`,
        questionText: row.passageText,
        options: [],
        correctAnswers: [],
        explanation: "",
        grade: 0,
        tolerance: 0,
        matchingPairs: [],
        dragDropTextItems: [],
        isGeneratedPassage: true,
      });
    }

    if (type === "matching") {
      const mapKey = `${row.sheetName}::${type}::${row.questionId || `row-${row.rowNumber}`}`;
      let question = matchingMap.get(mapKey);
      if (!question) {
        question = buildQuestionFromRow(row, type);
        matchingMap.set(mapKey, question);
        questions.push(question);
      }
      question.matchingPairs.push({
        left: row.leftText,
        right: row.rightText,
        rowNumber: row.rowNumber,
      });
      return;
    }

    if (type === "dragdrop_text" || type === "select_missing_words") {
      const mapKey = `${row.sheetName}::${type}::${row.questionId || `row-${row.rowNumber}`}`;
      let question = placeholderChoiceMap.get(mapKey);
      if (!question) {
        question = buildQuestionFromRow(row, type);
        placeholderChoiceMap.set(mapKey, question);
        questions.push(question);
      }

      const nextNo = question.dragDropTextItems.length + 1;
      question.dragDropTextItems.push({
        no: parsePositiveInteger(row.dragNo, nextNo),
        text: row.dragText,
        group: parsePositiveInteger(row.dragGroup, 1),
        unlimited: parseBoolean(row.unlimited),
        rowNumber: row.rowNumber,
      });
      return;
    }

    questions.push(buildQuestionFromRow(row, type));
  });

  placeholderChoiceMap.forEach((question) => {
    question.dragDropTextItems.sort((a, b) => a.no - b.no || a.rowNumber - b.rowNumber);
  });

  return questions;
}

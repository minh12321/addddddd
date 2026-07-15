import { DEFAULT_CATEGORY, OPTION_KEYS, SUPPORTED_TYPES } from "./constants";
import { cleanText, normalizeTrueFalse, splitAnswers } from "./text";
import type { ClozeAnswerType, ClozeItem, NormalizedQuestion, OptionKey, RawSheetRow, SupportedQuestionType } from "../types/moodle";

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

function normalizeOptionalBooleanValue(value: string): string {
  return cleanText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/Ä‘/g, "d")
    .replace(/[^a-z0-9]+/g, "");
}

function parseOptionalBoolean(value: string): boolean | undefined {
  const normalized = normalizeOptionalBooleanValue(value);
  if (!normalized) return undefined;
  if (["true", "t", "1", "yes", "y", "co", "dung", "on", "shuffle", "random"].includes(normalized)) return true;
  if (["false", "f", "0", "no", "n", "khong", "sai", "off", "none"].includes(normalized)) return false;
  return undefined;
}

function buildCorrectAnswers(row: RawSheetRow, type: SupportedQuestionType): string[] {
  if (type === "truefalse") return [normalizeTrueFalse(row.correctAnswer)].filter(Boolean);

  const answers = splitAnswers(row.correctAnswer);
  if (type === "single" || type === "multi") return answers.map((answer) => answer.toUpperCase());

  return answers;
}

function normalizeClozeAnswerType(row: RawSheetRow): ClozeAnswerType {
  const normalized = cleanText(row.clozeAnswerType)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/Ä‘/g, "d")
    .replace(/[^a-z0-9]+/g, "");

  const aliases: Record<string, ClozeAnswerType> = {
    shortanswer: "shortanswer",
    shortanswercase: "shortanswer_c",
    shortanswerc: "shortanswer_c",
    shortanswercasesensitive: "shortanswer_c",
    shortanswer_c: "shortanswer_c",
    short: "shortanswer",
    text: "shortanswer",
    traloingan: "shortanswer",
    numerical: "numerical",
    number: "numerical",
    numeric: "numerical",
    so: "numerical",
    multichoice: "multichoice",
    multiplechoice: "multichoice",
    multi: "multichoice",
    mc: "multichoice",
    choice: "multichoice",
    singlechoice: "multichoice",
    tracnghiem: "multichoice",
    mcv: "mcv",
    multichoicev: "mcv",
    multichoice_v: "mcv",
    multichoicevertical: "mcv",
    vertical: "mcv",
    doc: "mcv",
    mcc: "mch",
    mch: "mch",
    multichoiceh: "mch",
    multichoice_h: "mch",
    multichoicehorizontal: "mch",
    horizontal: "mch",
    ngang: "mch",
  };

  if (aliases[normalized]) return aliases[normalized];
  if (buildOptions(row).length >= 2) return "multichoice";

  const firstAnswer = splitAnswers(row.correctAnswer)[0] || "";
  const answerNumber = Number(firstAnswer.replace(",", "."));
  if (firstAnswer && Number.isFinite(answerNumber)) return "numerical";

  return "shortanswer";
}

function shouldBuildStructuredCloze(row: RawSheetRow): boolean {
  return Boolean(cleanText(row.correctAnswer) || cleanText(row.clozeAnswerType) || buildOptions(row).length);
}

function escapeClozeText(value: string): string {
  return cleanText(value).replace(/([~=#{}])/g, "\\$1");
}

function normalizeClozeNumericalAnswer(value: string): string {
  return cleanText(value).replace(",", ".");
}

function buildClozeItem(row: RawSheetRow): ClozeItem {
  const answerType = normalizeClozeAnswerType(row);
  const correctAnswers = splitAnswers(row.correctAnswer);

  return {
    prompt: row.questionText,
    answerType,
    correctAnswers,
    options: buildOptions(row),
    tolerance: parseTolerance(row.tolerance),
    shuffleAnswers: parseOptionalBoolean(row.shuffleAnswers) ?? false,
    showCorrectWhenWrong: parseOptionalBoolean(row.showCorrectWhenWrong) ?? true,
    explanation: row.explanation,
    rowNumber: row.rowNumber,
  };
}

function isCorrectClozeOption(option: { key: OptionKey; text: string }, correctAnswers: string[]): boolean {
  const correctKeySet = new Set(correctAnswers.map((answer) => answer.toUpperCase()));
  const correctTextSet = new Set(correctAnswers.map((answer) => cleanText(answer).toLowerCase()));
  return correctKeySet.has(option.key) || correctTextSet.has(cleanText(option.text).toLowerCase());
}

function getCorrectClozeAnswerText(item: ClozeItem): string {
  if (item.answerType === "multichoice" || item.answerType === "mcv" || item.answerType === "mch") {
    const correctOptions = item.options
      .filter((option) => isCorrectClozeOption(option, item.correctAnswers))
      .map((option) => option.text);

    if (correctOptions.length) return correctOptions.join("; ");
  }

  return item.correctAnswers.join("; ");
}

function buildClozeAnswerCode(item: ClozeItem): string {
  const weight = 1;

  if (item.answerType === "numerical") {
    const answer = normalizeClozeNumericalAnswer(item.correctAnswers[0] || "");
    return `{${weight}:NUMERICAL:=${escapeClozeText(answer)}:${item.tolerance}}`;
  }

  if (item.answerType === "multichoice" || item.answerType === "mcv" || item.answerType === "mch") {
    const moodleTypeByAnswerType: Record<"multichoice" | "mcv" | "mch", [string, string]> = {
      multichoice: ["MULTICHOICE", "MULTICHOICE_S"],
      mcv: ["MCV", "MCVS"],
      mch: ["MCH", "MCHS"],
    };
    const moodleType = moodleTypeByAnswerType[item.answerType][item.shuffleAnswers ? 1 : 0];
    const answers = item.options
      .map((option, index) => {
        const separator = index === 0 ? "" : "~";
        const isCorrect = isCorrectClozeOption(option, item.correctAnswers);
        const correctnessMarker = isCorrect ? "=" : "";
        return `${separator}${correctnessMarker}${escapeClozeText(option.text)}`;
      })
      .join("");
    return `{${weight}:${moodleType}:${answers}}`;
  }

  const answers = item.correctAnswers.map((answer) => `=${escapeClozeText(answer)}`).join("~");
  return `{${weight}:${item.answerType === "shortanswer_c" ? "SHORTANSWER_C" : "SHORTANSWER"}:${answers}}`;
}

function buildStructuredClozeFeedback(items: ClozeItem[]): string {
  return items
    .map((item, index) => {
      const parts: string[] = [];
      const correctAnswerText = getCorrectClozeAnswerText(item);
      const explanation = cleanText(item.explanation);

      if (item.showCorrectWhenWrong && correctAnswerText) parts.push(`Đáp án đúng: ${correctAnswerText}`);
      if (explanation) parts.push(explanation);

      return parts.length ? `${index + 1}. ${parts.join(". ")}` : "";
    })
    .filter(Boolean)
    .join("<br>");
}

function buildStructuredClozeText(items: ClozeItem[], passageText = ""): string {
  const questionText = items
    .map((item, index) => {
      const answerCode = buildClozeAnswerCode(item);
      const prompt = cleanText(item.prompt);
      const promptWithAnswer = prompt.includes("[[answer]]")
        ? prompt.replace(/\[\[answer\]\]/g, answerCode)
        : `${prompt} ${answerCode}`.trim();

      return `${index + 1}. ${promptWithAnswer}`;
    })
    .join("<br><br>");

  const passage = cleanText(passageText);
  return passage ? `${passage}<br><br>${questionText}` : questionText;
}

function buildQuestionFromRow(row: RawSheetRow, type: SupportedQuestionType): NormalizedQuestion {
  const correctAnswers = buildCorrectAnswers(row, type);
  const defaultShuffleAnswers =
    type === "single" ||
    type === "multi" ||
    type === "matching" ||
    type === "dragdrop_text" ||
    type === "select_missing_words";

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
    shuffleAnswers: parseOptionalBoolean(row.shuffleAnswers) ?? defaultShuffleAnswers,
    matchingPairs: [],
    dragDropTextItems: [],
    clozeItems: [],
    clozePassageText: "",
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
    const isStructuredClozeRow = type === "cloze" && shouldBuildStructuredCloze(row);
    if (passageKey && row.passageText && !seenPassages.has(passageKey) && !isStructuredClozeRow) {
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
        shuffleAnswers: false,
        matchingPairs: [],
        dragDropTextItems: [],
        clozeItems: [],
        clozePassageText: "",
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

    if (type === "cloze" && shouldBuildStructuredCloze(row)) {
      const mapKey = `${row.sheetName}::${type}::${row.questionId || `row-${row.rowNumber}`}`;
      let question = placeholderChoiceMap.get(mapKey);
      if (!question) {
        question = buildQuestionFromRow(row, type);
        question.questionText = "";
        question.correctAnswers = [];
        question.clozePassageText = cleanText(row.passageText);
        placeholderChoiceMap.set(mapKey, question);
        questions.push(question);
      } else if (!question.clozePassageText && row.passageText) {
        question.clozePassageText = cleanText(row.passageText);
      }

      question.clozeItems.push(buildClozeItem(row));
      question.shuffleAnswers = question.clozeItems.some((item) => item.shuffleAnswers);
      question.questionText = buildStructuredClozeText(question.clozeItems, question.clozePassageText);
      question.explanation = buildStructuredClozeFeedback(question.clozeItems);
      question.grade = parseGrade(row.grade, question.grade || question.clozeItems.length);
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

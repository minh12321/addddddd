import * as XLSX from "xlsx";
import { IGNORED_SHEET_NAMES, OPTION_KEYS } from "./constants";
import { cleanText, normalizeHeader } from "./text";
import type { OptionKey, RawSheetRow } from "../types/moodle";

const FIELD_ALIASES = {
  category: ["category", "danh_muc", "thu_muc", "moodle_category"],
  questionId: ["question_id", "id", "ma_cau_hoi", "ma_cau", "question_code"],
  type: ["type", "question_type", "loai", "loai_cau_hoi"],
  questionName: ["question_name", "name", "ten_cau_hoi", "ten_cau"],
  questionText: ["question_text", "question", "content", "noi_dung", "noi_dung_cau_hoi", "cau_hoi"],
  correctAnswer: ["correct_answer", "answer", "dap_an", "dap_an_dung", "correct"],
  explanation: ["explanation", "feedback", "giai_thich", "loi_giai", "solution"],
  grade: ["grade", "point", "score", "diem"],
  leftText: ["left_text", "left", "ve_trai", "cot_trai", "question_left"],
  rightText: ["right_text", "right", "ve_phai", "cot_phai", "answer_right"],
  passageId: ["passage_id", "reading_id", "doan_id", "ma_doan"],
  passageText: ["passage_text", "reading_text", "doan_van", "noi_dung_doan"],
  tolerance: ["tolerance", "sai_so", "do_lech"],
  clozeAnswerType: ["cloze_answer_type", "answer_type", "cloze_type", "kieu_dap_an", "dang_dap_an"],
  shuffleAnswers: [
    "shuffle_answers",
    "shuffleanswers",
    "shuffle",
    "randomize_answers",
    "dao_dap_an",
    "ao_ap_an",
    "tron_dap_an",
    "tron_ap_an",
  ],
  showCorrectWhenWrong: [
    "show_correct_when_wrong",
    "show_answer_if_wrong",
    "show_correct_answer_if_wrong",
    "chi_hien_dap_an_khi_sai",
    "chi_hien_ap_an_khi_sai",
    "hien_dap_an_khi_sai",
    "hien_ap_an_khi_sai",
  ],
  dragNo: ["drag_no", "dragbox_no", "choice_no", "choice_number", "so_thu_tu_keo_tha"],
  dragText: ["drag_text", "dragbox_text", "choice_text", "tu_keo_tha", "noi_dung_keo_tha"],
  dragGroup: ["group", "drag_group", "choice_group", "nhom"],
  unlimited: ["unlimited", "infinite", "reuse", "use_many", "dung_lai"],
} as const;

const OPTION_ALIASES: Record<OptionKey, string[]> = {
  A: ["option_a", "a", "answer_a", "dap_an_a", "lua_chon_a"],
  B: ["option_b", "b", "answer_b", "dap_an_b", "lua_chon_b"],
  C: ["option_c", "c", "answer_c", "dap_an_c", "lua_chon_c"],
  D: ["option_d", "d", "answer_d", "dap_an_d", "lua_chon_d"],
  E: ["option_e", "e", "answer_e", "dap_an_e", "lua_chon_e"],
  F: ["option_f", "f", "answer_f", "dap_an_f", "lua_chon_f"],
  G: ["option_g", "g", "answer_g", "dap_an_g", "lua_chon_g"],
  H: ["option_h", "h", "answer_h", "dap_an_h", "lua_chon_h"],
};

function getCell(row: Record<string, unknown>, aliases: readonly string[]): string {
  for (const alias of aliases) {
    if (Object.prototype.hasOwnProperty.call(row, alias)) return cleanText(row[alias]);
  }
  return "";
}

function normalizeRowKeys(row: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  Object.entries(row).forEach(([key, value]) => {
    normalized[normalizeHeader(key)] = value;
  });
  return normalized;
}

export async function parseWorkbookFile(file: File): Promise<RawSheetRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const rows: RawSheetRow[] = [];

  workbook.SheetNames.forEach((sheetName) => {
    if (IGNORED_SHEET_NAMES.has(normalizeHeader(sheetName))) return;

    const worksheet = workbook.Sheets[sheetName];
    const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: "",
      raw: false,
    });

    jsonRows.forEach((raw, index) => {
      const row = normalizeRowKeys(raw);
      const options = {} as Partial<Record<OptionKey, string>>;

      OPTION_KEYS.forEach((key) => {
        options[key] = getCell(row, OPTION_ALIASES[key]);
      });

      const parsedRow: RawSheetRow = {
        sheetName,
        rowNumber: index + 2,
        category: getCell(row, FIELD_ALIASES.category),
        questionId: getCell(row, FIELD_ALIASES.questionId),
        type: getCell(row, FIELD_ALIASES.type),
        questionName: getCell(row, FIELD_ALIASES.questionName),
        questionText: getCell(row, FIELD_ALIASES.questionText),
        options,
        correctAnswer: getCell(row, FIELD_ALIASES.correctAnswer),
        explanation: getCell(row, FIELD_ALIASES.explanation),
        grade: getCell(row, FIELD_ALIASES.grade),
        leftText: getCell(row, FIELD_ALIASES.leftText),
        rightText: getCell(row, FIELD_ALIASES.rightText),
        passageId: getCell(row, FIELD_ALIASES.passageId),
        passageText: getCell(row, FIELD_ALIASES.passageText),
        tolerance: getCell(row, FIELD_ALIASES.tolerance),
        clozeAnswerType: getCell(row, FIELD_ALIASES.clozeAnswerType),
        shuffleAnswers: getCell(row, FIELD_ALIASES.shuffleAnswers),
        showCorrectWhenWrong: getCell(row, FIELD_ALIASES.showCorrectWhenWrong),
        dragNo: getCell(row, FIELD_ALIASES.dragNo),
        dragText: getCell(row, FIELD_ALIASES.dragText),
        dragGroup: getCell(row, FIELD_ALIASES.dragGroup),
        unlimited: getCell(row, FIELD_ALIASES.unlimited),
      };

      const hasAnyValue = Object.values(parsedRow).some((value) => {
        if (typeof value === "object") return Object.values(value).some(Boolean);
        return Boolean(value);
      });

      if (hasAnyValue) rows.push(parsedRow);
    });
  });

  return rows;
}

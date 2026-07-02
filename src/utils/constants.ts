import type { OptionKey, SupportedQuestionType } from "../types/moodle";

export const IGNORED_SHEET_NAMES = new Set(["huong_dan", "hướng_dẫn", "_allowed_values", "allowed_values"]);

export const SUPPORTED_TYPES: SupportedQuestionType[] = [
  "single",
  "multi",
  "truefalse",
  "shortanswer",
  "numerical",
  "matching",
  "essay",
  "description",
  "cloze",
  "dragdrop_text",
];

export const OPTION_KEYS: OptionKey[] = ["A", "B", "C", "D", "E", "F", "G", "H"];

export const DEFAULT_CATEGORY = "Converted From Sheet";

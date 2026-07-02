export type SupportedQuestionType =
  | "single"
  | "multi"
  | "truefalse"
  | "shortanswer"
  | "numerical"
  | "matching"
  | "essay"
  | "description"
  | "cloze"
  | "dragdrop_text";

export type OptionKey = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";

export interface RawSheetRow {
  sheetName: string;
  rowNumber: number;
  category: string;
  questionId: string;
  type: string;
  questionName: string;
  questionText: string;
  options: Partial<Record<OptionKey, string>>;
  correctAnswer: string;
  explanation: string;
  grade: string;
  leftText: string;
  rightText: string;
  passageId: string;
  passageText: string;
  tolerance: string;
  dragNo: string;
  dragText: string;
  dragGroup: string;
  unlimited: string;
}

export interface QuestionOption {
  key: OptionKey;
  text: string;
}

export interface MatchingPair {
  left: string;
  right: string;
  rowNumber: number;
}

export interface DragDropTextItem {
  no: number;
  text: string;
  group: number;
  unlimited: boolean;
  rowNumber: number;
}

export interface NormalizedQuestion {
  sourceSheet: string;
  sourceRow: number;
  category: string;
  questionId: string;
  type: SupportedQuestionType;
  questionName: string;
  questionText: string;
  options: QuestionOption[];
  correctAnswers: string[];
  explanation: string;
  grade: number;
  tolerance: number;
  matchingPairs: MatchingPair[];
  dragDropTextItems: DragDropTextItem[];
  isGeneratedPassage?: boolean;
}

export interface ValidationIssue {
  level: "error" | "warning";
  sheetName: string;
  rowNumber: number;
  questionId?: string;
  message: string;
}

export interface ParseResult {
  rawRows: RawSheetRow[];
  questions: NormalizedQuestion[];
  issues: ValidationIssue[];
}

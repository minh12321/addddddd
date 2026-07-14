import { cdata, escapeXml } from "./text";
import type { NormalizedQuestion, QuestionOption } from "../types/moodle";

function formatNumber(value: number): string {
  return Number.isFinite(value) ? value.toFixed(7) : "1.0000000";
}

function textTag(value: string): string {
  return `<text>${cdata(value)}</text>`;
}

function feedbackTag(value: string): string {
  return `<feedback format="html">\n      ${textTag(value)}\n    </feedback>`;
}

function commonQuestionHeader(question: NormalizedQuestion): string {
  return `    <name>\n      <text>${escapeXml(question.questionName || question.questionId)}</text>\n    </name>\n    <questiontext format="html">\n      ${textTag(question.questionText)}\n    </questiontext>\n    <defaultgrade>${formatNumber(question.grade)}</defaultgrade>\n    <penalty>${question.type === "essay" || question.type === "description" ? "0.0000000" : "0.3333333"}</penalty>\n    <hidden>0</hidden>`;
}

function buildCategoryXml(category: string): string {
  return `  <question type="category">\n    <category>\n      <text>$course$/${escapeXml(category)}</text>\n    </category>\n  </question>`;
}

function buildAnswerXml(option: QuestionOption, fraction: number, explanation = ""): string {
  const feedback = explanation ? `\n    ${feedbackTag(explanation)}` : "";
  return `    <answer fraction="${fraction}" format="html">\n      ${textTag(option.text)}${feedback}\n    </answer>`;
}

function buildChoiceXml(question: NormalizedQuestion): string {
  const correctSet = new Set(question.correctAnswers.map((answer) => answer.toUpperCase()));
  const correctCount = Math.max(correctSet.size, 1);
  const correctFraction = question.type === "multi" ? 100 / correctCount : 100;

  const answers = question.options
    .map((option) => {
      const isCorrect = correctSet.has(option.key);
      return buildAnswerXml(option, isCorrect ? correctFraction : 0, isCorrect ? question.explanation : "");
    })
    .join("\n\n");

  return `  <question type="multichoice">\n${commonQuestionHeader(question)}\n    <single>${question.type === "single" ? "true" : "false"}</single>\n    <shuffleanswers>true</shuffleanswers>\n    <answernumbering>ABCD</answernumbering>\n${answers}\n  </question>`;
}

function buildTrueFalseXml(question: NormalizedQuestion): string {
  const isTrue = (question.correctAnswers[0] || "").toUpperCase() === "TRUE";
  return `  <question type="truefalse">\n${commonQuestionHeader(question)}\n    <answer fraction="${isTrue ? 100 : 0}" format="moodle_auto_format">\n      <text>true</text>\n      ${feedbackTag(isTrue ? question.explanation || "Đúng." : "")}\n    </answer>\n    <answer fraction="${isTrue ? 0 : 100}" format="moodle_auto_format">\n      <text>false</text>\n      ${feedbackTag(!isTrue ? question.explanation || "Đúng." : "")}\n    </answer>\n  </question>`;
}

function buildShortAnswerXml(question: NormalizedQuestion): string {
  const answers = question.correctAnswers
    .map(
      (answer) => `    <answer fraction="100" format="moodle_auto_format">\n      <text>${escapeXml(answer)}</text>\n      ${feedbackTag(question.explanation)}\n    </answer>`
    )
    .join("\n\n");

  return `  <question type="shortanswer">\n${commonQuestionHeader(question)}\n    <usecase>0</usecase>\n${answers}\n  </question>`;
}

function buildNumericalXml(question: NormalizedQuestion): string {
  const answer = question.correctAnswers[0] || "";
  return `  <question type="numerical">\n${commonQuestionHeader(question)}\n    <answer fraction="100" format="moodle_auto_format">\n      <text>${escapeXml(answer)}</text>\n      ${feedbackTag(question.explanation)}\n      <tolerance>${question.tolerance}</tolerance>\n    </answer>\n  </question>`;
}

function buildMatchingXml(question: NormalizedQuestion): string {
  const pairs = question.matchingPairs
    .map(
      (pair) => `    <subquestion format="html">\n      ${textTag(pair.left)}\n      <answer>\n        ${textTag(pair.right)}\n      </answer>\n    </subquestion>`
    )
    .join("\n\n");

  return `  <question type="matching">\n${commonQuestionHeader(question)}\n    <shuffleanswers>true</shuffleanswers>\n${pairs}\n  </question>`;
}


function buildDragDropTextXml(question: NormalizedQuestion): string {
  const dragBoxes = question.dragDropTextItems
    .map((item) => {
      const infinite = item.unlimited ? "\n      <infinite/>" : "";
      return `    <dragbox>\n      ${textTag(item.text)}\n      <group>${item.group}</group>${infinite}\n    </dragbox>`;
    })
    .join("\n\n");

  return `  <question type="ddwtos">\n${commonQuestionHeader(question)}\n    <shuffleanswers>1</shuffleanswers>\n    <correctfeedback format="html">\n      ${textTag("Đúng.")}\n    </correctfeedback>\n    <partiallycorrectfeedback format="html">\n      ${textTag("Đúng một phần.")}\n    </partiallycorrectfeedback>\n    <incorrectfeedback format="html">\n      ${textTag("Chưa đúng.")}\n    </incorrectfeedback>\n    <shownumcorrect/>\n${dragBoxes}\n  </question>`;
}

function buildSelectMissingWordsXml(question: NormalizedQuestion): string {
  const selectOptions = question.dragDropTextItems
    .map(
      (item) => `    <selectoption>\n      ${textTag(item.text)}\n      <group>${item.group}</group>\n    </selectoption>`
    )
    .join("\n\n");

  return `  <question type="gapselect">\n${commonQuestionHeader(question)}\n    <shuffleanswers>1</shuffleanswers>\n    <correctfeedback format="html">\n      ${textTag("Đúng.")}\n    </correctfeedback>\n    <partiallycorrectfeedback format="html">\n      ${textTag("Đúng một phần.")}\n    </partiallycorrectfeedback>\n    <incorrectfeedback format="html">\n      ${textTag("Chưa đúng.")}\n    </incorrectfeedback>\n    <shownumcorrect/>\n${selectOptions}\n  </question>`;
}

function buildEssayXml(question: NormalizedQuestion): string {
  return `  <question type="essay">\n${commonQuestionHeader(question)}\n    <responseformat>editor</responseformat>\n    <responserequired>1</responserequired>\n    <responsefieldlines>15</responsefieldlines>\n    <attachments>0</attachments>\n    <attachmentsrequired>0</attachmentsrequired>\n    <graderinfo format="html">\n      ${textTag(question.explanation)}\n    </graderinfo>\n    <answer fraction="0" format="html">\n      <text></text>\n    </answer>\n  </question>`;
}

function buildDescriptionXml(question: NormalizedQuestion): string {
  return `  <question type="description">\n${commonQuestionHeader({ ...question, grade: 0 })}\n  </question>`;
}

function buildClozeXml(question: NormalizedQuestion): string {
  return `  <question type="cloze">\n${commonQuestionHeader(question)}\n  </question>`;
}

function buildQuestionXml(question: NormalizedQuestion): string {
  switch (question.type) {
    case "single":
    case "multi":
      return buildChoiceXml(question);
    case "truefalse":
      return buildTrueFalseXml(question);
    case "shortanswer":
      return buildShortAnswerXml(question);
    case "numerical":
      return buildNumericalXml(question);
    case "matching":
      return buildMatchingXml(question);
    case "dragdrop_text":
      return buildDragDropTextXml(question);
    case "select_missing_words":
      return buildSelectMissingWordsXml(question);
    case "essay":
      return buildEssayXml(question);
    case "description":
      return buildDescriptionXml(question);
    case "cloze":
      return buildClozeXml(question);
    default:
      return buildDescriptionXml(question);
  }
}

export function generateMoodleXml(questions: NormalizedQuestion[]): string {
  const xmlParts: string[] = ['<?xml version="1.0" encoding="UTF-8"?>', "<quiz>"];
  const categories = new Set<string>();

  questions.forEach((question) => {
    if (!categories.has(question.category)) {
      categories.add(question.category);
      xmlParts.push(buildCategoryXml(question.category));
    }
    xmlParts.push(buildQuestionXml(question));
  });

  xmlParts.push("</quiz>");
  return xmlParts.join("\n\n");
}

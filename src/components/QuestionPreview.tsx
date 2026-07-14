import { useEffect, useRef } from "react";
import type { NormalizedQuestion } from "../types/moodle";

interface QuestionPreviewProps {
  questions: NormalizedQuestion[];
}

interface MathJaxApi {
  tex?: Record<string, unknown>;
  options?: Record<string, unknown>;
  startup?: {
    typeset?: boolean;
    [key: string]: unknown;
  };
  typesetPromise?: (elements?: HTMLElement[]) => Promise<void>;
}

declare global {
  interface Window {
    MathJax?: MathJaxApi;
  }
}

const MATHJAX_SCRIPT_ID = "mathjax-tex-preview-loader";
const TYPES_WITHOUT_ANSWER_LINE: NormalizedQuestion["type"][] = [
  "single",
  "multi",
  "matching",
  "dragdrop_text",
  "select_missing_words",
  "essay",
  "description",
  "cloze",
];

let mathJaxLoadPromise: Promise<void> | null = null;

function loadMathJax(): Promise<void> {
  if (window.MathJax?.typesetPromise) return Promise.resolve();
  if (mathJaxLoadPromise) return mathJaxLoadPromise;

  window.MathJax = {
    ...window.MathJax,
    tex: {
      ...window.MathJax?.tex,
      inlineMath: [
        ["$", "$"],
        ["\\(", "\\)"],
      ],
      displayMath: [
        ["$$", "$$"],
        ["\\[", "\\]"],
      ],
      processEscapes: true,
    },
    options: {
      ...window.MathJax?.options,
      skipHtmlTags: ["script", "noscript", "style", "textarea", "pre", "code"],
    },
    startup: {
      ...window.MathJax?.startup,
      typeset: false,
    },
  };

  mathJaxLoadPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(MATHJAX_SCRIPT_ID) as HTMLScriptElement | null;

    if (existingScript?.dataset.loaded === "true") {
      resolve();
      return;
    }

    const script = existingScript ?? document.createElement("script");
    script.id = MATHJAX_SCRIPT_ID;
    script.async = true;
    script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";

    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true }
    );
    script.addEventListener(
      "error",
      () => {
        mathJaxLoadPromise = null;
        reject(new Error("Cannot load MathJax."));
      },
      { once: true }
    );

    if (!existingScript) document.head.appendChild(script);
  });

  return mathJaxLoadPromise;
}

function renderMeta(question: NormalizedQuestion) {
  return `${question.sourceSheet} · dòng ${question.sourceRow} · ${question.category}`;
}

function RichTextPreview({ text }: { text: string }) {
  return <span className="rich-text-preview">{text}</span>;
}

export function QuestionPreview({ questions }: QuestionPreviewProps) {
  const previewRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const container = previewRef.current;
    if (!container) return;

    let cancelled = false;

    loadMathJax()
      .then(() => {
        if (cancelled) return undefined;
        return window.MathJax?.typesetPromise?.([container]);
      })
      .catch((error: Error) => {
        console.warn("Không tải được MathJax cho preview LaTeX.", error);
      });

    return () => {
      cancelled = true;
    };
  }, [questions]);

  if (!questions.length) return null;

  return (
    <section className="card" ref={previewRef}>
      <div className="section-label">Bước 3</div>
      <h2>Preview câu hỏi</h2>
      <p className="muted">Đang đọc được <strong>{questions.length}</strong> câu hỏi/khối nội dung.</p>

      <div className="preview-list">
        {questions.slice(0, 30).map((question, index) => (
          <article key={`${question.sourceSheet}-${question.questionId}-${index}`} className="question-card">
            <div className="question-header">
              <span className="type-badge">{question.type}</span>
              <strong>{question.questionName || question.questionId}</strong>
            </div>
            <small>{renderMeta(question)}</small>
            <div className="question-text rich-text-preview">{question.questionText}</div>

            {(question.type === "single" || question.type === "multi") && (
              <ul className="option-list">
                {question.options.map((option) => (
                  <li key={option.key} className={question.correctAnswers.includes(option.key) ? "correct" : ""}>
                    <strong>{option.key}.</strong> <RichTextPreview text={option.text} />
                  </li>
                ))}
              </ul>
            )}

            {question.type === "matching" && (
              <ul className="option-list">
                {question.matchingPairs.map((pair, pairIndex) => (
                  <li key={`${pair.left}-${pairIndex}`}>
                    <strong><RichTextPreview text={pair.left} /></strong> → <RichTextPreview text={pair.right} />
                  </li>
                ))}
              </ul>
            )}

            {(question.type === "dragdrop_text" || question.type === "select_missing_words") && (
              <ul className="option-list">
                {question.dragDropTextItems.map((item) => (
                  <li key={`${item.no}-${item.rowNumber}`}>
                    <strong>[[{item.no}]]</strong> <RichTextPreview text={item.text} />
                    <span className="muted">
                      {" "}· group {item.group}
                      {question.type === "dragdrop_text" && item.unlimited ? " · dùng lại nhiều lần" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {!TYPES_WITHOUT_ANSWER_LINE.includes(question.type) && (
              <p className="answer-line">Đáp án: <strong><RichTextPreview text={question.correctAnswers.join("; ")} /></strong></p>
            )}
          </article>
        ))}
      </div>

      {questions.length > 30 && <p className="muted">Chỉ hiển thị 30 mục đầu để preview. Khi export vẫn xuất đầy đủ.</p>}
    </section>
  );
}

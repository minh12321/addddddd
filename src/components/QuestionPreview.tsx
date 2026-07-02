import type { NormalizedQuestion } from "../types/moodle";

interface QuestionPreviewProps {
  questions: NormalizedQuestion[];
}

function renderMeta(question: NormalizedQuestion) {
  return `${question.sourceSheet} · dòng ${question.sourceRow} · ${question.category}`;
}

export function QuestionPreview({ questions }: QuestionPreviewProps) {
  if (!questions.length) return null;

  return (
    <section className="card">
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
            <p className="question-text">{question.questionText}</p>

            {(question.type === "single" || question.type === "multi") && (
              <ul className="option-list">
                {question.options.map((option) => (
                  <li key={option.key} className={question.correctAnswers.includes(option.key) ? "correct" : ""}>
                    <strong>{option.key}.</strong> {option.text}
                  </li>
                ))}
              </ul>
            )}

            {question.type === "matching" && (
              <ul className="option-list">
                {question.matchingPairs.map((pair, pairIndex) => (
                  <li key={`${pair.left}-${pairIndex}`}><strong>{pair.left}</strong> → {pair.right}</li>
                ))}
              </ul>
            )}

            {question.type === "dragdrop_text" && (
              <ul className="option-list">
                {question.dragDropTextItems.map((item) => (
                  <li key={`${item.no}-${item.rowNumber}`}>
                    <strong>[[{item.no}]]</strong> {item.text}
                    <span className="muted"> · group {item.group}{item.unlimited ? " · dùng lại nhiều lần" : ""}</span>
                  </li>
                ))}
              </ul>
            )}

            {!["single", "multi", "matching", "dragdrop_text", "essay", "description", "cloze"].includes(question.type) && (
              <p className="answer-line">Đáp án: <strong>{question.correctAnswers.join("; ")}</strong></p>
            )}
          </article>
        ))}
      </div>

      {questions.length > 30 && <p className="muted">Chỉ hiển thị 30 mục đầu để preview. Khi export vẫn xuất đầy đủ.</p>}
    </section>
  );
}

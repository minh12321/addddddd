import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { ValidationIssue } from "../types/moodle";

interface ValidationPanelProps {
  issues: ValidationIssue[];
}

export function ValidationPanel({ issues }: ValidationPanelProps) {
  const errors = issues.filter((issue) => issue.level === "error");
  const warnings = issues.filter((issue) => issue.level === "warning");

  return (
    <section className="card">
      <div className="section-label">Bước 2</div>
      <h2>Kiểm tra dữ liệu</h2>

      {issues.length === 0 ? (
        <div className="success-box">
          <CheckCircle2 size={20} />
          Dữ liệu hợp lệ, có thể xuất Moodle XML.
        </div>
      ) : (
        <>
          <div className="issue-summary">
            <span className="issue-count error"><AlertTriangle size={16} /> {errors.length} lỗi</span>
            <span className="issue-count warning"><Info size={16} /> {warnings.length} cảnh báo</span>
          </div>

          <div className="issue-list">
            {issues.map((issue, index) => (
              <div key={`${issue.sheetName}-${issue.rowNumber}-${index}`} className={`issue-item ${issue.level}`}>
                <strong>{issue.level === "error" ? "Lỗi" : "Cảnh báo"}</strong>
                <span>{issue.sheetName} / dòng {issue.rowNumber}{issue.questionId ? ` / ${issue.questionId}` : ""}</span>
                <p>{issue.message}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

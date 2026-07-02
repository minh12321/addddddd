import { useMemo, useState } from "react";
import { Download, FileCode2, RefreshCw } from "lucide-react";
import { UploadBox } from "./components/UploadBox";
import { ValidationPanel } from "./components/ValidationPanel";
import { QuestionPreview } from "./components/QuestionPreview";
import { parseWorkbookFile } from "./utils/sheetParser";
import { buildParseResult } from "./utils/buildParseResult";
import { generateMoodleXml } from "./utils/moodleXml";
import { buildXmlFileName, downloadTextFile } from "./utils/download";
import type { ParseResult } from "./types/moodle";
import "./styles.css";

export default function App() {
  const [fileName, setFileName] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [xmlPreview, setXmlPreview] = useState("");

  const errorCount = useMemo(() => parseResult?.issues.filter((issue) => issue.level === "error").length ?? 0, [parseResult]);
  const canExport = Boolean(parseResult?.questions.length) && errorCount === 0;

  async function handleFileChange(file: File) {
    setIsParsing(true);
    setFileName(file.name);
    setXmlPreview("");

    try {
      const rawRows = await parseWorkbookFile(file);
      const result = buildParseResult(rawRows);
      setParseResult(result);

      if (result.questions.length && result.issues.filter((issue) => issue.level === "error").length === 0) {
        setXmlPreview(generateMoodleXml(result.questions));
      }
    } catch (error) {
      console.error(error);
      setParseResult({
        rawRows: [],
        questions: [],
        issues: [
          {
            level: "error",
            sheetName: file.name,
            rowNumber: 0,
            message: "Không đọc được file. Kiểm tra lại định dạng .xlsx/.xls/.csv.",
          },
        ],
      });
    } finally {
      setIsParsing(false);
    }
  }

  function handleExportXml() {
    if (!parseResult || !canExport) return;
    const xml = generateMoodleXml(parseResult.questions);
    downloadTextFile(xml, buildXmlFileName(fileName));
    setXmlPreview(xml);
  }

  function handleReset() {
    setFileName("");
    setParseResult(null);
    setXmlPreview("");
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <div className="eyebrow">FE-only tool</div>
          <h1>Chuyển Sheet sang Moodle XML</h1>
          <p>
            Upload file Excel/CSV theo template, app sẽ đọc câu hỏi, validate dữ liệu và xuất file XML để import vào Moodle Question bank.
          </p>
        </div>
        <div className="hero-card">
          <FileCode2 size={34} />
          <strong>Không cần backend</strong>
          <span>Xử lý trực tiếp trên trình duyệt, dữ liệu không upload lên server.</span>
        </div>
      </header>

      <UploadBox onFileChange={handleFileChange} isParsing={isParsing} />

      {fileName && (
        <section className="toolbar card compact-card">
          <div>
            <div className="section-label">File hiện tại</div>
            <h3>{fileName}</h3>
            <p>{parseResult?.rawRows.length ?? 0} dòng dữ liệu · {parseResult?.questions.length ?? 0} câu hỏi/khối nội dung</p>
          </div>
          <div className="toolbar-actions">
            <button type="button" className="secondary-button" onClick={handleReset}>
              <RefreshCw size={16} />
              Làm lại
            </button>
            <button type="button" className="primary-button" disabled={!canExport} onClick={handleExportXml}>
              <Download size={16} />
              Xuất Moodle XML
            </button>
          </div>
        </section>
      )}

      {parseResult && <ValidationPanel issues={parseResult.issues} />}
      {parseResult && <QuestionPreview questions={parseResult.questions} />}

      {xmlPreview && (
        <section className="card">
          <div className="section-label">XML Preview</div>
          <h2>Nội dung XML đầu ra</h2>
          <pre className="xml-preview">{xmlPreview.slice(0, 8000)}{xmlPreview.length > 8000 ? "\n..." : ""}</pre>
        </section>
      )}
    </main>
  );
}

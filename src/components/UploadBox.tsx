import { FileSpreadsheet, Upload } from "lucide-react";

interface UploadBoxProps {
  onFileChange: (file: File) => void;
  isParsing: boolean;
}

export function UploadBox({ onFileChange, isParsing }: UploadBoxProps) {
  return (
    <section className="card upload-card">
      <div>
        <div className="section-label">Bước 1</div>
        <h2>Upload file Sheet</h2>
        <p>Hỗ trợ file <strong>.xlsx</strong>, <strong>.xls</strong>, <strong>.csv</strong> theo template Moodle XML.</p>
      </div>

      <label className="upload-zone">
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          disabled={isParsing}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFileChange(file);
            event.currentTarget.value = "";
          }}
        />
        <FileSpreadsheet size={44} />
        <span>{isParsing ? "Đang đọc file..." : "Chọn file Excel/CSV"}</span>
        <small>Kéo thả file vào trình duyệt hoặc bấm để chọn file.</small>
      </label>

      <a className="secondary-button" href="/templates/moodle_xml_sheet_templates.xlsx" download>
        <Upload size={16} />
        Tải file mẫu XLSX
      </a>
    </section>
  );
}

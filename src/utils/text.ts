export function cleanText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\r\n/g, "\n").trim();
}

export function normalizeHeader(value: string): string {
  return cleanText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function escapeXml(value: string): string {
  return cleanText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function cdata(value: string): string {
  const safeValue = cleanText(value).replace(/\]\]>/g, "]]]]><![CDATA[>");
  return `<![CDATA[${safeValue}]]>`;
}

export function slugify(value: string): string {
  return cleanText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "moodle-questions";
}

export function splitAnswers(value: string): string[] {
  return cleanText(value)
    .split(/[;,|]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeTrueFalse(value: string): "TRUE" | "FALSE" | "" {
  const normalized = cleanText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
  if (["true", "t", "1", "yes", "y", "dung", "correct"].includes(normalized)) return "TRUE";
  if (["false", "f", "0", "no", "n", "sai", "incorrect"].includes(normalized)) return "FALSE";
  return "";
}

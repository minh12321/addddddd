import { slugify } from "./text";

export function downloadTextFile(content: string, fileName: string, mimeType = "application/xml;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function buildXmlFileName(sourceFileName?: string) {
  if (!sourceFileName) return "moodle-questions.xml";
  return `${slugify(sourceFileName.replace(/\.[^.]+$/, ""))}.xml`;
}

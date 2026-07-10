import { PDFParse } from "pdf-parse";
import ExcelJS from "exceljs";

export type UploadFileType = "pdf" | "xlsx" | "csv";

export function detectFileType(filename: string, mimeType: string): UploadFileType | null {
  const lower = filename.toLowerCase();
  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".xlsx") || mimeType.includes("spreadsheetml")) return "xlsx";
  if (lower.endsWith(".csv") || mimeType === "text/csv") return "csv";
  return null;
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result.text;
}

async function extractXlsxText(buffer: Buffer): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

  const lines: string[] = [];
  workbook.eachSheet((sheet) => {
    lines.push(`--- Sheet: ${sheet.name} ---`);
    sheet.eachRow((row) => {
      const cells = (row.values as unknown[])
        .slice(1)
        .map((v) => (v === null || v === undefined ? "" : String(v)));
      if (cells.some((c) => c.trim() !== "")) {
        lines.push(cells.join(" | "));
      }
    });
  });
  return lines.join("\n");
}

/** Extracts plain text from an uploaded document so it can be handed to the LLM for field extraction. */
export async function extractTextFromFile(
  buffer: Buffer,
  fileType: UploadFileType,
): Promise<string> {
  if (fileType === "pdf") return extractPdfText(buffer);
  if (fileType === "xlsx") return extractXlsxText(buffer);
  return buffer.toString("utf-8");
}

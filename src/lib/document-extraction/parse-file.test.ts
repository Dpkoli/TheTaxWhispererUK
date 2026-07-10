import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { detectFileType, extractTextFromFile } from "./parse-file";

describe("detectFileType", () => {
  it("detects pdf by extension and mime type", () => {
    expect(detectFileType("p60.pdf", "application/pdf")).toBe("pdf");
    expect(detectFileType("p60.PDF", "")).toBe("pdf");
  });

  it("detects xlsx by extension and mime type", () => {
    expect(detectFileType("payslip.xlsx", "")).toBe("xlsx");
    expect(
      detectFileType(
        "payslip",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ),
    ).toBe("xlsx");
  });

  it("returns null for unsupported types", () => {
    expect(detectFileType("photo.png", "image/png")).toBeNull();
  });
});

describe("extractTextFromFile — xlsx round trip", () => {
  it("extracts real cell text from a workbook built in-memory", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("P60");
    sheet.addRow(["Field", "Amount"]);
    sheet.addRow(["Total pay for year", 110000]);
    sheet.addRow(["Total tax deducted", 33432]);

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const text = await extractTextFromFile(buffer, "xlsx");

    expect(text).toContain("Total pay for year");
    expect(text).toContain("110000");
    expect(text).toContain("Total tax deducted");
    expect(text).toContain("33432");
  });
});

"use server";

import { db } from "@/db";
import { documentExtractions } from "@/db/schema";
import { detectFileType, extractTextFromFile } from "@/lib/document-extraction/parse-file";
import { extractIncomeFieldsFromText } from "@/lib/document-extraction/extract-income-fields";

export type UploadResult = {
  extractionId: string;
  totalPayForYear: { value: number; confidence: string; sourceLocation: string } | null;
  totalTaxDeducted: { value: number; confidence: string; sourceLocation: string } | null;
  totalBenefitsInKind: { value: number; confidence: string; sourceLocation: string } | null;
};

export async function uploadIncomeTaxDocument(formData: FormData): Promise<UploadResult> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("No file provided");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("File is too large (max 8MB)");
  }

  const fileType = detectFileType(file.name, file.type);
  if (!fileType) {
    throw new Error("Unsupported file type — upload a PDF, XLSX, or CSV");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let extracted;
  try {
    const text = await extractTextFromFile(buffer, fileType);
    if (!text.trim()) {
      throw new Error("No extractable text found in this file");
    }
    extracted = await extractIncomeFieldsFromText(text);
  } catch (error) {
    console.error("Document extraction failed:", error);
    throw new Error("Couldn't read figures from that file — please try again or enter them manually.");
  }

  const [extraction] = await db
    .insert(documentExtractions)
    .values({
      fileType,
      originalFilename: file.name,
      extractedFields: extracted,
      confirmationStatus: "pending",
    })
    .returning();

  return {
    extractionId: extraction.id,
    totalPayForYear: extracted.totalPayForYear,
    totalTaxDeducted: extracted.totalTaxDeducted,
    totalBenefitsInKind: extracted.totalBenefitsInKind,
  };
}

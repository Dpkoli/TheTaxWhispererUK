import { z } from "zod";
import { CHAT_MODEL, getGroqClient } from "@/lib/groq";

const extractedFieldSchema = z.object({
  value: z.number(),
  confidence: z.enum(["high", "medium", "low"]),
  sourceLocation: z.string(),
});

const extractionOutputSchema = z.object({
  totalPayForYear: extractedFieldSchema.nullable(),
  totalTaxDeducted: extractedFieldSchema.nullable(),
  totalBenefitsInKind: extractedFieldSchema.nullable(),
});

export type ExtractedIncomeFields = z.infer<typeof extractionOutputSchema>;

const SYSTEM_PROMPT = `You extract figures from UK payroll and benefits documents (P60s, payslips, P45s, P11Ds) for a tax computation tool: the total pay for the year, the total tax already deducted, and the total taxable value of benefits in kind (from a P11D — e.g. company car, private medical insurance, other benefits).

Rules:
- Only extract a figure if it is actually present in the document text. If you cannot find a field with reasonable confidence, set it to null — do not guess or estimate.
- "totalBenefitsInKind" is specific to P11D-style documents reporting benefits in kind — most payslips/P60s won't have this, so null is the normal result for those.
- If a P11D lists multiple benefits, sum their cash equivalent values into a single "totalBenefitsInKind" figure and note that in "sourceLocation".
- "value" must be a plain number (no currency symbol, no commas).
- "sourceLocation" should be a short quote or description of where in the text you found it (e.g. "line: 'Total pay for year 45,000.00'").
- "confidence": "high" if the label is explicit and unambiguous, "medium" if you inferred it from context, "low" if you're guessing.

Respond with ONLY a JSON object of this exact shape, no markdown, no commentary:
{
  "totalPayForYear": { "value": number, "confidence": "high"|"medium"|"low", "sourceLocation": string } | null,
  "totalTaxDeducted": { "value": number, "confidence": "high"|"medium"|"low", "sourceLocation": string } | null,
  "totalBenefitsInKind": { "value": number, "confidence": "high"|"medium"|"low", "sourceLocation": string } | null
}`;

export async function extractIncomeFieldsFromText(
  documentText: string,
): Promise<ExtractedIncomeFields> {
  const groq = getGroqClient();

  const truncated = documentText.slice(0, 8000);

  const completion = await groq.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `DOCUMENT TEXT:\n${truncated}` },
    ],
    temperature: 0,
    max_tokens: 500,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("Groq returned an empty response");
  }

  return extractionOutputSchema.parse(JSON.parse(raw));
}

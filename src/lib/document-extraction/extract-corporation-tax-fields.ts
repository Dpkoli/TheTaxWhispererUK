import { z } from "zod";
import { CHAT_MODEL, getGroqClient } from "@/lib/groq";

const extractedFieldSchema = z.object({
  value: z.number(),
  confidence: z.enum(["high", "medium", "low"]),
  sourceLocation: z.string(),
});

const extractionOutputSchema = z.object({
  taxableProfit: extractedFieldSchema.nullable(),
});

export type ExtractedCorporationTaxFields = z.infer<typeof extractionOutputSchema>;

const SYSTEM_PROMPT = `You extract one figure from UK company accounts exports (trial balance exports, profit & loss statements) for a tax computation tool: the taxable profit for the accounting period (before Corporation Tax is applied).

Rules:
- Look for a "profit before tax", "net profit", or a trial balance's retained-earnings-movement figure that represents accounting profit for the period. Treat this as an approximation of taxable profit — the tool will make that explicit to the user, you just extract the accounting figure you find.
- Only extract a figure if it is actually present in the document text. If you cannot find one with reasonable confidence, set it to null — do not guess or estimate.
- "value" must be a plain number (no currency symbol, no commas). Losses should be negative.
- "sourceLocation" should be a short quote or description of where in the text you found it (e.g. "line: 'Profit before taxation 125,430'").
- "confidence": "high" if the label is explicit and unambiguous (e.g. "Profit before tax"), "medium" if you inferred it from context (e.g. summing trial balance income/expense lines), "low" if you're guessing.

Respond with ONLY a JSON object of this exact shape, no markdown, no commentary:
{
  "taxableProfit": { "value": number, "confidence": "high"|"medium"|"low", "sourceLocation": string } | null
}`;

export async function extractCorporationTaxFieldsFromText(
  documentText: string,
): Promise<ExtractedCorporationTaxFields> {
  const groq = getGroqClient();

  const truncated = documentText.slice(0, 8000);

  const completion = await groq.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `DOCUMENT TEXT:\n${truncated}` },
    ],
    temperature: 0,
    max_tokens: 300,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("Groq returned an empty response");
  }

  return extractionOutputSchema.parse(JSON.parse(raw));
}

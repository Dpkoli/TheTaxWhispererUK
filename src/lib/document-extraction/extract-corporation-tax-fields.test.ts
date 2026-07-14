import { describe, expect, it, vi, beforeEach } from "vitest";

const mockCreate = vi.fn();

vi.mock("@/lib/groq", () => ({
  getGroqClient: () => ({
    chat: { completions: { create: mockCreate } },
  }),
  CHAT_MODEL: "test-model",
}));

import { extractCorporationTaxFieldsFromText } from "./extract-corporation-tax-fields";

function mockCompletion(json: object) {
  mockCreate.mockResolvedValueOnce({
    choices: [{ message: { content: JSON.stringify(json) } }],
  });
}

beforeEach(() => {
  mockCreate.mockReset();
});

describe("extractCorporationTaxFieldsFromText", () => {
  it("parses a well-formed extraction response", async () => {
    mockCompletion({
      taxableProfit: { value: 125430, confidence: "high", sourceLocation: "line: 'Profit before taxation 125,430'" },
    });

    const result = await extractCorporationTaxFieldsFromText("Profit before taxation: 125,430.00");
    expect(result.taxableProfit?.value).toBe(125430);
  });

  it("accepts null when nothing was found, rather than a fabricated guess", async () => {
    mockCompletion({ taxableProfit: null });

    const result = await extractCorporationTaxFieldsFromText("This document has no relevant figures.");
    expect(result.taxableProfit).toBeNull();
  });

  it("accepts a negative value for a loss-making period", async () => {
    mockCompletion({
      taxableProfit: { value: -15000, confidence: "high", sourceLocation: "line: 'Loss before taxation (15,000)'" },
    });

    const result = await extractCorporationTaxFieldsFromText("Loss before taxation: (15,000.00)");
    expect(result.taxableProfit?.value).toBe(-15000);
  });

  it("throws on malformed JSON from the model", async () => {
    mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: "nonsense" } }] });
    await expect(extractCorporationTaxFieldsFromText("text")).rejects.toThrow();
  });
});

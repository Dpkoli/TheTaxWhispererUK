import { describe, expect, it, vi, beforeEach } from "vitest";

const mockCreate = vi.fn();

vi.mock("@/lib/groq", () => ({
  getGroqClient: () => ({
    chat: { completions: { create: mockCreate } },
  }),
  CHAT_MODEL: "test-model",
}));

import { extractIncomeFieldsFromText } from "./extract-income-fields";

function mockCompletion(json: object) {
  mockCreate.mockResolvedValueOnce({
    choices: [{ message: { content: JSON.stringify(json) } }],
  });
}

beforeEach(() => {
  mockCreate.mockReset();
});

describe("extractIncomeFieldsFromText", () => {
  it("parses a well-formed extraction response", async () => {
    mockCompletion({
      totalPayForYear: { value: 110000, confidence: "high", sourceLocation: "line 4" },
      totalTaxDeducted: { value: 33432, confidence: "high", sourceLocation: "line 5" },
    });

    const result = await extractIncomeFieldsFromText("Total pay for year: 110000.00");
    expect(result.totalPayForYear?.value).toBe(110000);
    expect(result.totalTaxDeducted?.value).toBe(33432);
  });

  it("accepts null fields when nothing was found, rather than a fabricated guess", async () => {
    mockCompletion({ totalPayForYear: null, totalTaxDeducted: null });

    const result = await extractIncomeFieldsFromText("This document has no relevant figures.");
    expect(result.totalPayForYear).toBeNull();
    expect(result.totalTaxDeducted).toBeNull();
  });

  it("throws (rather than silently accepting) a response missing required shape", async () => {
    mockCompletion({ totalPayForYear: { value: "not-a-number" } });

    await expect(extractIncomeFieldsFromText("text")).rejects.toThrow();
  });

  it("throws on malformed JSON from the model", async () => {
    mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: "nonsense" } }] });
    await expect(extractIncomeFieldsFromText("text")).rejects.toThrow();
  });
});

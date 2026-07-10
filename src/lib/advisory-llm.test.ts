import { describe, expect, it, vi, beforeEach } from "vitest";

const mockCreate = vi.fn();

vi.mock("@/lib/groq", () => ({
  getGroqClient: () => ({
    chat: { completions: { create: mockCreate } },
  }),
  CHAT_MODEL: "test-model",
}));

import { generateAdvisoryAnswer, type SourceContext, type TopicContext } from "./advisory-llm";

const SOURCES: SourceContext[] = [
  {
    slug: "ita-2007-s35",
    sourceType: "act",
    title: "Income Tax Act 2007, s.35 — Personal allowance",
    citationCode: "ITA 2007, s.35",
    summaryPlainEnglish: "Personal allowance and its taper.",
    fullTextExtract: "An individual is entitled to a personal allowance...",
    status: "amended",
  },
];

const TOPICS: TopicContext[] = [
  { slug: "income-tax-personal-allowance", name: "Income Tax: Personal Allowance" },
];

function mockCompletion(json: object) {
  mockCreate.mockResolvedValueOnce({
    choices: [{ message: { content: JSON.stringify(json) } }],
  });
}

beforeEach(() => {
  mockCreate.mockReset();
});

describe("generateAdvisoryAnswer — defense in depth against invented citations", () => {
  it("strips a citation referencing a source slug that was never in the retrieved set", async () => {
    mockCompletion({
      hasCoverage: true,
      topicSlug: "income-tax-personal-allowance",
      plainSummary: "Summary.",
      technicalAnalysis: "Analysis.",
      workedExample: null,
      complianceNotes: null,
      deadlines: null,
      confidenceFlag: "settled_law",
      citations: [
        { sourceSlug: "ita-2007-s35", claimText: "real citation", confidence: "settled_law" },
        {
          sourceSlug: "ita-2007-s999-invented",
          claimText: "hallucinated section that was never in context",
          confidence: "settled_law",
        },
      ],
    });

    const result = await generateAdvisoryAnswer("test question", SOURCES, TOPICS);

    expect(result.citations).toHaveLength(1);
    expect(result.citations[0].sourceSlug).toBe("ita-2007-s35");
  });

  it("nulls out a topicSlug that isn't in the known topic list", async () => {
    mockCompletion({
      hasCoverage: true,
      topicSlug: "some-invented-topic",
      plainSummary: "Summary.",
      technicalAnalysis: "Analysis.",
      workedExample: null,
      complianceNotes: null,
      deadlines: null,
      confidenceFlag: "interpretation",
      citations: [],
    });

    const result = await generateAdvisoryAnswer("test question", SOURCES, TOPICS);
    expect(result.topicSlug).toBeNull();
  });

  it("passes through hasCoverage: false untouched", async () => {
    mockCompletion({
      hasCoverage: false,
      topicSlug: null,
      plainSummary: "No coverage.",
      technicalAnalysis: "No coverage.",
      workedExample: null,
      complianceNotes: null,
      deadlines: null,
      confidenceFlag: "unverified",
      citations: [],
    });

    const result = await generateAdvisoryAnswer("unrelated question", SOURCES, TOPICS);
    expect(result.hasCoverage).toBe(false);
    expect(result.citations).toHaveLength(0);
  });

  it("throws if the model returns malformed JSON", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: "not valid json" } }],
    });

    await expect(generateAdvisoryAnswer("q", SOURCES, TOPICS)).rejects.toThrow();
  });
});

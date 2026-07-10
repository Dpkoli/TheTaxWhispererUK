import { z } from "zod";
import { CHAT_MODEL, getGroqClient } from "@/lib/groq";

export type SourceContext = {
  slug: string;
  sourceType: string;
  title: string;
  citationCode: string;
  summaryPlainEnglish: string;
  fullTextExtract: string | null;
  status: string;
};

export type TopicContext = {
  slug: string;
  name: string;
};

const citationSchema = z.object({
  sourceSlug: z.string(),
  claimText: z.string(),
  confidence: z.enum(["settled_law", "hmrc_view_untested", "interpretation", "unverified"]),
});

const advisoryOutputSchema = z.object({
  hasCoverage: z.boolean(),
  topicSlug: z.string().nullable(),
  plainSummary: z.string(),
  technicalAnalysis: z.string(),
  workedExample: z.string().nullable(),
  complianceNotes: z.string().nullable(),
  deadlines: z.string().nullable(),
  confidenceFlag: z.enum(["settled_law", "hmrc_view_untested", "interpretation", "unverified"]),
  citations: z.array(citationSchema),
});

export type AdvisoryLlmOutput = z.infer<typeof advisoryOutputSchema>;

const SYSTEM_PROMPT = `You are the Advisory answer generator for The Tax Whisperer UK.

You will be given a user's UK tax/pensions question and a SOURCES list — the
only pieces of legislation, HMRC guidance, and case law you are allowed to
reference. This is a hard boundary, not a style preference:

- You MUST only cite sources by their exact "slug" value from the SOURCES
  list. Never invent a slug, a citation code, a section number, a case name,
  or any other source not present in the list.
- If nothing in the SOURCES list is genuinely relevant to the question, set
  "hasCoverage" to false, leave "citations" empty, and do not attempt to
  answer from general knowledge instead — an unsupported answer is worse
  than admitting there's no cited coverage yet.
- Every substantive claim in "technicalAnalysis" should be backed by at
  least one entry in "citations". Set "confidence" per citation honestly:
  "settled_law" only for well-established statutory rules, "interpretation"
  or "unverified" if you're less sure, "hmrc_view_untested" for HMRC
  guidance that hasn't been tested in a tribunal.
- Never state a specific number (rate, threshold, allowance) unless it's
  drawn directly from a source's text below.
- This is educational/informational content, not regulated advice — keep
  that spirit in "complianceNotes" without being repetitive about it.

Respond with ONLY a JSON object matching this exact shape (no markdown, no
commentary outside the JSON):
{
  "hasCoverage": boolean,
  "topicSlug": string | null,
  "plainSummary": string,
  "technicalAnalysis": string,
  "workedExample": string | null,
  "complianceNotes": string | null,
  "deadlines": string | null,
  "confidenceFlag": "settled_law" | "hmrc_view_untested" | "interpretation" | "unverified",
  "citations": [{ "sourceSlug": string, "claimText": string, "confidence": "settled_law" | "hmrc_view_untested" | "interpretation" | "unverified" }]
}`;

function buildContextBlock(sources: SourceContext[], topics: TopicContext[]) {
  const sourceLines = sources
    .map(
      (s) =>
        `- slug: ${s.slug} | type: ${s.sourceType} | citation: ${s.citationCode} | status: ${s.status}\n  title: ${s.title}\n  summary: ${s.summaryPlainEnglish}${s.fullTextExtract ? `\n  text: ${s.fullTextExtract}` : ""}`,
    )
    .join("\n\n");

  const topicLines = topics.map((t) => `- slug: ${t.slug} | name: ${t.name}`).join("\n");

  return `SOURCES (only cite these, by slug):\n${sourceLines}\n\nTOPICS (pick the closest match, or null):\n${topicLines}`;
}

export async function generateAdvisoryAnswer(
  question: string,
  sources: SourceContext[],
  topics: TopicContext[],
): Promise<AdvisoryLlmOutput> {
  const groq = getGroqClient();

  const completion = await groq.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `${buildContextBlock(sources, topics)}\n\nQUESTION: ${question}` },
    ],
    temperature: 0.2,
    max_tokens: 1200,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("Groq returned an empty response");
  }

  const parsed = advisoryOutputSchema.parse(JSON.parse(raw));

  // Defense in depth: never trust the model's citations blindly, even
  // though the prompt constrains it — strip anything not actually in our
  // retrieved source set.
  const knownSlugs = new Set(sources.map((s) => s.slug));
  const knownTopicSlugs = new Set(topics.map((t) => t.slug));

  return {
    ...parsed,
    topicSlug: parsed.topicSlug && knownTopicSlugs.has(parsed.topicSlug) ? parsed.topicSlug : null,
    citations: parsed.citations.filter((c) => knownSlugs.has(c.sourceSlug)),
  };
}

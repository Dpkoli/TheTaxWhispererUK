const TOPIC_HINTS: Array<{ topicSlug: string; keywords: string[] }> = [
  {
    topicSlug: "income-tax-personal-allowance",
    keywords: ["personal allowance", "£100,000", "100,000", "adjusted net income"],
  },
  {
    topicSlug: "state-pension-entitlement",
    keywords: ["state pension", "qualifying year", "national insurance record"],
  },
  {
    topicSlug: "national-insurance-class-1",
    keywords: ["class 1", "national insurance", "primary threshold", "ni contribution"],
  },
  {
    topicSlug: "capital-gains-tax-individuals",
    keywords: ["capital gains", "cgt", "annual exempt amount", "chargeable gain"],
  },
];

/** The slug of the Topic this message touches a known, cited Advisory answer for, or null. */
export function matchesKnownAdvisoryTopic(userMessage: string): string | null {
  const lower = userMessage.toLowerCase();
  const match = TOPIC_HINTS.find((topic) => topic.keywords.some((k) => lower.includes(k)));
  return match?.topicSlug ?? null;
}

export const ESCALATION_MARKER = "Open in Advisory →";

/** Fallback text used only if the live LLM call fails or isn't configured. */
export function generateStubReply(userMessage: string) {
  const intro =
    "I couldn't reach the live assistant just now, so here's a placeholder instead of a guess.";
  const hint = matchesKnownAdvisoryTopic(userMessage)
    ? " Advisory has a fully cited breakdown that might cover this already."
    : " Advisory has cited, worked examples you can browse in the meantime.";
  return `${intro}${hint} Want the detailed breakdown with sources? ${ESCALATION_MARKER}`;
}

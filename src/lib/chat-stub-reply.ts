const TOPIC_HINTS: Array<{ keywords: string[] }> = [
  { keywords: ["personal allowance", "£100,000", "100,000", "adjusted net income"] },
  { keywords: ["state pension", "qualifying year", "national insurance record"] },
];

/** True if the message touches a topic we have a real, cited Advisory answer for. */
export function matchesKnownAdvisoryTopic(userMessage: string) {
  const lower = userMessage.toLowerCase();
  return TOPIC_HINTS.some((topic) => topic.keywords.some((k) => lower.includes(k)));
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

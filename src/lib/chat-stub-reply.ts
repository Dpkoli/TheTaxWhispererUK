const TOPIC_HINTS: Array<{ keywords: string[]; hint: string }> = [
  {
    keywords: ["personal allowance", "£100,000", "100,000", "adjusted net income"],
    hint: "This sounds like a Personal Allowance question — Advisory has a fully cited breakdown of how the £100,000 taper works.",
  },
  {
    keywords: ["state pension", "qualifying year", "national insurance record"],
    hint: "This sounds like a State Pension question — Advisory has a fully cited breakdown of qualifying years and how the rate is worked out.",
  },
];

export function generateStubReply(userMessage: string) {
  const lower = userMessage.toLowerCase();
  const matched = TOPIC_HINTS.find((topic) =>
    topic.keywords.some((keyword) => lower.includes(keyword)),
  );

  const intro =
    "Live, AI-generated replies aren't connected yet in this build — you're seeing a placeholder so the chat flow itself can be reviewed.";

  return matched
    ? `${intro} ${matched.hint} Want the detailed breakdown with sources? Open in Advisory →`
    : `${intro} Once it's connected, I'll talk this through with you in plain English. In the meantime, Advisory has cited, worked examples you can browse. Want the detailed breakdown with sources? Open in Advisory →`;
}

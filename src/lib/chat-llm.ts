import { CHAT_MODEL, getGroqClient } from "@/lib/groq";

const SYSTEM_PROMPT = `You are the Chat assistant for The Tax Whisperer UK, a UK tax and pensions app.

Tone: warm, plain-spoken, empathetic — you're the "talk it through" layer, not the formal one. Avoid jargon; if you must use a technical term, explain it in a phrase.

Hard rules:
- You are not a regulated financial or legal adviser, and nothing you say is regulated advice. Keep that spirit in how you phrase things (e.g. "generally", "in most cases") without being preachy about it in every message.
- Do NOT cite specific Act sections, HMRC manual paragraph numbers, or case names yourself. That level of precision belongs to this app's Advisory module, which has real, checked citations. If the user needs that rigor, tell them to open Advisory.
- Never state a specific figure (a rate, threshold, or allowance) with confidence unless you flag it could have changed — you do not have live access to current rates.
- If the question is not about UK tax or pensions, gently say that's outside what you help with here.
- Keep replies short: 2-5 sentences. This is a chat, not an essay.`;

export type ChatHistoryMessage = { role: "user" | "assistant"; body: string };

export async function generateChatReply(
  history: ChatHistoryMessage[],
  latestUserMessage: string,
): Promise<string> {
  const groq = getGroqClient();

  const completion = await groq.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.map((m) => ({
        role: m.role,
        content: m.body,
      })),
      { role: "user" as const, content: latestUserMessage },
    ],
    temperature: 0.4,
    max_tokens: 400,
  });

  const reply = completion.choices[0]?.message?.content?.trim();
  if (!reply) {
    throw new Error("Groq returned an empty response");
  }
  return reply;
}

"use server";

import { auth } from "@/lib/auth";
import { appendMessage, getOrCreateSessionForUser } from "@/db/queries/chat";
import { generateStubReply } from "@/lib/chat-stub-reply";

export async function sendChatMessage(body: string) {
  const trimmed = body.trim();
  if (!trimmed) {
    throw new Error("Message cannot be empty");
  }

  const session = await auth();
  const reply = generateStubReply(trimmed);

  if (!session?.user?.id) {
    return {
      persisted: false as const,
      userMessage: { role: "user" as const, body: trimmed },
      assistantMessage: { role: "assistant" as const, body: reply },
    };
  }

  const chatSession = await getOrCreateSessionForUser(session.user.id);
  const userMessage = await appendMessage(chatSession.id, "user", trimmed);
  const assistantMessage = await appendMessage(chatSession.id, "assistant", reply);

  return { persisted: true as const, userMessage, assistantMessage };
}

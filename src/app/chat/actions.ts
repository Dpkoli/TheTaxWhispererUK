"use server";

import { auth } from "@/lib/auth";
import { appendMessage, getOrCreateSessionForUser, listMessages } from "@/db/queries/chat";
import {
  ESCALATION_MARKER,
  generateStubReply,
  matchesKnownAdvisoryTopic,
} from "@/lib/chat-stub-reply";
import { generateChatReply, type ChatHistoryMessage } from "@/lib/chat-llm";

async function getReply(history: ChatHistoryMessage[], trimmed: string) {
  try {
    const reply = await generateChatReply(history, trimmed);
    const alreadyMentionsAdvisory = /advisory/i.test(reply);
    if (matchesKnownAdvisoryTopic(trimmed) && !alreadyMentionsAdvisory) {
      return `${reply} Want the detailed breakdown with sources? ${ESCALATION_MARKER}`;
    }
    return reply;
  } catch (error) {
    console.error("Groq chat completion failed, falling back to stub reply:", error);
    return generateStubReply(trimmed);
  }
}

export async function sendChatMessage(
  body: string,
  clientHistory: ChatHistoryMessage[] = [],
) {
  const trimmed = body.trim();
  if (!trimmed) {
    throw new Error("Message cannot be empty");
  }

  const session = await auth();

  if (!session?.user?.id) {
    const reply = await getReply(clientHistory, trimmed);
    return {
      persisted: false as const,
      userMessage: { role: "user" as const, body: trimmed },
      assistantMessage: { role: "assistant" as const, body: reply },
    };
  }

  const chatSession = await getOrCreateSessionForUser(session.user.id);
  const priorMessages = await listMessages(chatSession.id);
  const history: ChatHistoryMessage[] = priorMessages.map((m) => ({
    role: m.role,
    body: m.body,
  }));

  const reply = await getReply(history, trimmed);

  const userMessage = await appendMessage(chatSession.id, "user", trimmed);
  const assistantMessage = await appendMessage(chatSession.id, "assistant", reply);

  return { persisted: true as const, userMessage, assistantMessage };
}

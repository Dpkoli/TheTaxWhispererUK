import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages, chatSessions } from "@/db/schema";

export async function getOrCreateSessionForUser(userId: string) {
  const existing = await db.query.chatSessions.findFirst({
    where: eq(chatSessions.userId, userId),
    orderBy: [desc(chatSessions.startedAt)],
  });
  if (existing) return existing;

  const [created] = await db
    .insert(chatSessions)
    .values({ userId, isGuest: false })
    .returning();
  return created;
}

export async function listMessages(sessionId: string) {
  return db.query.chatMessages.findMany({
    where: eq(chatMessages.sessionId, sessionId),
    orderBy: [asc(chatMessages.createdAt)],
  });
}

export async function appendMessage(
  sessionId: string,
  role: "user" | "assistant",
  body: string,
) {
  const [message] = await db
    .insert(chatMessages)
    .values({ sessionId, role, body })
    .returning();
  return message;
}

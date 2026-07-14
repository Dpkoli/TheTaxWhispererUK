import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages, chatSessions, topics } from "@/db/schema";

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
  escalationSuggestedTopicSlug?: string | null,
) {
  const escalationSuggestedTopicId = escalationSuggestedTopicSlug
    ? (
        await db.query.topics.findFirst({
          where: eq(topics.slug, escalationSuggestedTopicSlug),
          columns: { id: true },
        })
      )?.id ?? null
    : null;

  const [message] = await db
    .insert(chatMessages)
    .values({ sessionId, role, body, escalationSuggestedTopicId })
    .returning();
  return message;
}

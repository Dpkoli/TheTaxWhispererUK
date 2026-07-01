import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { chatRoleEnum } from "./enums";
import { topics } from "./topic";
import { users } from "./user";

export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  isGuest: boolean("is_guest").notNull().default(true),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => chatSessions.id, { onDelete: "cascade" }),
  role: chatRoleEnum("role").notNull(),
  body: text("body").notNull(),
  escalationSuggestedTopicId: uuid("escalation_suggested_topic_id").references(
    () => topics.id,
    { onDelete: "set null" },
  ),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

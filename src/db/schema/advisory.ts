import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { confidenceEnum } from "./enums";
import { topics } from "./topic";
import { users } from "./user";

export const advisoryQuestions = pgTable("advisory_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  topicId: uuid("topic_id").references(() => topics.id, { onDelete: "set null" }),
  rawQuestion: text("raw_question").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const advisoryAnswers = pgTable("advisory_answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  questionId: uuid("question_id")
    .notNull()
    .references(() => advisoryQuestions.id, { onDelete: "cascade" }),
  plainSummary: text("plain_summary").notNull(),
  technicalAnalysis: text("technical_analysis").notNull(),
  workedExample: text("worked_example"),
  complianceNotes: text("compliance_notes"),
  deadlines: text("deadlines"),
  confidenceFlag: confidenceEnum("confidence_flag").notNull().default("interpretation"),
  answerVersion: integer("answer_version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

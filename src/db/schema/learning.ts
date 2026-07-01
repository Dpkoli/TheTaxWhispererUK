import { integer, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { learningSectionTypeEnum, questionFormatEnum } from "./enums";
import { topics } from "./topic";

export const learningChapters = pgTable("learning_chapters", {
  id: uuid("id").primaryKey().defaultRandom(),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  orderIndex: integer("order_index").notNull(),
  summary: text("summary").notNull(),
});

export const learningSections = pgTable("learning_sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  chapterId: uuid("chapter_id")
    .notNull()
    .references(() => learningChapters.id, { onDelete: "cascade" }),
  sectionType: learningSectionTypeEnum("section_type").notNull(),
  body: text("body").notNull(),
  orderIndex: integer("order_index").notNull(),
  version: integer("version").notNull().default(1),
});

export const practiceQuestions = pgTable("practice_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  learningSectionId: uuid("learning_section_id")
    .notNull()
    .references(() => learningSections.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  questionFormat: questionFormatEnum("question_format").notNull(),
  options: jsonb("options"),
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation").notNull(),
});

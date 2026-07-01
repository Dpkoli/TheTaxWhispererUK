import { boolean, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import { difficultyLevelEnum, relevanceEnum, taxAreaEnum } from "./enums";
import { sourceSections, sources } from "./source";

export const topics = pgTable("topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  parentTopicId: uuid("parent_topic_id"),
  taxArea: taxAreaEnum("tax_area").notNull(),
  devolvedVariance: boolean("devolved_variance").notNull().default(false),
  difficultyLevel: difficultyLevelEnum("difficulty_level")
    .notNull()
    .default("foundational"),
});

export const topicSources = pgTable(
  "topic_sources",
  {
    topicId: uuid("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    sourceSectionId: uuid("source_section_id").references(() => sourceSections.id, {
      onDelete: "set null",
    }),
    relevance: relevanceEnum("relevance").notNull().default("supporting"),
  },
  (table) => [primaryKey({ columns: [table.topicId, table.sourceId] })],
);

import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { confidenceEnum, contentTypeEnum } from "./enums";
import { sourceSections, sources } from "./source";

export const citations = pgTable("citations", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentType: contentTypeEnum("content_type").notNull(),
  contentId: uuid("content_id").notNull(),
  sourceId: uuid("source_id")
    .notNull()
    .references(() => sources.id, { onDelete: "cascade" }),
  sourceSectionId: uuid("source_section_id").references(() => sourceSections.id, {
    onDelete: "set null",
  }),
  claimText: text("claim_text").notNull(),
  confidence: confidenceEnum("confidence").notNull().default("interpretation"),
});

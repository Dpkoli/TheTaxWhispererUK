import { date, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { jurisdictionEnum, sourceStatusEnum, sourceTypeEnum } from "./enums";

export const sources = pgTable("sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  sourceType: sourceTypeEnum("source_type").notNull(),
  title: text("title").notNull(),
  citationCode: text("citation_code").notNull(),
  officialUrl: text("official_url").notNull(),
  jurisdiction: jurisdictionEnum("jurisdiction").notNull().default("uk"),
  effectiveFrom: date("effective_from"),
  effectiveTo: date("effective_to"),
  supersededById: uuid("superseded_by_id"),
  summaryPlainEnglish: text("summary_plain_english").notNull(),
  fullTextExtract: text("full_text_extract"),
  status: sourceStatusEnum("status").notNull().default("in_force"),
  lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sourceSections = pgTable("source_sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceId: uuid("source_id")
    .notNull()
    .references(() => sources.id, { onDelete: "cascade" }),
  sectionLabel: text("section_label").notNull(),
  text: text("text").notNull(),
  anchorSlug: text("anchor_slug").notNull(),
});

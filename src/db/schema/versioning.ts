import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import {
  contentTypeEnum,
  ingestionStatusEnum,
  reviewStatusEnum,
  sourceTypeEnum,
  triggeredByEnum,
} from "./enums";
import { sources } from "./source";

export const contentVersions = pgTable("content_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentType: contentTypeEnum("content_type").notNull(),
  contentId: uuid("content_id").notNull(),
  versionNumber: integer("version_number").notNull(),
  snapshot: jsonb("snapshot").notNull(),
  changeReason: text("change_reason").notNull(),
  triggeredBy: triggeredByEnum("triggered_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ingestionRuns = pgTable("ingestion_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceTypeScanned: sourceTypeEnum("source_type_scanned").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  newSourcesFound: integer("new_sources_found").notNull().default(0),
  sourcesFlaggedForReview: integer("sources_flagged_for_review").notNull().default(0),
  status: ingestionStatusEnum("status").notNull().default("running"),
});

export const sourceChangeFlags = pgTable("source_change_flags", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceId: uuid("source_id")
    .notNull()
    .references(() => sources.id, { onDelete: "cascade" }),
  ingestionRunId: uuid("ingestion_run_id")
    .notNull()
    .references(() => ingestionRuns.id, { onDelete: "cascade" }),
  changeSummary: text("change_summary").notNull(),
  affectedTopics: uuid("affected_topics").array().notNull().default([]),
  affectedContent: jsonb("affected_content").notNull(),
  reviewStatus: reviewStatusEnum("review_status").notNull().default("pending"),
});

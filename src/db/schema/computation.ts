import {
  date,
  decimal,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import {
  computationStatusEnum,
  confirmationStatusEnum,
  fileTypeEnum,
  jurisdictionEnum,
  rateTableStatusEnum,
  taxAreaEnum,
} from "./enums";
import { sources } from "./source";
import { users } from "./user";

export const rateTables = pgTable("rate_tables", {
  id: uuid("id").primaryKey().defaultRandom(),
  taxArea: taxAreaEnum("tax_area").notNull(),
  taxYear: text("tax_year").notNull(),
  jurisdiction: jurisdictionEnum("jurisdiction").notNull().default("uk"),
  effectiveFrom: date("effective_from").notNull(),
  effectiveTo: date("effective_to"),
  values: jsonb("values").notNull(),
  sourceId: uuid("source_id")
    .notNull()
    .references(() => sources.id, { onDelete: "restrict" }),
  status: rateTableStatusEnum("status").notNull().default("draft"),
});

export const taxComputations = pgTable("tax_computations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  taxArea: taxAreaEnum("tax_area").notNull(),
  rateTableId: uuid("rate_table_id")
    .notNull()
    .references(() => rateTables.id, { onDelete: "restrict" }),
  inputSnapshot: jsonb("input_snapshot").notNull(),
  outputBreakdown: jsonb("output_breakdown"),
  narrativeExplanation: text("narrative_explanation"),
  status: computationStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const computationLineItems = pgTable("computation_line_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  computationId: uuid("computation_id")
    .notNull()
    .references(() => taxComputations.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  amount: decimal("amount", { precision: 14, scale: 2 }).notNull(),
  sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
  orderIndex: integer("order_index").notNull(),
});

export const documentExtractions = pgTable("document_extractions", {
  id: uuid("id").primaryKey().defaultRandom(),
  computationId: uuid("computation_id").references(() => taxComputations.id, {
    onDelete: "cascade",
  }),
  fileType: fileTypeEnum("file_type").notNull(),
  originalFilename: text("original_filename").notNull(),
  extractedFields: jsonb("extracted_fields").notNull(),
  confirmedFields: jsonb("confirmed_fields"),
  confirmationStatus: confirmationStatusEnum("confirmation_status")
    .notNull()
    .default("pending"),
});

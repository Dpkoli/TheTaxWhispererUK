import { pgEnum } from "drizzle-orm/pg-core";

export const sourceTypeEnum = pgEnum("source_type", [
  "act",
  "statutory_instrument",
  "hmrc_manual",
  "govuk_guidance",
  "case_ftt",
  "case_ukt",
  "case_court_of_appeal",
  "case_supreme_court",
  "pensions_regulator_code",
  "fca_rule",
]);

export const jurisdictionEnum = pgEnum("jurisdiction", [
  "uk",
  "england_wales",
  "scotland",
  "wales",
  "northern_ireland",
]);

export const sourceStatusEnum = pgEnum("source_status", [
  "in_force",
  "repealed",
  "amended",
  "superseded",
  "unverified",
]);

export const taxAreaEnum = pgEnum("tax_area", [
  "income_tax",
  "nic",
  "cgt",
  "iht",
  "corporation_tax",
  "vat",
  "sdlt",
  "ir35",
  "r_and_d_relief",
  "transfer_pricing",
  "council_tax",
  "business_rates",
  "payroll_compliance",
  "self_assessment",
  "companies_house",
  "employment_status",
  "hmrc_disputes",
  "state_pension",
  "workplace_pension",
  "db_pension",
  "dc_pension",
  "annual_allowance",
  "sipp_ssas",
  "pension_tax_relief",
  "pension_drawdown",
  "pension_governance",
]);

export const difficultyLevelEnum = pgEnum("difficulty_level", [
  "foundational",
  "intermediate",
  "advanced",
]);

export const relevanceEnum = pgEnum("relevance", ["primary", "supporting"]);

export const contentTypeEnum = pgEnum("content_type", [
  "chat_message",
  "advisory_answer",
  "learning_section",
]);

export const confidenceEnum = pgEnum("confidence", [
  "settled_law",
  "hmrc_view_untested",
  "interpretation",
  "unverified",
]);

export const learningSectionTypeEnum = pgEnum("learning_section_type", [
  "explanation",
  "worked_example",
  "practice_question",
  "key_takeaways",
]);

export const questionFormatEnum = pgEnum("question_format", [
  "mcq",
  "short_answer",
  "calculation",
]);

export const learningProgressStatusEnum = pgEnum("learning_progress_status", [
  "not_started",
  "in_progress",
  "completed",
]);

export const triggeredByEnum = pgEnum("triggered_by", [
  "ingestion_pipeline",
  "manual_edit",
]);

export const ingestionStatusEnum = pgEnum("ingestion_status", [
  "running",
  "completed",
  "failed",
]);

export const reviewStatusEnum = pgEnum("review_status", [
  "pending",
  "auto_applied",
  "approved",
  "rejected",
]);

export const rateTableStatusEnum = pgEnum("rate_table_status", [
  "draft",
  "published",
  "superseded",
]);

export const computationStatusEnum = pgEnum("computation_status", [
  "draft",
  "confirmed",
  "exported",
]);

export const fileTypeEnum = pgEnum("file_type", ["pdf", "xlsx", "csv"]);

export const confirmationStatusEnum = pgEnum("confirmation_status", [
  "pending",
  "confirmed",
  "discarded",
]);

export const chatRoleEnum = pgEnum("chat_role", ["user", "assistant"]);

CREATE TYPE "public"."chat_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."computation_status" AS ENUM('draft', 'confirmed', 'exported');--> statement-breakpoint
CREATE TYPE "public"."confidence" AS ENUM('settled_law', 'hmrc_view_untested', 'interpretation', 'unverified');--> statement-breakpoint
CREATE TYPE "public"."confirmation_status" AS ENUM('pending', 'confirmed', 'discarded');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('chat_message', 'advisory_answer', 'learning_section');--> statement-breakpoint
CREATE TYPE "public"."difficulty_level" AS ENUM('foundational', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."file_type" AS ENUM('pdf', 'xlsx', 'csv');--> statement-breakpoint
CREATE TYPE "public"."ingestion_status" AS ENUM('running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."jurisdiction" AS ENUM('uk', 'england_wales', 'scotland', 'wales', 'northern_ireland');--> statement-breakpoint
CREATE TYPE "public"."learning_progress_status" AS ENUM('not_started', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."learning_section_type" AS ENUM('explanation', 'worked_example', 'practice_question', 'key_takeaways');--> statement-breakpoint
CREATE TYPE "public"."question_format" AS ENUM('mcq', 'short_answer', 'calculation');--> statement-breakpoint
CREATE TYPE "public"."rate_table_status" AS ENUM('draft', 'published', 'superseded');--> statement-breakpoint
CREATE TYPE "public"."relevance" AS ENUM('primary', 'supporting');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'auto_applied', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."source_status" AS ENUM('in_force', 'repealed', 'amended', 'superseded', 'unverified');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('act', 'statutory_instrument', 'hmrc_manual', 'govuk_guidance', 'case_ftt', 'case_ukt', 'case_court_of_appeal', 'case_supreme_court', 'pensions_regulator_code', 'fca_rule');--> statement-breakpoint
CREATE TYPE "public"."tax_area" AS ENUM('income_tax', 'nic', 'cgt', 'iht', 'corporation_tax', 'vat', 'sdlt', 'ir35', 'r_and_d_relief', 'transfer_pricing', 'council_tax', 'business_rates', 'payroll_compliance', 'self_assessment', 'companies_house', 'employment_status', 'hmrc_disputes', 'state_pension', 'workplace_pension', 'db_pension', 'dc_pension', 'annual_allowance', 'sipp_ssas', 'pension_tax_relief', 'pension_drawdown', 'pension_governance');--> statement-breakpoint
CREATE TYPE "public"."triggered_by" AS ENUM('ingestion_pipeline', 'manual_edit');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"image" text,
	"email_verified" timestamp with time zone,
	"is_guest_upgraded" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "source_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"section_label" text NOT NULL,
	"text" text NOT NULL,
	"anchor_slug" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_type" "source_type" NOT NULL,
	"title" text NOT NULL,
	"citation_code" text NOT NULL,
	"official_url" text NOT NULL,
	"jurisdiction" "jurisdiction" DEFAULT 'uk' NOT NULL,
	"effective_from" date,
	"effective_to" date,
	"superseded_by_id" uuid,
	"summary_plain_english" text NOT NULL,
	"full_text_extract" text,
	"status" "source_status" DEFAULT 'in_force' NOT NULL,
	"last_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topic_sources" (
	"topic_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"source_section_id" uuid,
	"relevance" "relevance" DEFAULT 'supporting' NOT NULL,
	CONSTRAINT "topic_sources_topic_id_source_id_pk" PRIMARY KEY("topic_id","source_id")
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"parent_topic_id" uuid,
	"tax_area" "tax_area" NOT NULL,
	"devolved_variance" boolean DEFAULT false NOT NULL,
	"difficulty_level" "difficulty_level" DEFAULT 'foundational' NOT NULL,
	CONSTRAINT "topics_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "citations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_type" "content_type" NOT NULL,
	"content_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"source_section_id" uuid,
	"claim_text" text NOT NULL,
	"confidence" "confidence" DEFAULT 'interpretation' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"role" "chat_role" NOT NULL,
	"body" text NOT NULL,
	"escalation_suggested_topic_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"is_guest" boolean DEFAULT true NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "advisory_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"plain_summary" text NOT NULL,
	"technical_analysis" text NOT NULL,
	"worked_example" text,
	"compliance_notes" text,
	"deadlines" text,
	"confidence_flag" "confidence" DEFAULT 'interpretation' NOT NULL,
	"answer_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "advisory_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"topic_id" uuid,
	"raw_question" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_chapters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid NOT NULL,
	"title" text NOT NULL,
	"order_index" integer NOT NULL,
	"summary" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chapter_id" uuid NOT NULL,
	"section_type" "learning_section_type" NOT NULL,
	"body" text NOT NULL,
	"order_index" integer NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learning_section_id" uuid NOT NULL,
	"question_text" text NOT NULL,
	"question_format" "question_format" NOT NULL,
	"options" jsonb,
	"correct_answer" text NOT NULL,
	"explanation" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_learning_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"chapter_id" uuid NOT NULL,
	"status" "learning_progress_status" DEFAULT 'not_started' NOT NULL,
	"last_section_id" uuid,
	"quiz_score" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_type" "content_type" NOT NULL,
	"content_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"change_reason" text NOT NULL,
	"triggered_by" "triggered_by" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingestion_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_type_scanned" "source_type" NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"new_sources_found" integer DEFAULT 0 NOT NULL,
	"sources_flagged_for_review" integer DEFAULT 0 NOT NULL,
	"status" "ingestion_status" DEFAULT 'running' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_change_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"ingestion_run_id" uuid NOT NULL,
	"change_summary" text NOT NULL,
	"affected_topics" uuid[] DEFAULT '{}' NOT NULL,
	"affected_content" jsonb NOT NULL,
	"review_status" "review_status" DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "computation_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"computation_id" uuid NOT NULL,
	"label" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"source_id" uuid,
	"order_index" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_extractions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"computation_id" uuid,
	"file_type" "file_type" NOT NULL,
	"original_filename" text NOT NULL,
	"extracted_fields" jsonb NOT NULL,
	"confirmed_fields" jsonb,
	"confirmation_status" "confirmation_status" DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_tables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tax_area" "tax_area" NOT NULL,
	"tax_year" text NOT NULL,
	"jurisdiction" "jurisdiction" DEFAULT 'uk' NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"values" jsonb NOT NULL,
	"source_id" uuid NOT NULL,
	"status" "rate_table_status" DEFAULT 'draft' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_computations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"tax_area" "tax_area" NOT NULL,
	"rate_table_id" uuid NOT NULL,
	"input_snapshot" jsonb NOT NULL,
	"output_breakdown" jsonb,
	"narrative_explanation" text,
	"status" "computation_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_sections" ADD CONSTRAINT "source_sections_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_sources" ADD CONSTRAINT "topic_sources_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_sources" ADD CONSTRAINT "topic_sources_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_sources" ADD CONSTRAINT "topic_sources_source_section_id_source_sections_id_fk" FOREIGN KEY ("source_section_id") REFERENCES "public"."source_sections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citations" ADD CONSTRAINT "citations_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citations" ADD CONSTRAINT "citations_source_section_id_source_sections_id_fk" FOREIGN KEY ("source_section_id") REFERENCES "public"."source_sections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_escalation_suggested_topic_id_topics_id_fk" FOREIGN KEY ("escalation_suggested_topic_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advisory_answers" ADD CONSTRAINT "advisory_answers_question_id_advisory_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."advisory_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advisory_questions" ADD CONSTRAINT "advisory_questions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advisory_questions" ADD CONSTRAINT "advisory_questions_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_chapters" ADD CONSTRAINT "learning_chapters_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_sections" ADD CONSTRAINT "learning_sections_chapter_id_learning_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."learning_chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_questions" ADD CONSTRAINT "practice_questions_learning_section_id_learning_sections_id_fk" FOREIGN KEY ("learning_section_id") REFERENCES "public"."learning_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_learning_progress" ADD CONSTRAINT "user_learning_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_learning_progress" ADD CONSTRAINT "user_learning_progress_chapter_id_learning_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."learning_chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_learning_progress" ADD CONSTRAINT "user_learning_progress_last_section_id_learning_sections_id_fk" FOREIGN KEY ("last_section_id") REFERENCES "public"."learning_sections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_change_flags" ADD CONSTRAINT "source_change_flags_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_change_flags" ADD CONSTRAINT "source_change_flags_ingestion_run_id_ingestion_runs_id_fk" FOREIGN KEY ("ingestion_run_id") REFERENCES "public"."ingestion_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "computation_line_items" ADD CONSTRAINT "computation_line_items_computation_id_tax_computations_id_fk" FOREIGN KEY ("computation_id") REFERENCES "public"."tax_computations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "computation_line_items" ADD CONSTRAINT "computation_line_items_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_extractions" ADD CONSTRAINT "document_extractions_computation_id_tax_computations_id_fk" FOREIGN KEY ("computation_id") REFERENCES "public"."tax_computations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rate_tables" ADD CONSTRAINT "rate_tables_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_computations" ADD CONSTRAINT "tax_computations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_computations" ADD CONSTRAINT "tax_computations_rate_table_id_rate_tables_id_fk" FOREIGN KEY ("rate_table_id") REFERENCES "public"."rate_tables"("id") ON DELETE restrict ON UPDATE no action;
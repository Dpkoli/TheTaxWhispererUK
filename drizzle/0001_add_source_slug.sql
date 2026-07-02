ALTER TABLE "sources" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_slug_unique" UNIQUE("slug");
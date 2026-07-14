import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { contentVersions } from "@/db/schema";

/**
 * Appends a ContentVersion snapshot for a piece of versioned content
 * (advisory_answer or learning_section), auto-incrementing version_number
 * per content_id rather than requiring the caller to track it.
 */
export async function recordContentVersion(
  contentType: "advisory_answer" | "learning_section",
  contentId: string,
  snapshot: unknown,
  changeReason: string,
  triggeredBy: "ingestion_pipeline" | "manual_edit",
) {
  const [{ existingCount }] = await db
    .select({ existingCount: count() })
    .from(contentVersions)
    .where(
      and(eq(contentVersions.contentType, contentType), eq(contentVersions.contentId, contentId)),
    );

  await db.insert(contentVersions).values({
    contentType,
    contentId,
    versionNumber: existingCount + 1,
    snapshot,
    changeReason,
    triggeredBy,
  });
}

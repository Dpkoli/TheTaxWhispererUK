import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { ingestionRuns, sourceChangeFlags, sources } from "@/db/schema";

export async function listIngestionRuns() {
  return db.query.ingestionRuns.findMany({
    orderBy: [desc(ingestionRuns.startedAt)],
    limit: 20,
  });
}

export async function listFlags(reviewStatus?: "pending" | "approved" | "rejected") {
  const rows = await db
    .select({ flag: sourceChangeFlags, source: sources, run: ingestionRuns })
    .from(sourceChangeFlags)
    .innerJoin(sources, eq(sources.id, sourceChangeFlags.sourceId))
    .innerJoin(ingestionRuns, eq(ingestionRuns.id, sourceChangeFlags.ingestionRunId))
    .orderBy(desc(ingestionRuns.startedAt));

  return reviewStatus
    ? rows.filter((row) => row.flag.reviewStatus === reviewStatus)
    : rows;
}

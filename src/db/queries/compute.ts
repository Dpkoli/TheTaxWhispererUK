import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { rateTables, sources } from "@/db/schema";

export async function getPublishedRateTable(
  taxArea: "income_tax" | "nic" | "cgt",
  jurisdiction: "uk",
) {
  const row = await db
    .select({ rateTable: rateTables, source: sources })
    .from(rateTables)
    .innerJoin(sources, eq(sources.id, rateTables.sourceId))
    .where(
      and(
        eq(rateTables.taxArea, taxArea),
        eq(rateTables.jurisdiction, jurisdiction),
        eq(rateTables.status, "published"),
      ),
    )
    .orderBy(desc(rateTables.effectiveFrom))
    .limit(1);

  return row[0] ?? null;
}

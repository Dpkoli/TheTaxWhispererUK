"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { computationLineItems, taxComputations } from "@/db/schema";
import { getPublishedRateTable } from "@/db/queries/compute";
import { computeRdRelief, type RdReliefRateTableValues } from "@/lib/tax-engine/rd-relief";
import { narrateRdReliefResult } from "@/lib/tax-engine/narrative";

export async function runRdReliefComputation(qualifyingExpenditure: number) {
  if (!Number.isFinite(qualifyingExpenditure) || qualifyingExpenditure < 0) {
    throw new Error("Enter a valid, non-negative expenditure figure");
  }

  const rateTableRow = await getPublishedRateTable("r_and_d_relief", "uk");
  if (!rateTableRow) {
    throw new Error("No published R&D tax relief rate table is available");
  }

  const { rateTable, source } = rateTableRow;
  const values = rateTable.values as RdReliefRateTableValues;
  const result = computeRdRelief(qualifyingExpenditure, values);
  const narrative = narrateRdReliefResult(result);

  const session = await auth();
  let computationId: string | null = null;

  if (session?.user?.id) {
    const [computation] = await db
      .insert(taxComputations)
      .values({
        userId: session.user.id,
        taxArea: "r_and_d_relief",
        rateTableId: rateTable.id,
        inputSnapshot: { qualifyingExpenditure },
        outputBreakdown: result,
        narrativeExplanation: narrative,
        status: "confirmed",
      })
      .returning();

    computationId = computation.id;

    await db.insert(computationLineItems).values(
      result.lineItems.map((item, index) => ({
        computationId: computation.id,
        label: item.label,
        amount: item.amount.toFixed(2),
        orderIndex: index,
      })),
    );
  }

  return {
    result,
    narrative,
    rateTableVersion: {
      taxYear: rateTable.taxYear,
      jurisdiction: rateTable.jurisdiction,
      sourceCitationCode: source.citationCode,
      sourceSlug: source.slug,
    },
    persisted: computationId !== null,
    computationId,
  };
}

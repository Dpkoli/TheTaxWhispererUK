"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { computationLineItems, taxComputations } from "@/db/schema";
import { getPublishedRateTable } from "@/db/queries/compute";
import {
  computeClass1Nic,
  type NationalInsuranceRateTableValues,
} from "@/lib/tax-engine/national-insurance";
import { narrateClass1NicResult } from "@/lib/tax-engine/narrative";

export async function runClass1NicComputation(annualEarnings: number) {
  if (!Number.isFinite(annualEarnings) || annualEarnings < 0) {
    throw new Error("Enter a valid, non-negative earnings figure");
  }

  const rateTableRow = await getPublishedRateTable("nic", "uk");
  if (!rateTableRow) {
    throw new Error("No published National Insurance rate table is available");
  }

  const { rateTable, source } = rateTableRow;
  const values = rateTable.values as NationalInsuranceRateTableValues;
  const result = computeClass1Nic(annualEarnings, values);
  const narrative = narrateClass1NicResult(result, rateTable.taxYear);

  const session = await auth();
  let computationId: string | null = null;

  if (session?.user?.id) {
    const [computation] = await db
      .insert(taxComputations)
      .values({
        userId: session.user.id,
        taxArea: "nic",
        rateTableId: rateTable.id,
        inputSnapshot: { annualEarnings },
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

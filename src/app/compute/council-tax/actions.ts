"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { computationLineItems, taxComputations } from "@/db/schema";
import { getPublishedRateTable } from "@/db/queries/compute";
import {
  computeCouncilTax,
  type CouncilTaxBand,
  type CouncilTaxRateTableValues,
} from "@/lib/tax-engine/council-tax";
import { narrateCouncilTaxResult } from "@/lib/tax-engine/narrative";

export async function runCouncilTaxComputation(
  band: CouncilTaxBand,
  bandDCharge: number,
  isSinglePersonDiscount = false,
  emptyUnfurnishedMonths = 0,
) {
  if (!Number.isFinite(bandDCharge) || bandDCharge < 0) {
    throw new Error("Enter a valid, non-negative Band D charge");
  }
  if (!Number.isFinite(emptyUnfurnishedMonths) || emptyUnfurnishedMonths < 0) {
    throw new Error("Enter a valid, non-negative number of months empty");
  }

  const rateTableRow = await getPublishedRateTable("council_tax", "uk");
  if (!rateTableRow) {
    throw new Error("No published Council Tax rate table is available");
  }

  const { rateTable, source } = rateTableRow;
  const values = rateTable.values as CouncilTaxRateTableValues;
  const result = computeCouncilTax(band, bandDCharge, values, {
    isSinglePersonDiscount,
    emptyUnfurnishedMonths,
  });
  const narrative = narrateCouncilTaxResult(result);

  const session = await auth();
  let computationId: string | null = null;

  if (session?.user?.id) {
    const [computation] = await db
      .insert(taxComputations)
      .values({
        userId: session.user.id,
        taxArea: "council_tax",
        rateTableId: rateTable.id,
        inputSnapshot: { band, bandDCharge, isSinglePersonDiscount, emptyUnfurnishedMonths },
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

"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { computationLineItems, taxComputations } from "@/db/schema";
import { getPublishedRateTable } from "@/db/queries/compute";
import {
  computeBusinessRates,
  type BusinessRatesRateTableValues,
} from "@/lib/tax-engine/business-rates";
import { narrateBusinessRatesResult } from "@/lib/tax-engine/narrative";

export async function runBusinessRatesComputation(
  rateableValue: number,
  isRetailHospitalityLeisure: boolean,
) {
  if (!Number.isFinite(rateableValue) || rateableValue < 0) {
    throw new Error("Enter a valid, non-negative rateable value");
  }

  const rateTableRow = await getPublishedRateTable("business_rates", "uk");
  if (!rateTableRow) {
    throw new Error("No published Business Rates rate table is available");
  }

  const { rateTable, source } = rateTableRow;
  const values = rateTable.values as BusinessRatesRateTableValues;
  const result = computeBusinessRates(rateableValue, isRetailHospitalityLeisure, values);
  const narrative = narrateBusinessRatesResult(result);

  const session = await auth();
  let computationId: string | null = null;

  if (session?.user?.id) {
    const [computation] = await db
      .insert(taxComputations)
      .values({
        userId: session.user.id,
        taxArea: "business_rates",
        rateTableId: rateTable.id,
        inputSnapshot: { rateableValue, isRetailHospitalityLeisure },
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

"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { computationLineItems, taxComputations } from "@/db/schema";
import { getPublishedRateTable } from "@/db/queries/compute";
import { computeIncomeTax, type IncomeTaxRateTableValues } from "@/lib/tax-engine/income-tax";
import { narrateIncomeTaxResult } from "@/lib/tax-engine/narrative";

export async function runIncomeTaxComputation(taxableIncome: number) {
  if (!Number.isFinite(taxableIncome) || taxableIncome < 0) {
    throw new Error("Enter a valid, non-negative income figure");
  }

  const rateTableRow = await getPublishedRateTable("income_tax", "uk");
  if (!rateTableRow) {
    throw new Error("No published Income Tax rate table is available");
  }

  const { rateTable, source } = rateTableRow;
  const values = rateTable.values as IncomeTaxRateTableValues;
  const result = computeIncomeTax(taxableIncome, values);
  const narrative = narrateIncomeTaxResult(result, rateTable.taxYear);

  const session = await auth();
  let computationId: string | null = null;

  if (session?.user?.id) {
    const [computation] = await db
      .insert(taxComputations)
      .values({
        userId: session.user.id,
        taxArea: "income_tax",
        rateTableId: rateTable.id,
        inputSnapshot: { taxableIncome },
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

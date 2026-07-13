"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { computationLineItems, taxComputations } from "@/db/schema";
import { getPublishedRateTable } from "@/db/queries/compute";
import { computeIncomeTax, type IncomeTaxRateTableValues } from "@/lib/tax-engine/income-tax";
import {
  computeCapitalGainsTax,
  type CapitalGainsTaxRateTableValues,
} from "@/lib/tax-engine/capital-gains-tax";
import { narrateCapitalGainsTaxResult } from "@/lib/tax-engine/narrative";

export async function runCapitalGainsTaxComputation(
  totalGains: number,
  otherTaxableIncome: number,
) {
  if (!Number.isFinite(totalGains) || totalGains < 0) {
    throw new Error("Enter a valid, non-negative gains figure");
  }
  if (!Number.isFinite(otherTaxableIncome) || otherTaxableIncome < 0) {
    throw new Error("Enter a valid, non-negative income figure");
  }

  const [cgtRateTableRow, incomeTaxRateTableRow] = await Promise.all([
    getPublishedRateTable("cgt", "uk"),
    getPublishedRateTable("income_tax", "uk"),
  ]);
  if (!cgtRateTableRow) {
    throw new Error("No published Capital Gains Tax rate table is available");
  }
  if (!incomeTaxRateTableRow) {
    throw new Error("No published Income Tax rate table is available");
  }

  const { rateTable, source } = cgtRateTableRow;
  const cgtRates = rateTable.values as CapitalGainsTaxRateTableValues;
  const incomeTaxRates = incomeTaxRateTableRow.rateTable.values as IncomeTaxRateTableValues;

  // TCGA 1992 s.4(4): the basic rate applies to the extent the gain fits in
  // whatever's left of the individual's Income Tax basic rate band after
  // their other income — derived here from the same Income Tax engine
  // rather than duplicating the band logic.
  const incomeTaxResult = computeIncomeTax(otherTaxableIncome, incomeTaxRates);
  const basicRateCeiling = incomeTaxRates.bands[0]?.upTo ?? 0;
  const unusedBasicRateBand = Math.max(
    0,
    basicRateCeiling - incomeTaxResult.incomeAfterAllowance,
  );

  const result = computeCapitalGainsTax(totalGains, unusedBasicRateBand, cgtRates);
  const narrative = narrateCapitalGainsTaxResult(result, rateTable.taxYear);

  const session = await auth();
  let computationId: string | null = null;

  if (session?.user?.id) {
    const [computation] = await db
      .insert(taxComputations)
      .values({
        userId: session.user.id,
        taxArea: "cgt",
        rateTableId: rateTable.id,
        inputSnapshot: { totalGains, otherTaxableIncome },
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

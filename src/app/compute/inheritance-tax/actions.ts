"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { computationLineItems, taxComputations } from "@/db/schema";
import { getPublishedRateTable } from "@/db/queries/compute";
import {
  computeInheritanceTax,
  type InheritanceTaxRateTableValues,
} from "@/lib/tax-engine/inheritance-tax";
import { narrateInheritanceTaxResult } from "@/lib/tax-engine/narrative";

export async function runInheritanceTaxComputation(
  netEstateValue: number,
  residenceValuePassingToDescendants: number,
  transferableNilRateBandPercent: number,
) {
  if (!Number.isFinite(netEstateValue) || netEstateValue < 0) {
    throw new Error("Enter a valid, non-negative estate value");
  }
  if (
    !Number.isFinite(residenceValuePassingToDescendants) ||
    residenceValuePassingToDescendants < 0
  ) {
    throw new Error("Enter a valid, non-negative residence value");
  }
  if (
    !Number.isFinite(transferableNilRateBandPercent) ||
    transferableNilRateBandPercent < 0 ||
    transferableNilRateBandPercent > 100
  ) {
    throw new Error("Transferable nil-rate band percentage must be between 0 and 100");
  }

  const rateTableRow = await getPublishedRateTable("iht", "uk");
  if (!rateTableRow) {
    throw new Error("No published Inheritance Tax rate table is available");
  }

  const { rateTable, source } = rateTableRow;
  const values = rateTable.values as InheritanceTaxRateTableValues;
  const result = computeInheritanceTax(
    netEstateValue,
    residenceValuePassingToDescendants,
    transferableNilRateBandPercent,
    values,
  );
  const narrative = narrateInheritanceTaxResult(result);

  const session = await auth();
  let computationId: string | null = null;

  if (session?.user?.id) {
    const [computation] = await db
      .insert(taxComputations)
      .values({
        userId: session.user.id,
        taxArea: "iht",
        rateTableId: rateTable.id,
        inputSnapshot: {
          netEstateValue,
          residenceValuePassingToDescendants,
          transferableNilRateBandPercent,
        },
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

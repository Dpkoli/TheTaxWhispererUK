"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { computationLineItems, taxComputations } from "@/db/schema";
import { getPublishedRateTable } from "@/db/queries/compute";
import {
  computeCorporationTax,
  type CorporationTaxRateTableValues,
} from "@/lib/tax-engine/corporation-tax";
import { narrateCorporationTaxResult } from "@/lib/tax-engine/narrative";

export async function runCorporationTaxComputation(profits: number) {
  if (!Number.isFinite(profits) || profits < 0) {
    throw new Error("Enter a valid, non-negative profits figure");
  }

  const rateTableRow = await getPublishedRateTable("corporation_tax", "uk");
  if (!rateTableRow) {
    throw new Error("No published Corporation Tax rate table is available");
  }

  const { rateTable, source } = rateTableRow;
  const values = rateTable.values as CorporationTaxRateTableValues;
  const result = computeCorporationTax(profits, values);
  const narrative = narrateCorporationTaxResult(result, rateTable.taxYear);

  const session = await auth();
  let computationId: string | null = null;

  if (session?.user?.id) {
    const [computation] = await db
      .insert(taxComputations)
      .values({
        userId: session.user.id,
        taxArea: "corporation_tax",
        rateTableId: rateTable.id,
        inputSnapshot: { profits },
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

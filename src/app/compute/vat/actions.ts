"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { computationLineItems, taxComputations } from "@/db/schema";
import { getPublishedRateTable } from "@/db/queries/compute";
import { computeVat, type VatRateTableValues } from "@/lib/tax-engine/vat";
import { narrateVatResult } from "@/lib/tax-engine/narrative";

export async function runVatComputation(
  standardRatedSales: number,
  reducedRatedSales: number,
  zeroRatedSales: number,
  inputVat: number,
) {
  for (const [label, value] of [
    ["standard-rated sales", standardRatedSales],
    ["reduced-rated sales", reducedRatedSales],
    ["zero-rated sales", zeroRatedSales],
    ["input VAT", inputVat],
  ] as const) {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`Enter a valid, non-negative ${label} figure`);
    }
  }

  const rateTableRow = await getPublishedRateTable("vat", "uk");
  if (!rateTableRow) {
    throw new Error("No published VAT rate table is available");
  }

  const { rateTable, source } = rateTableRow;
  const values = rateTable.values as VatRateTableValues;
  const result = computeVat(
    standardRatedSales,
    reducedRatedSales,
    zeroRatedSales,
    inputVat,
    values,
  );
  const narrative = narrateVatResult(result);

  const session = await auth();
  let computationId: string | null = null;

  if (session?.user?.id) {
    const [computation] = await db
      .insert(taxComputations)
      .values({
        userId: session.user.id,
        taxArea: "vat",
        rateTableId: rateTable.id,
        inputSnapshot: { standardRatedSales, reducedRatedSales, zeroRatedSales, inputVat },
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

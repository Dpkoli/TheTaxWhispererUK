"use server";

import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { computationLineItems, documentExtractions, taxComputations } from "@/db/schema";
import { getPublishedRateTable } from "@/db/queries/compute";
import { computeIncomeTax, type IncomeTaxRateTableValues } from "@/lib/tax-engine/income-tax";
import { narrateIncomeTaxResult } from "@/lib/tax-engine/narrative";

export async function runIncomeTaxComputation(
  taxableIncome: number,
  jurisdiction: "uk" | "scotland" = "uk",
  sourceExtractionId?: string,
) {
  if (!Number.isFinite(taxableIncome) || taxableIncome < 0) {
    throw new Error("Enter a valid, non-negative income figure");
  }

  const rateTableRow = await getPublishedRateTable("income_tax", jurisdiction);
  if (!rateTableRow) {
    throw new Error(
      `No published Income Tax rate table is available for ${jurisdiction === "scotland" ? "Scotland" : "the UK"}`,
    );
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
        inputSnapshot: { taxableIncome, jurisdiction },
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

  // The moment a user submits a (possibly edited) figure for computation is
  // the explicit confirmation step — this is what "confirmed" means for a
  // DocumentExtraction, never the raw extracted value on its own.
  if (sourceExtractionId) {
    await db
      .update(documentExtractions)
      .set({
        confirmedFields: { taxableIncome },
        confirmationStatus: "confirmed",
        computationId,
      })
      .where(eq(documentExtractions.id, sourceExtractionId));
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

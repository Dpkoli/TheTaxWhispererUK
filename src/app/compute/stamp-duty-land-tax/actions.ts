"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { computationLineItems, taxComputations } from "@/db/schema";
import { getPublishedRateTable } from "@/db/queries/compute";
import { computeSdlt, type SdltRateTableValues } from "@/lib/tax-engine/stamp-duty-land-tax";
import { narrateSdltResult } from "@/lib/tax-engine/narrative";

export async function runSdltComputation(purchasePrice: number, isFirstTimeBuyer: boolean) {
  if (!Number.isFinite(purchasePrice) || purchasePrice < 0) {
    throw new Error("Enter a valid, non-negative purchase price");
  }

  const rateTableRow = await getPublishedRateTable("sdlt", "uk");
  if (!rateTableRow) {
    throw new Error("No published Stamp Duty Land Tax rate table is available");
  }

  const { rateTable, source } = rateTableRow;
  const values = rateTable.values as SdltRateTableValues;
  const result = computeSdlt(purchasePrice, isFirstTimeBuyer, values);
  const narrative = narrateSdltResult(result);

  const session = await auth();
  let computationId: string | null = null;

  if (session?.user?.id) {
    const [computation] = await db
      .insert(taxComputations)
      .values({
        userId: session.user.id,
        taxArea: "sdlt",
        rateTableId: rateTable.id,
        inputSnapshot: { purchasePrice, isFirstTimeBuyer },
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

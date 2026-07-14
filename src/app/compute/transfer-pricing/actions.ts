"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { computationLineItems, taxComputations } from "@/db/schema";
import { getPublishedRateTable } from "@/db/queries/compute";
import {
  computeTransferPricing,
  type TransferPricingRateTableValues,
  type TransferPricingTransactionType,
} from "@/lib/tax-engine/transfer-pricing";
import { narrateTransferPricingResult } from "@/lib/tax-engine/narrative";

export async function runTransferPricingComputation(
  actualPrice: number,
  armsLengthLow: number,
  armsLengthHigh: number,
  transactionType: TransferPricingTransactionType,
) {
  if (!Number.isFinite(actualPrice) || actualPrice < 0) {
    throw new Error("Enter a valid, non-negative actual transaction price");
  }
  if (!Number.isFinite(armsLengthLow) || armsLengthLow < 0) {
    throw new Error("Enter a valid, non-negative arm's-length range low figure");
  }
  if (!Number.isFinite(armsLengthHigh) || armsLengthHigh < armsLengthLow) {
    throw new Error("The arm's-length range high figure cannot be below the low figure");
  }

  const rateTableRow = await getPublishedRateTable("transfer_pricing", "uk");
  if (!rateTableRow) {
    throw new Error("No published transfer pricing rate table is available");
  }

  const { rateTable, source } = rateTableRow;
  const values = rateTable.values as TransferPricingRateTableValues;
  const result = computeTransferPricing(
    actualPrice,
    armsLengthLow,
    armsLengthHigh,
    transactionType,
    values,
  );
  const narrative = narrateTransferPricingResult(result);

  const session = await auth();
  let computationId: string | null = null;

  if (session?.user?.id) {
    const [computation] = await db
      .insert(taxComputations)
      .values({
        userId: session.user.id,
        taxArea: "transfer_pricing",
        rateTableId: rateTable.id,
        inputSnapshot: { actualPrice, armsLengthLow, armsLengthHigh, transactionType },
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

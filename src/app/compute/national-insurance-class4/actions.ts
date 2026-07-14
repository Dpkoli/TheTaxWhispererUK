"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { computationLineItems, taxComputations } from "@/db/schema";
import { getPublishedRateTable } from "@/db/queries/compute";
import {
  computeClass4Nic,
  type Class4NicRateTableValues,
} from "@/lib/tax-engine/national-insurance-class4";
import { narrateClass4NicResult } from "@/lib/tax-engine/narrative";

export async function runClass4NicComputation(annualProfits: number) {
  if (!Number.isFinite(annualProfits) || annualProfits < 0) {
    throw new Error("Enter a valid, non-negative profits figure");
  }

  const rateTableRow = await getPublishedRateTable("nic_class4", "uk");
  if (!rateTableRow) {
    throw new Error("No published Class 4 National Insurance rate table is available");
  }

  const { rateTable, source } = rateTableRow;
  const values = rateTable.values as Class4NicRateTableValues;
  const result = computeClass4Nic(annualProfits, values);
  const narrative = narrateClass4NicResult(result, rateTable.taxYear);

  const session = await auth();
  let computationId: string | null = null;

  if (session?.user?.id) {
    const [computation] = await db
      .insert(taxComputations)
      .values({
        userId: session.user.id,
        taxArea: "nic_class4",
        rateTableId: rateTable.id,
        inputSnapshot: { annualProfits },
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

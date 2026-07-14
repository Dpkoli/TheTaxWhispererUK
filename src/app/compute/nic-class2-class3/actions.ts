"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { computationLineItems, taxComputations } from "@/db/schema";
import { getPublishedRateTable } from "@/db/queries/compute";
import {
  computeClass2Class3Position,
  type Class2Class3RateTableValues,
} from "@/lib/tax-engine/nic-class2-class3";
import { narrateClass2Class3Result } from "@/lib/tax-engine/narrative";

export async function runClass2Class3Computation(annualProfits: number, weeks: number) {
  if (!Number.isFinite(annualProfits) || annualProfits < 0) {
    throw new Error("Enter a valid, non-negative profits figure");
  }
  if (!Number.isFinite(weeks) || weeks <= 0) {
    throw new Error("Enter a valid number of weeks greater than zero");
  }

  const rateTableRow = await getPublishedRateTable("nic_class2_3", "uk");
  if (!rateTableRow) {
    throw new Error("No published Class 2/Class 3 National Insurance rate table is available");
  }

  const { rateTable, source } = rateTableRow;
  const values = rateTable.values as Class2Class3RateTableValues;
  const result = computeClass2Class3Position(annualProfits, weeks, values);
  const narrative = narrateClass2Class3Result(result);

  const session = await auth();
  let computationId: string | null = null;

  if (session?.user?.id) {
    const [computation] = await db
      .insert(taxComputations)
      .values({
        userId: session.user.id,
        taxArea: "nic_class2_3",
        rateTableId: rateTable.id,
        inputSnapshot: { annualProfits, weeks },
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

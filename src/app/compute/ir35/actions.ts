"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { computationLineItems, taxComputations } from "@/db/schema";
import { getPublishedRateTable } from "@/db/queries/compute";
import {
  computeIr35DeemedPayment,
  type Ir35Inputs,
  type Ir35RateTableValues,
} from "@/lib/tax-engine/ir35-deemed-payment";
import { narrateIr35Result } from "@/lib/tax-engine/narrative";

export async function runIr35Computation(inputs: Ir35Inputs) {
  const rateTableRow = await getPublishedRateTable("ir35", "uk");
  if (!rateTableRow) {
    throw new Error("No published IR35 rate table is available");
  }

  const { rateTable, source } = rateTableRow;
  const values = rateTable.values as Ir35RateTableValues;
  const result = computeIr35DeemedPayment(inputs, values);
  const narrative = narrateIr35Result(result);

  const session = await auth();
  let computationId: string | null = null;

  if (session?.user?.id) {
    const [computation] = await db
      .insert(taxComputations)
      .values({
        userId: session.user.id,
        taxArea: "ir35",
        rateTableId: rateTable.id,
        inputSnapshot: inputs,
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

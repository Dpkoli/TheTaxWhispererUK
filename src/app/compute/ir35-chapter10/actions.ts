"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { computationLineItems, taxComputations } from "@/db/schema";
import { getPublishedRateTable } from "@/db/queries/compute";
import {
  computeIr35Chapter10,
  type Ir35Chapter10RateTableValues,
} from "@/lib/tax-engine/ir35-chapter10";
import { narrateIr35Chapter10Result } from "@/lib/tax-engine/narrative";

export async function runIr35Chapter10Computation(
  chainPayment: number,
  directMaterialsCost: number,
) {
  if (!Number.isFinite(chainPayment) || chainPayment < 0) {
    throw new Error("Enter a valid, non-negative chain payment figure");
  }
  if (!Number.isFinite(directMaterialsCost) || directMaterialsCost < 0) {
    throw new Error("Enter a valid, non-negative materials cost figure");
  }

  const rateTableRow = await getPublishedRateTable("ir35_ch10", "uk");
  if (!rateTableRow) {
    throw new Error("No published Chapter 10 off-payroll rate table is available");
  }

  const { rateTable, source } = rateTableRow;
  const values = rateTable.values as Ir35Chapter10RateTableValues;
  const result = computeIr35Chapter10(chainPayment, directMaterialsCost, values);
  const narrative = narrateIr35Chapter10Result(result);

  const session = await auth();
  let computationId: string | null = null;

  if (session?.user?.id) {
    const [computation] = await db
      .insert(taxComputations)
      .values({
        userId: session.user.id,
        taxArea: "ir35_ch10",
        rateTableId: rateTable.id,
        inputSnapshot: { chainPayment, directMaterialsCost },
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

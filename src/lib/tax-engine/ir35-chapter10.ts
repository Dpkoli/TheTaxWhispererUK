export type Ir35Chapter10RateTableValues = {
  employerNicRate: number;
  employerNicSecondaryThreshold: number;
};

export type Ir35Chapter10LineItem = {
  label: string;
  amount: number;
  rate?: number;
};

export type Ir35Chapter10Result = {
  chainPayment: number;
  deemedDirectPayment: number;
  employerNicOnPayment: number;
  totalCostToFeePayer: number;
  lineItems: Ir35Chapter10LineItem[];
};

/**
 * Deterministic Chapter 10 off-payroll working computation, per ITEPA 2003
 * ss.61N-61T — applies where the end client is medium/large private
 * sector or public sector, and status is determined by the client rather
 * than the worker's own intermediary (contrast with Chapter 8, computed
 * separately by computeIr35DeemedPayment).
 *
 * Mechanically different from Chapter 8: there is no flat-rate
 * deduction, and no grossing-up is needed for employer NIC. The chain
 * payment (fee excluding VAT, less any direct cost of materials) is
 * itself the deemed direct payment subject to Income Tax and employee
 * Class 1 NIC via PAYE in the normal way. Employer (secondary) Class 1
 * NIC is calculated separately and borne by the fee-payer on top of
 * that payment — it is not deducted from what the worker receives.
 * Apprenticeship Levy is not modeled here since it is charged on the
 * fee-payer's whole annual pay bill above a £3m threshold, not
 * per-engagement.
 */
export function computeIr35Chapter10(
  chainPayment: number,
  directMaterialsCost: number,
  rates: Ir35Chapter10RateTableValues,
): Ir35Chapter10Result {
  if (chainPayment < 0) throw new Error("chainPayment cannot be negative");
  if (directMaterialsCost < 0) throw new Error("directMaterialsCost cannot be negative");
  if (directMaterialsCost > chainPayment) {
    throw new Error("directMaterialsCost cannot exceed the chain payment");
  }

  const deemedDirectPayment = round2(chainPayment - directMaterialsCost);
  const employerNicOnPayment = round2(
    Math.max(0, deemedDirectPayment - rates.employerNicSecondaryThreshold) * rates.employerNicRate,
  );
  const totalCostToFeePayer = round2(deemedDirectPayment + employerNicOnPayment);

  const lineItems: Ir35Chapter10LineItem[] = [
    { label: "Chain payment (fee excluding VAT)", amount: round2(chainPayment) },
    { label: "Deduct direct cost of materials", amount: -round2(directMaterialsCost) },
    { label: "Deemed direct payment (subject to PAYE Income Tax and employee NIC)", amount: deemedDirectPayment },
    {
      label: `Employer NIC on the payment @ ${(rates.employerNicRate * 100).toFixed(0)}% (borne by the fee-payer, on top — not deducted from the worker's payment)`,
      amount: employerNicOnPayment,
      rate: rates.employerNicRate,
    },
    { label: "Total cost to fee-payer", amount: totalCostToFeePayer },
  ];

  return {
    chainPayment: round2(chainPayment),
    deemedDirectPayment,
    employerNicOnPayment,
    totalCostToFeePayer,
    lineItems,
  };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

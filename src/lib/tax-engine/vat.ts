export type VatRateTableValues = {
  standardRate: number;
  reducedRate: number;
  zeroRate: number;
};

export type VatLineItem = {
  label: string;
  amount: number;
  rate?: number;
};

export type VatResult = {
  standardRatedSales: number;
  reducedRatedSales: number;
  zeroRatedSales: number;
  inputVat: number;
  outputVat: number;
  netVatDue: number;
  lineItems: VatLineItem[];
};

/**
 * Deterministic VAT computation for one return period, per VATA 1994. Net
 * VAT due is output tax (VAT charged on sales, split by rate) minus input
 * tax (VAT already paid on purchases/expenses, assumed fully recoverable —
 * this v1 doesn't model partial exemption or the flat rate scheme). A
 * negative result means a repayment is due from HMRC rather than tax
 * owed.
 */
export function computeVat(
  standardRatedSales: number,
  reducedRatedSales: number,
  zeroRatedSales: number,
  inputVat: number,
  rates: VatRateTableValues,
): VatResult {
  if (standardRatedSales < 0) throw new Error("standardRatedSales cannot be negative");
  if (reducedRatedSales < 0) throw new Error("reducedRatedSales cannot be negative");
  if (zeroRatedSales < 0) throw new Error("zeroRatedSales cannot be negative");
  if (inputVat < 0) throw new Error("inputVat cannot be negative");

  const standardOutputVat = round2(standardRatedSales * rates.standardRate);
  const reducedOutputVat = round2(reducedRatedSales * rates.reducedRate);
  const zeroOutputVat = round2(zeroRatedSales * rates.zeroRate);
  const outputVat = round2(standardOutputVat + reducedOutputVat + zeroOutputVat);

  const netVatDue = round2(outputVat - inputVat);

  const lineItems: VatLineItem[] = [
    {
      label: `Output VAT on standard-rated sales @ ${(rates.standardRate * 100).toFixed(0)}%`,
      amount: standardOutputVat,
      rate: rates.standardRate,
    },
    {
      label: `Output VAT on reduced-rated sales @ ${(rates.reducedRate * 100).toFixed(0)}%`,
      amount: reducedOutputVat,
      rate: rates.reducedRate,
    },
    {
      label: `Output VAT on zero-rated sales @ ${(rates.zeroRate * 100).toFixed(0)}%`,
      amount: zeroOutputVat,
      rate: rates.zeroRate,
    },
    { label: "Total output VAT", amount: outputVat },
    { label: "Input VAT reclaimable", amount: -round2(inputVat) },
    {
      label: netVatDue >= 0 ? "Net VAT due to HMRC" : "Net VAT repayable by HMRC",
      amount: netVatDue,
    },
  ];

  return {
    standardRatedSales: round2(standardRatedSales),
    reducedRatedSales: round2(reducedRatedSales),
    zeroRatedSales: round2(zeroRatedSales),
    inputVat: round2(inputVat),
    outputVat,
    netVatDue,
    lineItems,
  };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

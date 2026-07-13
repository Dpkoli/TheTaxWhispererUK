export type CapitalGainsTaxRateTableValues = {
  annualExemptAmount: number;
  basicRate: number;
  higherRate: number;
};

export type CapitalGainsTaxLineItem = {
  label: string;
  amount: number;
  rate?: number;
};

export type CapitalGainsTaxResult = {
  totalGains: number;
  annualExemptAmount: number;
  taxableGains: number;
  unusedBasicRateBand: number;
  lineItems: CapitalGainsTaxLineItem[];
  totalTax: number;
  effectiveRate: number;
};

/**
 * Deterministic Capital Gains Tax computation for an individual, per TCGA
 * 1992 s.1K (annual exempt amount) and s.4 (rate mechanism). Which rate
 * applies depends on how much of the individual's Income Tax basic rate
 * band is left unused by their other taxable income (TCGA 1992 s.4(4)) —
 * the caller supplies that as `unusedBasicRateBand` rather than this
 * function re-deriving it from raw income, keeping this a pure function of
 * gains + one already-known figure.
 */
export function computeCapitalGainsTax(
  totalGains: number,
  unusedBasicRateBand: number,
  rates: CapitalGainsTaxRateTableValues,
): CapitalGainsTaxResult {
  if (totalGains < 0) throw new Error("totalGains cannot be negative");
  if (unusedBasicRateBand < 0) throw new Error("unusedBasicRateBand cannot be negative");

  const annualExemptAmount = Math.min(totalGains, rates.annualExemptAmount);
  const taxableGains = round2(totalGains - annualExemptAmount);

  const lineItems: CapitalGainsTaxLineItem[] = [
    { label: "Total chargeable gains", amount: round2(totalGains) },
    { label: "Annual exempt amount", amount: -round2(annualExemptAmount) },
    { label: "Taxable gains", amount: taxableGains },
  ];

  const basicRateAmount = Math.min(taxableGains, unusedBasicRateBand);
  const higherRateAmount = round2(taxableGains - basicRateAmount);

  const basicRateTax = round2(basicRateAmount * rates.basicRate);
  const higherRateTax = round2(higherRateAmount * rates.higherRate);

  if (basicRateAmount > 0) {
    lineItems.push({
      label: `Within unused basic rate band @ ${(rates.basicRate * 100).toFixed(0)}%`,
      amount: basicRateTax,
      rate: rates.basicRate,
    });
  }
  if (higherRateAmount > 0) {
    lineItems.push({
      label: `Above unused basic rate band @ ${(rates.higherRate * 100).toFixed(0)}%`,
      amount: higherRateTax,
      rate: rates.higherRate,
    });
  }

  const totalTax = round2(basicRateTax + higherRateTax);
  lineItems.push({ label: "Total Capital Gains Tax due", amount: totalTax });

  return {
    totalGains: round2(totalGains),
    annualExemptAmount: round2(annualExemptAmount),
    taxableGains,
    unusedBasicRateBand: round2(unusedBasicRateBand),
    lineItems,
    totalTax,
    effectiveRate: totalGains > 0 ? round4(totalTax / totalGains) : 0,
  };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function round4(value: number) {
  return Math.round(value * 10000) / 10000;
}

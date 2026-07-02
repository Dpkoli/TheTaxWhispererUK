export type IncomeTaxBand = {
  label: string;
  /** Cumulative ceiling of taxable income (after personal allowance) this band covers, or null for no ceiling. */
  upTo: number | null;
  rate: number;
};

export type IncomeTaxRateTableValues = {
  personalAllowance: number;
  personalAllowanceTaperThreshold: number;
  personalAllowanceTaperRate: number;
  bands: IncomeTaxBand[];
};

export type IncomeTaxLineItem = {
  label: string;
  amount: number;
  rate?: number;
};

export type IncomeTaxResult = {
  taxableIncome: number;
  personalAllowance: number;
  incomeAfterAllowance: number;
  lineItems: IncomeTaxLineItem[];
  totalTax: number;
  effectiveRate: number;
};

/**
 * Deterministic Income Tax computation for non-savings, non-dividend income only.
 * `taxableIncome` is treated as adjusted net income for the personal allowance
 * taper (ITA 2007 s.35/s.58) — this simplified v1 does not itself model pension
 * contributions or Gift Aid reducing adjusted net income; a caller should pass
 * an already-adjusted figure if those apply.
 */
export function computeIncomeTax(
  taxableIncome: number,
  rates: IncomeTaxRateTableValues,
): IncomeTaxResult {
  if (taxableIncome < 0) {
    throw new Error("taxableIncome cannot be negative");
  }

  const excessOverTaper = Math.max(
    0,
    taxableIncome - rates.personalAllowanceTaperThreshold,
  );
  const taperReduction = Math.min(
    rates.personalAllowance,
    excessOverTaper * rates.personalAllowanceTaperRate,
  );
  const personalAllowance = round2(rates.personalAllowance - taperReduction);

  const incomeAfterAllowance = Math.max(0, taxableIncome - personalAllowance);

  const lineItems: IncomeTaxLineItem[] = [
    { label: "Taxable income (adjusted net income)", amount: round2(taxableIncome) },
    { label: "Personal allowance", amount: -personalAllowance },
    { label: "Income after allowance", amount: round2(incomeAfterAllowance) },
  ];

  let remaining = incomeAfterAllowance;
  let previousCeiling = 0;
  let totalTax = 0;

  for (const band of rates.bands) {
    if (remaining <= 0) break;
    const bandCeiling = band.upTo ?? Infinity;
    const bandWidth = bandCeiling - previousCeiling;
    const amountInBand = Math.min(remaining, bandWidth);
    if (amountInBand > 0) {
      const taxForBand = round2(amountInBand * band.rate);
      lineItems.push({
        label: `${band.label} @ ${(band.rate * 100).toFixed(0)}%`,
        amount: taxForBand,
        rate: band.rate,
      });
      totalTax = round2(totalTax + taxForBand);
      remaining = round2(remaining - amountInBand);
    }
    previousCeiling = bandCeiling;
  }

  lineItems.push({ label: "Total Income Tax due", amount: totalTax });

  return {
    taxableIncome: round2(taxableIncome),
    personalAllowance,
    incomeAfterAllowance: round2(incomeAfterAllowance),
    lineItems,
    totalTax,
    effectiveRate: taxableIncome > 0 ? round4(totalTax / taxableIncome) : 0,
  };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function round4(value: number) {
  return Math.round(value * 10000) / 10000;
}

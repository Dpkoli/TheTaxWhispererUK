export type CorporationTaxRateTableValues = {
  smallProfitsRate: number;
  smallProfitsLimit: number;
  mainRate: number;
  mainRateThreshold: number;
  marginalReliefFraction: number;
};

export type CorporationTaxLineItem = {
  label: string;
  amount: number;
  rate?: number;
};

export type CorporationTaxResult = {
  profits: number;
  taxAtMainRate: number;
  marginalRelief: number;
  totalTax: number;
  effectiveRate: number;
  lineItems: CorporationTaxLineItem[];
};

/**
 * Deterministic Corporation Tax computation for a single company with no
 * associated companies and no augmented profits beyond its own taxable
 * profits (so the "N" figure in HMRC's marginal relief formula equals
 * profits) — the standard simplified case. Profits at or below the small
 * profits limit pay the small profits rate; above the main rate threshold
 * they pay the main rate; between the two, the main rate applies with
 * marginal relief clawing the rate back down toward the small profits
 * rate, per the standard HMRC formula: (Upper Limit − Profits) x (N /
 * Profits) x Marginal Relief Fraction.
 */
export function computeCorporationTax(
  profits: number,
  rates: CorporationTaxRateTableValues,
): CorporationTaxResult {
  if (profits < 0) throw new Error("profits cannot be negative");

  const taxAtMainRate = round2(profits * rates.mainRate);

  let marginalRelief = 0;
  if (profits > rates.smallProfitsLimit && profits < rates.mainRateThreshold) {
    marginalRelief = round2(
      (rates.mainRateThreshold - profits) * rates.marginalReliefFraction,
    );
  }

  const totalTax =
    profits <= rates.smallProfitsLimit
      ? round2(profits * rates.smallProfitsRate)
      : round2(taxAtMainRate - marginalRelief);

  const lineItems: CorporationTaxLineItem[] = [
    { label: "Taxable profits", amount: round2(profits) },
  ];

  if (profits <= rates.smallProfitsLimit) {
    lineItems.push({
      label: `Small profits rate @ ${(rates.smallProfitsRate * 100).toFixed(0)}%`,
      amount: totalTax,
      rate: rates.smallProfitsRate,
    });
  } else {
    lineItems.push({
      label: `Tax at main rate @ ${(rates.mainRate * 100).toFixed(0)}%`,
      amount: taxAtMainRate,
      rate: rates.mainRate,
    });
    if (marginalRelief > 0) {
      lineItems.push({ label: "Marginal relief", amount: -marginalRelief });
    }
  }

  lineItems.push({ label: "Total Corporation Tax due", amount: totalTax });

  return {
    profits: round2(profits),
    taxAtMainRate,
    marginalRelief,
    totalTax,
    effectiveRate: profits > 0 ? round4(totalTax / profits) : 0,
    lineItems,
  };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function round4(value: number) {
  return Math.round(value * 10000) / 10000;
}

export type NationalInsuranceRateTableValues = {
  primaryThreshold: number;
  upperEarningsLimit: number;
  mainRate: number;
  additionalRate: number;
};

export type NationalInsuranceLineItem = {
  label: string;
  amount: number;
  rate?: number;
};

export type NationalInsuranceResult = {
  annualEarnings: number;
  lineItems: NationalInsuranceLineItem[];
  totalContributions: number;
  effectiveRate: number;
};

export type NationalInsuranceLabels = {
  earningsLabel: string;
  thresholdName: string;
  upperLimitName: string;
  totalLabel: string;
};

const CLASS_1_LABELS: NationalInsuranceLabels = {
  earningsLabel: "Annual earnings (this employment)",
  thresholdName: "Primary Threshold",
  upperLimitName: "Upper Earnings Limit",
  totalLabel: "Total Class 1 (employee) NI due",
};

/**
 * Deterministic Class 1 employee (primary) National Insurance computation
 * for a single employment, per SSCBA 1992 s.6. Treats the input as annual
 * earnings for that one employment — it does not aggregate earnings across
 * multiple concurrent jobs, which SSCBA 1992 s.6(1) says are calculated
 * separately unless the earner is a "director" or aggregation regulations
 * apply.
 *
 * The band mechanism (threshold, main rate, additional rate above an
 * upper limit) is shared with Class 4 self-employed NI (SSCBA 1992 s.15)
 * — pass `labels` to reuse this engine with Class 4's own terminology
 * instead of duplicating the arithmetic.
 */
export function computeClass1Nic(
  annualEarnings: number,
  rates: NationalInsuranceRateTableValues,
  labels: NationalInsuranceLabels = CLASS_1_LABELS,
): NationalInsuranceResult {
  if (annualEarnings < 0) {
    throw new Error("annualEarnings cannot be negative");
  }

  const lineItems: NationalInsuranceLineItem[] = [
    { label: labels.earningsLabel, amount: round2(annualEarnings) },
  ];

  const mainBandEarnings = Math.max(
    0,
    Math.min(annualEarnings, rates.upperEarningsLimit) - rates.primaryThreshold,
  );
  const mainContribution = round2(mainBandEarnings * rates.mainRate);
  if (mainBandEarnings > 0) {
    lineItems.push({
      label: `${labels.thresholdName} to ${labels.upperLimitName} @ ${(rates.mainRate * 100).toFixed(0)}%`,
      amount: mainContribution,
      rate: rates.mainRate,
    });
  }

  const additionalBandEarnings = Math.max(0, annualEarnings - rates.upperEarningsLimit);
  const additionalContribution = round2(additionalBandEarnings * rates.additionalRate);
  if (additionalBandEarnings > 0) {
    lineItems.push({
      label: `Above ${labels.upperLimitName} @ ${(rates.additionalRate * 100).toFixed(0)}%`,
      amount: additionalContribution,
      rate: rates.additionalRate,
    });
  }

  const totalContributions = round2(mainContribution + additionalContribution);
  lineItems.push({ label: labels.totalLabel, amount: totalContributions });

  return {
    annualEarnings: round2(annualEarnings),
    lineItems,
    totalContributions,
    effectiveRate: annualEarnings > 0 ? round4(totalContributions / annualEarnings) : 0,
  };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function round4(value: number) {
  return Math.round(value * 10000) / 10000;
}

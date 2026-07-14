export type Class2Class3RateTableValues = {
  smallProfitsThreshold: number;
  class2WeeklyRate: number;
  class3WeeklyRate: number;
};

export type Class2Class3LineItem = {
  label: string;
  amount: number;
};

export type Class2Class3Result = {
  annualProfits: number;
  weeks: number;
  isAutomaticallyCredited: boolean;
  class2VoluntaryCost: number;
  class3VoluntaryCost: number;
  lineItems: Class2Class3LineItem[];
};

/**
 * Deterministic Class 2/Class 3 National Insurance position, per SSCBA
 * 1992 s.11A (Class 2, as amended by the National Insurance Contributions
 * (Increase of Thresholds) Act 2024, which removed the compulsory
 * liability from 6 April 2024) and s.13 (Class 3, voluntary). Since April
 * 2024 nobody pays Class 2 compulsorily: self-employed profits at or
 * above the Small Profits Threshold get National Insurance credits
 * automatically at no cost, and profits below it can optionally pay the
 * (cheaper) Class 2 voluntary rate to secure a qualifying year — Class 3
 * is the more expensive fallback available to anyone topping up gaps.
 */
export function computeClass2Class3Position(
  annualProfits: number,
  weeks: number,
  rates: Class2Class3RateTableValues,
): Class2Class3Result {
  if (annualProfits < 0) throw new Error("annualProfits cannot be negative");
  if (weeks <= 0) throw new Error("weeks must be greater than zero");

  const isAutomaticallyCredited = annualProfits >= rates.smallProfitsThreshold;
  const class2VoluntaryCost = round2(weeks * rates.class2WeeklyRate);
  const class3VoluntaryCost = round2(weeks * rates.class3WeeklyRate);

  const lineItems: Class2Class3LineItem[] = [
    { label: "Annual self-employment profits", amount: round2(annualProfits) },
    {
      label: isAutomaticallyCredited
        ? "At or above the Small Profits Threshold — credited automatically, no payment due"
        : "Below the Small Profits Threshold — no compulsory payment either way",
      amount: 0,
    },
    { label: `Cost of paying Class 2 voluntarily (${weeks} weeks)`, amount: class2VoluntaryCost },
    { label: `Cost of paying Class 3 voluntarily (${weeks} weeks)`, amount: class3VoluntaryCost },
  ];

  return {
    annualProfits: round2(annualProfits),
    weeks,
    isAutomaticallyCredited,
    class2VoluntaryCost,
    class3VoluntaryCost,
    lineItems,
  };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

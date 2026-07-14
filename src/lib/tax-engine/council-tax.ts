export type CouncilTaxBand = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";

export type CouncilTaxEmptyPremiumBand = {
  minMonths: number;
  premiumPercent: number;
};

export type CouncilTaxRateTableValues = {
  bandRatios: Record<CouncilTaxBand, number>;
  singlePersonDiscountPercent: number;
  emptyPropertyPremiumBands: CouncilTaxEmptyPremiumBand[];
};

export type CouncilTaxLineItem = {
  label: string;
  amount: number;
  rate?: number;
};

export type CouncilTaxOptions = {
  isSinglePersonDiscount?: boolean;
  emptyUnfurnishedMonths?: number;
};

export type CouncilTaxResult = {
  band: CouncilTaxBand;
  bandDCharge: number;
  ratio: number;
  singlePersonDiscountAmount: number;
  emptyPropertyPremiumAmount: number;
  emptyPropertyPremiumPercent: number;
  annualCharge: number;
  lineItems: CouncilTaxLineItem[];
};

/**
 * Deterministic Council Tax computation, per Local Government Finance Act
 * 1992, Schedule 1 (band ratios, statutory and fixed nationally) and s.30
 * (calculation of the charge for each band as a proportion of the Band D
 * amount). The Band D charge itself is set annually by each individual
 * billing authority — there is no single national figure — so the caller
 * supplies it directly rather than this engine assuming one.
 *
 * Also applies the single-person discount (LGFA 1992 s.11(1)(a) — 25% off
 * for a sole adult resident) and the long-term empty homes premium (LGFA
 * 1992 s.11B, as amended by the Levelling-up and Regeneration Act 2023) —
 * both discretionary for the billing authority to apply, modelled here at
 * the statutory maximum.
 */
export function computeCouncilTax(
  band: CouncilTaxBand,
  bandDCharge: number,
  rates: CouncilTaxRateTableValues,
  options: CouncilTaxOptions = {},
): CouncilTaxResult {
  if (bandDCharge < 0) throw new Error("bandDCharge cannot be negative");
  const emptyMonths = options.emptyUnfurnishedMonths ?? 0;
  if (emptyMonths < 0) throw new Error("emptyUnfurnishedMonths cannot be negative");

  const ratio = rates.bandRatios[band];
  const baseCharge = round2(bandDCharge * ratio);

  const lineItems: CouncilTaxLineItem[] = [
    { label: `Band D charge (as set by your billing authority)`, amount: round2(bandDCharge) },
    {
      label: `Band ${band} ratio (${ratio.toFixed(3)} of Band D)`,
      amount: baseCharge,
      rate: ratio,
    },
  ];

  let singlePersonDiscountAmount = 0;
  if (options.isSinglePersonDiscount) {
    singlePersonDiscountAmount = round2(baseCharge * (rates.singlePersonDiscountPercent / 100));
    lineItems.push({
      label: `Single person discount (${rates.singlePersonDiscountPercent}%)`,
      amount: -singlePersonDiscountAmount,
    });
  }

  const afterDiscount = round2(baseCharge - singlePersonDiscountAmount);

  let emptyPropertyPremiumPercent = 0;
  for (const premiumBand of rates.emptyPropertyPremiumBands) {
    if (emptyMonths >= premiumBand.minMonths) {
      emptyPropertyPremiumPercent = premiumBand.premiumPercent;
    }
  }

  let emptyPropertyPremiumAmount = 0;
  if (emptyPropertyPremiumPercent > 0) {
    emptyPropertyPremiumAmount = round2(afterDiscount * (emptyPropertyPremiumPercent / 100));
    lineItems.push({
      label: `Empty homes premium (${emptyPropertyPremiumPercent}%, empty ${emptyMonths} months)`,
      amount: emptyPropertyPremiumAmount,
      rate: emptyPropertyPremiumPercent / 100,
    });
  }

  const annualCharge = round2(afterDiscount + emptyPropertyPremiumAmount);
  lineItems.push({ label: "Total annual Council Tax", amount: annualCharge });

  return {
    band,
    bandDCharge: round2(bandDCharge),
    ratio,
    singlePersonDiscountAmount,
    emptyPropertyPremiumAmount,
    emptyPropertyPremiumPercent,
    annualCharge,
    lineItems,
  };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

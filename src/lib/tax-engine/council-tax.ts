export type CouncilTaxBand = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";

export type CouncilTaxRateTableValues = {
  bandRatios: Record<CouncilTaxBand, number>;
};

export type CouncilTaxLineItem = {
  label: string;
  amount: number;
  rate?: number;
};

export type CouncilTaxResult = {
  band: CouncilTaxBand;
  bandDCharge: number;
  ratio: number;
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
 */
export function computeCouncilTax(
  band: CouncilTaxBand,
  bandDCharge: number,
  rates: CouncilTaxRateTableValues,
): CouncilTaxResult {
  if (bandDCharge < 0) throw new Error("bandDCharge cannot be negative");

  const ratio = rates.bandRatios[band];
  const annualCharge = round2(bandDCharge * ratio);

  const lineItems: CouncilTaxLineItem[] = [
    { label: `Band D charge (as set by your billing authority)`, amount: round2(bandDCharge) },
    {
      label: `Band ${band} ratio (${ratio.toFixed(3)} of Band D)`,
      amount: annualCharge,
      rate: ratio,
    },
    { label: "Total annual Council Tax", amount: annualCharge },
  ];

  return { band, bandDCharge: round2(bandDCharge), ratio, annualCharge, lineItems };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

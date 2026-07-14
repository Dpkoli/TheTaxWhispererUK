export type InheritanceTaxRateTableValues = {
  nilRateBand: number;
  residenceNilRateBand: number;
  residenceTaperThreshold: number;
  rate: number;
};

export type InheritanceTaxLineItem = {
  label: string;
  amount: number;
  rate?: number;
};

export type InheritanceTaxResult = {
  netEstateValue: number;
  nilRateBandAvailable: number;
  residenceNilRateBandAvailable: number;
  totalNilRateBand: number;
  taxableEstate: number;
  lineItems: InheritanceTaxLineItem[];
  totalTax: number;
  effectiveRate: number;
};

/**
 * Deterministic Inheritance Tax computation, per IHTA 1984 s.7 (40% rate on
 * the chargeable excess) and s.8D-8M (residence nil-rate band, inserted by
 * Finance (No. 2) Act 2015). Covers the standard nil-rate band, the
 * residence nil-rate band (capped at the value of the qualifying residence
 * passing to direct descendants, and tapered by £1 for every £2 the estate
 * exceeds the taper threshold), and a transferable percentage of unused
 * band from a predeceased spouse/civil partner (IHTA 1984 s.8A applies the
 * same transfer mechanism to both the nil-rate band and residence
 * nil-rate band).
 */
export function computeInheritanceTax(
  netEstateValue: number,
  residenceValuePassingToDescendants: number,
  transferableNilRateBandPercent: number,
  rates: InheritanceTaxRateTableValues,
): InheritanceTaxResult {
  if (netEstateValue < 0) throw new Error("netEstateValue cannot be negative");
  if (residenceValuePassingToDescendants < 0) {
    throw new Error("residenceValuePassingToDescendants cannot be negative");
  }
  if (transferableNilRateBandPercent < 0 || transferableNilRateBandPercent > 100) {
    throw new Error("transferableNilRateBandPercent must be between 0 and 100");
  }

  const ownResidenceNilRateBand = Math.min(
    residenceValuePassingToDescendants,
    rates.residenceNilRateBand,
  );

  const taperExcess = Math.max(0, netEstateValue - rates.residenceTaperThreshold);
  const taperReduction = Math.min(ownResidenceNilRateBand, taperExcess / 2);
  const residenceNilRateBandAfterTaper = round2(ownResidenceNilRateBand - taperReduction);

  const transferMultiplier = 1 + transferableNilRateBandPercent / 100;
  const nilRateBandAvailable = round2(rates.nilRateBand * transferMultiplier);
  const residenceNilRateBandAvailable = round2(residenceNilRateBandAfterTaper * transferMultiplier);
  const totalNilRateBand = round2(nilRateBandAvailable + residenceNilRateBandAvailable);

  const taxableEstate = round2(Math.max(0, netEstateValue - totalNilRateBand));
  const totalTax = round2(taxableEstate * rates.rate);

  const lineItems: InheritanceTaxLineItem[] = [
    { label: "Net estate value", amount: round2(netEstateValue) },
    { label: "Nil-rate band available", amount: -nilRateBandAvailable },
    { label: "Residence nil-rate band available", amount: -residenceNilRateBandAvailable },
    { label: "Taxable estate", amount: taxableEstate },
    {
      label: `Inheritance Tax @ ${(rates.rate * 100).toFixed(0)}%`,
      amount: totalTax,
      rate: rates.rate,
    },
    { label: "Total Inheritance Tax due", amount: totalTax },
  ];

  return {
    netEstateValue: round2(netEstateValue),
    nilRateBandAvailable,
    residenceNilRateBandAvailable,
    totalNilRateBand,
    taxableEstate,
    lineItems,
    totalTax,
    effectiveRate: netEstateValue > 0 ? round4(totalTax / netEstateValue) : 0,
  };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function round4(value: number) {
  return Math.round(value * 10000) / 10000;
}

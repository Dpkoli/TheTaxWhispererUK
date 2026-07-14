export type SdltBand = {
  label: string;
  upTo: number | null;
  rate: number;
};

export type SdltRateTableValues = {
  standardBands: SdltBand[];
  firstTimeBuyerBands: SdltBand[];
  firstTimeBuyerReliefCeiling: number;
};

export type SdltLineItem = {
  label: string;
  amount: number;
  rate?: number;
};

export type SdltResult = {
  purchasePrice: number;
  isFirstTimeBuyer: boolean;
  lineItems: SdltLineItem[];
  totalTax: number;
  effectiveRate: number;
};

/**
 * Deterministic Stamp Duty Land Tax computation for a residential property
 * purchase in England/Northern Ireland, per Finance Act 2003 s.55 and
 * Schedule 4ZA/5 (as amended). First-time buyer relief (Sch. 6ZA) applies
 * the first-time-buyer band structure instead of the standard one, but
 * only up to the relief ceiling — above that price the buyer gets no
 * relief and standard bands apply to the whole price.
 */
export function computeSdlt(
  purchasePrice: number,
  isFirstTimeBuyer: boolean,
  rates: SdltRateTableValues,
): SdltResult {
  if (purchasePrice < 0) throw new Error("purchasePrice cannot be negative");

  const useFirstTimeBuyerBands =
    isFirstTimeBuyer && purchasePrice <= rates.firstTimeBuyerReliefCeiling;
  const bands = useFirstTimeBuyerBands ? rates.firstTimeBuyerBands : rates.standardBands;

  const lineItems: SdltLineItem[] = [
    { label: "Purchase price", amount: round2(purchasePrice) },
  ];

  if (isFirstTimeBuyer && !useFirstTimeBuyerBands) {
    lineItems.push({
      label: `No first-time buyer relief above ${rates.firstTimeBuyerReliefCeiling} — standard bands apply`,
      amount: 0,
    });
  }

  let remaining = purchasePrice;
  let previousCeiling = 0;
  let totalTax = 0;

  for (const band of bands) {
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

  lineItems.push({ label: "Total Stamp Duty Land Tax due", amount: totalTax });

  return {
    purchasePrice: round2(purchasePrice),
    isFirstTimeBuyer: useFirstTimeBuyerBands,
    lineItems,
    totalTax,
    effectiveRate: purchasePrice > 0 ? round4(totalTax / purchasePrice) : 0,
  };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function round4(value: number) {
  return Math.round(value * 10000) / 10000;
}

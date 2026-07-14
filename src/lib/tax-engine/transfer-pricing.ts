export type TransferPricingRateTableValues = {
  corporationTaxRate: number;
};

export type TransferPricingTransactionType = "sale" | "purchase";

export type TransferPricingLineItem = {
  label: string;
  amount: number;
  rate?: number;
};

export type TransferPricingResult = {
  actualPrice: number;
  armsLengthLow: number;
  armsLengthHigh: number;
  transactionType: TransferPricingTransactionType;
  withinRange: boolean;
  profitAdjustment: number;
  additionalTax: number;
  lineItems: TransferPricingLineItem[];
};

/**
 * TIOPA 2010 s.147 basic transfer pricing rule, one-way adjustment only:
 * UK domestic self-assessment can only be adjusted to INCREASE taxable
 * profits (or reduce a loss) toward the arm's length range, never to
 * reduce profits below what was actually returned. For a sale, an actual
 * price below the arm's-length range understates UK profit; for a
 * purchase, an actual price above the arm's-length range (i.e. an
 * overstated cost) understates UK profit. Prices already inside, or
 * outside in the taxpayer-unfavourable direction, need no adjustment.
 */
export function computeTransferPricing(
  actualPrice: number,
  armsLengthLow: number,
  armsLengthHigh: number,
  transactionType: TransferPricingTransactionType,
  rates: TransferPricingRateTableValues,
): TransferPricingResult {
  if (actualPrice < 0) throw new Error("actualPrice cannot be negative");
  if (armsLengthLow < 0) throw new Error("armsLengthLow cannot be negative");
  if (armsLengthHigh < armsLengthLow) {
    throw new Error("armsLengthHigh cannot be less than armsLengthLow");
  }

  let profitAdjustment = 0;
  if (transactionType === "sale") {
    if (actualPrice < armsLengthLow) {
      profitAdjustment = round2(armsLengthLow - actualPrice);
    }
  } else {
    if (actualPrice > armsLengthHigh) {
      profitAdjustment = round2(actualPrice - armsLengthHigh);
    }
  }

  const withinRange = profitAdjustment === 0;
  const additionalTax = round2(profitAdjustment * rates.corporationTaxRate);

  const lineItems: TransferPricingLineItem[] = [
    { label: "Actual transaction price", amount: round2(actualPrice) },
    { label: "Arm's-length range (low)", amount: round2(armsLengthLow) },
    { label: "Arm's-length range (high)", amount: round2(armsLengthHigh) },
    {
      label: withinRange
        ? "Within arm's-length range — no adjustment required"
        : "Transfer pricing profit adjustment (TIOPA 2010 s.147)",
      amount: profitAdjustment,
    },
    {
      label: `Additional Corporation Tax on adjustment @ ${(rates.corporationTaxRate * 100).toFixed(0)}%`,
      amount: additionalTax,
      rate: rates.corporationTaxRate,
    },
  ];

  return {
    actualPrice: round2(actualPrice),
    armsLengthLow: round2(armsLengthLow),
    armsLengthHigh: round2(armsLengthHigh),
    transactionType,
    withinRange,
    profitAdjustment,
    additionalTax,
    lineItems,
  };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export type BusinessRatesRateTableValues = {
  smallBusinessMultiplier: number;
  smallBusinessRhlMultiplier: number;
  standardMultiplier: number;
  standardRhlMultiplier: number;
  smallBusinessThreshold: number;
  smallBusinessRateReliefFullThreshold: number;
  smallBusinessRateReliefTaperCeiling: number;
};

export type BusinessRatesLineItem = {
  label: string;
  amount: number;
  rate?: number;
};

export type BusinessRatesResult = {
  rateableValue: number;
  multiplierUsed: number;
  grossBill: number;
  reliefPercent: number;
  reliefAmount: number;
  netBill: number;
  lineItems: BusinessRatesLineItem[];
};

/**
 * Deterministic Business Rates (non-domestic rates) computation for
 * England. The multiplier depends on rateable value and whether the
 * property is retail/hospitality/leisure (RHL); Small Business Rate
 * Relief then gives 100% relief at or below the full-relief threshold,
 * tapering linearly to 0% at the taper ceiling.
 */
export function computeBusinessRates(
  rateableValue: number,
  isRetailHospitalityLeisure: boolean,
  rates: BusinessRatesRateTableValues,
): BusinessRatesResult {
  if (rateableValue < 0) throw new Error("rateableValue cannot be negative");

  const isSmallBusiness = rateableValue < rates.smallBusinessThreshold;
  const multiplierUsed = isSmallBusiness
    ? isRetailHospitalityLeisure
      ? rates.smallBusinessRhlMultiplier
      : rates.smallBusinessMultiplier
    : isRetailHospitalityLeisure
      ? rates.standardRhlMultiplier
      : rates.standardMultiplier;

  const grossBill = round2(rateableValue * multiplierUsed);

  let reliefPercent = 0;
  if (rateableValue <= rates.smallBusinessRateReliefFullThreshold) {
    reliefPercent = 100;
  } else if (rateableValue < rates.smallBusinessRateReliefTaperCeiling) {
    const taperRange =
      rates.smallBusinessRateReliefTaperCeiling - rates.smallBusinessRateReliefFullThreshold;
    reliefPercent =
      ((rates.smallBusinessRateReliefTaperCeiling - rateableValue) / taperRange) * 100;
  }

  const reliefAmount = round2(grossBill * (reliefPercent / 100));
  const netBill = round2(grossBill - reliefAmount);

  const lineItems: BusinessRatesLineItem[] = [
    { label: "Rateable value", amount: round2(rateableValue) },
    {
      label: `Gross bill @ ${multiplierUsed.toFixed(3)} multiplier`,
      amount: grossBill,
      rate: multiplierUsed,
    },
  ];

  if (reliefAmount > 0) {
    lineItems.push({
      label: `Small Business Rate Relief (${reliefPercent.toFixed(1)}%)`,
      amount: -reliefAmount,
    });
  }

  lineItems.push({ label: "Total Business Rates due", amount: netBill });

  return {
    rateableValue: round2(rateableValue),
    multiplierUsed,
    grossBill,
    reliefPercent: round2(reliefPercent),
    reliefAmount,
    netBill,
    lineItems,
  };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

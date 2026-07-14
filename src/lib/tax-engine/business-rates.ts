export type BusinessRatesRateTableValues = {
  smallBusinessMultiplier: number;
  smallBusinessRhlMultiplier: number;
  standardMultiplier: number;
  standardRhlMultiplier: number;
  smallBusinessThreshold: number;
  smallBusinessRateReliefFullThreshold: number;
  smallBusinessRateReliefTaperCeiling: number;
  emptyPropertyReliefMonths: number;
  emptyPropertyReliefIndustrialExtraMonths: number;
  emptyPropertyExemptionThreshold: number;
};

export type BusinessRatesLineItem = {
  label: string;
  amount: number;
  rate?: number;
};

export type BusinessRatesOptions = {
  isEmpty?: boolean;
  monthsEmpty?: number;
  isIndustrial?: boolean;
};

export type BusinessRatesResult = {
  rateableValue: number;
  multiplierUsed: number;
  grossBill: number;
  reliefPercent: number;
  reliefAmount: number;
  emptyPropertyReliefApplied: boolean;
  netBill: number;
  lineItems: BusinessRatesLineItem[];
};

/**
 * Deterministic Business Rates (non-domestic rates) computation for
 * England. The multiplier depends on rateable value and whether the
 * property is retail/hospitality/leisure (RHL); Small Business Rate
 * Relief then gives 100% relief at or below the full-relief threshold,
 * tapering linearly to 0% at the taper ceiling.
 *
 * Also applies empty property relief: a full exemption for the first
 * `emptyPropertyReliefMonths` (3 months for most properties, a further
 * `emptyPropertyReliefIndustrialExtraMonths` for industrial premises —
 * 6 months total), and a permanent exemption regardless of duration for
 * properties below `emptyPropertyExemptionThreshold` (£2,900 rateable
 * value). Beyond the relief period, full rates apply to the empty
 * property — Small Business Rate Relief only applies to occupied
 * properties, so is not stacked on top of an empty bill here.
 */
export function computeBusinessRates(
  rateableValue: number,
  isRetailHospitalityLeisure: boolean,
  rates: BusinessRatesRateTableValues,
  options: BusinessRatesOptions = {},
): BusinessRatesResult {
  if (rateableValue < 0) throw new Error("rateableValue cannot be negative");
  const monthsEmpty = options.monthsEmpty ?? 0;
  if (monthsEmpty < 0) throw new Error("monthsEmpty cannot be negative");

  const isSmallBusiness = rateableValue < rates.smallBusinessThreshold;
  const multiplierUsed = isSmallBusiness
    ? isRetailHospitalityLeisure
      ? rates.smallBusinessRhlMultiplier
      : rates.smallBusinessMultiplier
    : isRetailHospitalityLeisure
      ? rates.standardRhlMultiplier
      : rates.standardMultiplier;

  const grossBill = round2(rateableValue * multiplierUsed);

  const lineItems: BusinessRatesLineItem[] = [
    { label: "Rateable value", amount: round2(rateableValue) },
    {
      label: `Gross bill @ ${multiplierUsed.toFixed(3)} multiplier`,
      amount: grossBill,
      rate: multiplierUsed,
    },
  ];

  if (options.isEmpty) {
    const permanentlyExempt = rateableValue < rates.emptyPropertyExemptionThreshold;
    const reliefMonths =
      rates.emptyPropertyReliefMonths +
      (options.isIndustrial ? rates.emptyPropertyReliefIndustrialExtraMonths : 0);
    const emptyPropertyReliefApplied = permanentlyExempt || monthsEmpty < reliefMonths;

    if (permanentlyExempt) {
      lineItems.push({
        label: `Empty property exemption — rateable value below £${rates.emptyPropertyExemptionThreshold.toLocaleString("en-GB")}`,
        amount: -grossBill,
      });
    } else if (emptyPropertyReliefApplied) {
      lineItems.push({
        label: `Empty property relief (within ${reliefMonths}-month exemption period)`,
        amount: -grossBill,
      });
    }

    const netBill = emptyPropertyReliefApplied ? 0 : grossBill;
    lineItems.push({ label: "Total Business Rates due", amount: netBill });

    return {
      rateableValue: round2(rateableValue),
      multiplierUsed,
      grossBill,
      reliefPercent: emptyPropertyReliefApplied ? 100 : 0,
      reliefAmount: emptyPropertyReliefApplied ? grossBill : 0,
      emptyPropertyReliefApplied,
      netBill,
      lineItems,
    };
  }

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
    emptyPropertyReliefApplied: false,
    netBill,
    lineItems,
  };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

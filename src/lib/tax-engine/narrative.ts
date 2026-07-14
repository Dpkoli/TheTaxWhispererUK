import type { IncomeTaxResult } from "./income-tax";
import type { NationalInsuranceResult } from "./national-insurance";
import type { Class4NicResult } from "./national-insurance-class4";
import type { CapitalGainsTaxResult } from "./capital-gains-tax";
import type { InheritanceTaxResult } from "./inheritance-tax";
import type { SdltResult } from "./stamp-duty-land-tax";
import type { CorporationTaxResult } from "./corporation-tax";
import type { VatResult } from "./vat";
import type { CouncilTaxResult } from "./council-tax";
import type { BusinessRatesResult } from "./business-rates";
import type { RdReliefResult } from "./rd-relief";
import type { Ir35Result } from "./ir35-deemed-payment";
import type { Class2Class3Result } from "./nic-class2-class3";

const currency = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

/**
 * Deterministic, template-based write-up of an already-computed result.
 * This is plain string formatting over real numbers the engine produced —
 * not free-form generation — so it carries no arithmetic risk of its own.
 */
export function narrateIncomeTaxResult(result: IncomeTaxResult, taxYear: string) {
  const lines = [
    `On ${currency.format(result.taxableIncome)} of taxable income for ${taxYear}, your Personal Allowance works out to ${currency.format(result.personalAllowance)}.`,
  ];

  if (result.personalAllowance < 12570) {
    lines.push(
      "That's less than the standard £12,570 allowance because your income is above £100,000 — the allowance tapers by £1 for every £2 over that threshold.",
    );
  }

  lines.push(
    `That leaves ${currency.format(result.incomeAfterAllowance)} of income to be taxed across the basic, higher, and additional rate bands, giving a total Income Tax liability of ${currency.format(result.totalTax)} — an effective rate of ${(result.effectiveRate * 100).toFixed(1)}% of your total taxable income.`,
  );

  return lines.join(" ");
}

/**
 * Deterministic, template-based write-up of an already-computed Class 1
 * employee NI result — plain string formatting over real numbers, not
 * free-form generation.
 */
export function narrateClass1NicResult(result: NationalInsuranceResult, taxYear: string) {
  const lines = [
    `On ${currency.format(result.annualEarnings)} of annual earnings from this employment for ${taxYear}, your employee Class 1 National Insurance works out to ${currency.format(result.totalContributions)} — an effective rate of ${(result.effectiveRate * 100).toFixed(1)}% of your earnings.`,
  ];

  lines.push(
    "This treats the figure as earnings from a single employment — it doesn't aggregate NI across multiple concurrent jobs, which HMRC calculates separately in most cases.",
  );

  return lines.join(" ");
}

/**
 * Deterministic, template-based write-up of an already-computed Capital
 * Gains Tax result — plain string formatting over real numbers, not
 * free-form generation.
 */
export function narrateCapitalGainsTaxResult(result: CapitalGainsTaxResult, taxYear: string) {
  const lines = [
    `On ${currency.format(result.totalGains)} of chargeable gains for ${taxYear}, your annual exempt amount covers the first ${currency.format(result.annualExemptAmount)}, leaving ${currency.format(result.taxableGains)} subject to Capital Gains Tax.`,
  ];

  if (result.taxableGains > 0) {
    lines.push(
      `Because you have ${currency.format(result.unusedBasicRateBand)} of unused basic rate band left after your other income, ${currency.format(Math.min(result.taxableGains, result.unusedBasicRateBand))} of the gain is taxed at the basic rate and the rest at the higher rate, giving a total Capital Gains Tax liability of ${currency.format(result.totalTax)}.`,
    );
  }

  return lines.join(" ");
}

/**
 * Deterministic, template-based write-up of an already-computed
 * Inheritance Tax result — plain string formatting over real numbers, not
 * free-form generation.
 */
export function narrateInheritanceTaxResult(result: InheritanceTaxResult) {
  const lines = [
    `Your net estate of ${currency.format(result.netEstateValue)} has ${currency.format(result.totalNilRateBand)} of nil-rate band available (${currency.format(result.nilRateBandAvailable)} standard nil-rate band plus ${currency.format(result.residenceNilRateBandAvailable)} residence nil-rate band), leaving ${currency.format(result.taxableEstate)} chargeable.`,
  ];

  lines.push(
    result.totalTax > 0
      ? `That gives a total Inheritance Tax liability of ${currency.format(result.totalTax)} at the standard 40% rate.`
      : "That means no Inheritance Tax is due on this estate as computed.",
  );

  return lines.join(" ");
}

/**
 * Deterministic, template-based write-up of an already-computed Stamp Duty
 * Land Tax result — plain string formatting over real numbers, not
 * free-form generation.
 */
export function narrateSdltResult(result: SdltResult, taxName = "Stamp Duty Land Tax") {
  const lines = [
    `On a purchase price of ${currency.format(result.purchasePrice)}${result.isFirstTimeBuyer ? ", using first-time buyer relief bands," : ""} the ${taxName} due is ${currency.format(result.totalTax)} — an effective rate of ${(result.effectiveRate * 100).toFixed(1)}% of the purchase price.`,
  ];

  return lines.join(" ");
}

/**
 * Deterministic, template-based write-up of an already-computed Class 4
 * self-employed NI result — plain string formatting over real numbers,
 * not free-form generation.
 */
export function narrateClass4NicResult(result: Class4NicResult, taxYear: string) {
  const lines = [
    `On ${currency.format(result.annualEarnings)} of annual taxable profits for ${taxYear}, your Class 4 self-employed National Insurance works out to ${currency.format(result.totalContributions)} — an effective rate of ${(result.effectiveRate * 100).toFixed(1)}% of your profits.`,
  ];

  return lines.join(" ");
}

/**
 * Deterministic, template-based write-up of an already-computed
 * Corporation Tax result — plain string formatting over real numbers, not
 * free-form generation.
 */
export function narrateCorporationTaxResult(result: CorporationTaxResult, taxYear: string) {
  const lines = [
    `On ${currency.format(result.profits)} of taxable profits for ${taxYear}, your Corporation Tax works out to ${currency.format(result.totalTax)} — an effective rate of ${(result.effectiveRate * 100).toFixed(1)}% of profits.`,
  ];

  if (result.marginalRelief > 0) {
    lines.push(
      `That includes ${currency.format(result.marginalRelief)} of marginal relief, which tapers the rate down from the full main rate toward the small profits rate for profits between the two limits.`,
    );
  }

  return lines.join(" ");
}

/**
 * Deterministic, template-based write-up of an already-computed VAT
 * result — plain string formatting over real numbers, not free-form
 * generation.
 */
export function narrateVatResult(result: VatResult) {
  const lines = [
    `Total output VAT on your sales for the period is ${currency.format(result.outputVat)}, and you have ${currency.format(result.inputVat)} of input VAT to reclaim.`,
  ];

  lines.push(
    result.netVatDue >= 0
      ? `That leaves ${currency.format(result.netVatDue)} due to HMRC for this period.`
      : `That leaves ${currency.format(Math.abs(result.netVatDue))} repayable by HMRC for this period.`,
  );

  return lines.join(" ");
}

/**
 * Deterministic, template-based write-up of an already-computed Council
 * Tax result — plain string formatting over real numbers, not free-form
 * generation.
 */
export function narrateCouncilTaxResult(result: CouncilTaxResult) {
  return `A Band ${result.band} property pays ${result.ratio.toFixed(3)} of the Band D charge. On a Band D charge of ${currency.format(result.bandDCharge)}, that works out to ${currency.format(result.annualCharge)} for the year.`;
}

/**
 * Deterministic, template-based write-up of an already-computed Business
 * Rates result — plain string formatting over real numbers, not
 * free-form generation.
 */
export function narrateBusinessRatesResult(result: BusinessRatesResult) {
  const lines = [
    `On a rateable value of ${currency.format(result.rateableValue)} at a ${result.multiplierUsed.toFixed(3)} multiplier, the gross bill is ${currency.format(result.grossBill)}.`,
  ];

  lines.push(
    result.reliefAmount > 0
      ? `Small Business Rate Relief of ${result.reliefPercent.toFixed(1)}% reduces that by ${currency.format(result.reliefAmount)}, leaving ${currency.format(result.netBill)} due for the year.`
      : `No Small Business Rate Relief applies, leaving the full ${currency.format(result.netBill)} due for the year.`,
  );

  return lines.join(" ");
}

/**
 * Deterministic, template-based write-up of an already-computed R&D tax
 * relief result — plain string formatting over real numbers, not
 * free-form generation.
 */
export function narrateRdReliefResult(result: RdReliefResult) {
  return `On ${currency.format(result.qualifyingExpenditure)} of qualifying R&D expenditure, the R&D Expenditure Credit is ${currency.format(result.grossCredit)}. Because that credit is itself taxable, ${currency.format(result.taxOnCredit)} of Corporation Tax applies to it, leaving a net cash benefit of ${currency.format(result.netCashBenefit)}.`;
}

/**
 * Deterministic, template-based write-up of an already-computed IR35
 * deemed employment payment result — plain string formatting over real
 * numbers, not free-form generation.
 */
export function narrateIr35Result(result: Ir35Result) {
  const lines = [
    `The deemed employment payment works out to ${currency.format(result.deemedPayment)}, with ${currency.format(result.employerNicOnDeemedPayment)} of employer National Insurance due on top of it.`,
  ];

  lines.push(
    "The deemed payment itself is then subject to Income Tax and employee Class 1 National Insurance in the normal way — run it through those calculators separately to get the worker's actual take-home figure.",
  );

  return lines.join(" ");
}

/**
 * Deterministic, template-based write-up of an already-computed Class
 * 2/Class 3 National Insurance position — plain string formatting over
 * real numbers, not free-form generation.
 */
export function narrateClass2Class3Result(result: Class2Class3Result) {
  const lines = [
    result.isAutomaticallyCredited
      ? `On ${currency.format(result.annualProfits)} of annual profits, you're at or above the Small Profits Threshold, so you get a National Insurance credit for this year automatically — no Class 2 payment is required.`
      : `On ${currency.format(result.annualProfits)} of annual profits, you're below the Small Profits Threshold, so no Class 2 payment is compulsory — but paying voluntarily secures a qualifying year toward your State Pension.`,
  ];

  lines.push(
    `Paying voluntary Class 2 for ${result.weeks} weeks would cost ${currency.format(result.class2VoluntaryCost)}; the equivalent Class 3 top-up would cost ${currency.format(result.class3VoluntaryCost)} — Class 2 is the cheaper route wherever you're eligible to use it.`,
  );

  return lines.join(" ");
}

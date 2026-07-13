import type { IncomeTaxResult } from "./income-tax";
import type { NationalInsuranceResult } from "./national-insurance";
import type { CapitalGainsTaxResult } from "./capital-gains-tax";

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

import type { IncomeTaxResult } from "./income-tax";

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

import { describe, expect, it } from "vitest";
import { computeCouncilTax, type CouncilTaxRateTableValues } from "./council-tax";

// Statutory band ratios, Local Government Finance Act 1992 Sch.1 —
// verified against GOV.UK before use. Fixed nationally, not versioned by
// tax year. Single person discount and empty homes premium bands per
// LGFA 1992 s.11(1)(a) and s.11B (as amended by the Levelling-up and
// Regeneration Act 2023, in force from 1 April 2026).
const RATES: CouncilTaxRateTableValues = {
  bandRatios: {
    A: 6 / 9,
    B: 7 / 9,
    C: 8 / 9,
    D: 9 / 9,
    E: 11 / 9,
    F: 13 / 9,
    G: 15 / 9,
    H: 18 / 9,
  },
  singlePersonDiscountPercent: 25,
  emptyPropertyPremiumBands: [
    { minMonths: 12, premiumPercent: 100 },
    { minMonths: 60, premiumPercent: 200 },
    { minMonths: 120, premiumPercent: 300 },
  ],
};

describe("computeCouncilTax", () => {
  it("charges exactly the Band D amount for Band D", () => {
    const result = computeCouncilTax("D", 2000, RATES);
    expect(result.annualCharge).toBe(2000);
  });

  it("charges two-thirds of Band D for Band A", () => {
    const result = computeCouncilTax("A", 2000, RATES);
    expect(result.annualCharge).toBe(1333.33);
  });

  it("charges double Band D for Band H", () => {
    const result = computeCouncilTax("H", 2000, RATES);
    expect(result.annualCharge).toBe(4000);
  });

  it("rejects a negative Band D charge", () => {
    expect(() => computeCouncilTax("D", -1, RATES)).toThrow();
  });

  it("applies a 25% single person discount", () => {
    const result = computeCouncilTax("D", 2000, RATES, { isSinglePersonDiscount: true });
    expect(result.singlePersonDiscountAmount).toBe(500);
    expect(result.annualCharge).toBe(1500);
  });

  it("applies a 100% empty homes premium after 12 months empty", () => {
    const result = computeCouncilTax("D", 2000, RATES, { emptyUnfurnishedMonths: 12 });
    expect(result.emptyPropertyPremiumPercent).toBe(100);
    expect(result.emptyPropertyPremiumAmount).toBe(2000);
    expect(result.annualCharge).toBe(4000);
  });

  it("applies a 300% empty homes premium after 120 months empty", () => {
    const result = computeCouncilTax("D", 2000, RATES, { emptyUnfurnishedMonths: 120 });
    expect(result.emptyPropertyPremiumPercent).toBe(300);
    expect(result.annualCharge).toBe(8000);
  });

  it("applies no premium below 12 months empty", () => {
    const result = computeCouncilTax("D", 2000, RATES, { emptyUnfurnishedMonths: 6 });
    expect(result.emptyPropertyPremiumPercent).toBe(0);
    expect(result.annualCharge).toBe(2000);
  });

  it("stacks the single person discount before the empty homes premium", () => {
    const result = computeCouncilTax("D", 2000, RATES, {
      isSinglePersonDiscount: true,
      emptyUnfurnishedMonths: 12,
    });
    // 2000 - 25% = 1500, then +100% premium = 3000
    expect(result.annualCharge).toBe(3000);
  });
});

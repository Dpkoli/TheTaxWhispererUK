import { describe, expect, it } from "vitest";
import { computeCouncilTax, type CouncilTaxRateTableValues } from "./council-tax";

// Statutory band ratios, Local Government Finance Act 1992 Sch.1 —
// verified against GOV.UK before use. Fixed nationally, not versioned by
// tax year.
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
});

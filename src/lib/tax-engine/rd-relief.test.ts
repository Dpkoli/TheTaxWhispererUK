import { describe, expect, it } from "vitest";
import { computeRdRelief, type RdReliefRateTableValues } from "./rd-relief";

// Merged RDEC scheme rates, verified against GOV.UK before use — see the
// seeded RateTable.
const RATES: RdReliefRateTableValues = {
  creditRate: 0.2,
  corporationTaxRate: 0.25,
};

describe("computeRdRelief — merged RDEC scheme", () => {
  it("gives a 20% gross credit on qualifying expenditure", () => {
    const result = computeRdRelief(100000, RATES);
    expect(result.grossCredit).toBe(20000);
  });

  it("gives a 15% net cash benefit at the 25% main Corporation Tax rate", () => {
    const result = computeRdRelief(100000, RATES);
    // 20,000 credit - 5,000 tax on it (25%) = 15,000 net (15% of expenditure)
    expect(result.taxOnCredit).toBe(5000);
    expect(result.netCashBenefit).toBe(15000);
  });

  it("scales linearly with expenditure", () => {
    const result = computeRdRelief(250000, RATES);
    expect(result.netCashBenefit).toBe(37500);
  });

  it("returns zero benefit for zero expenditure", () => {
    const result = computeRdRelief(0, RATES);
    expect(result.netCashBenefit).toBe(0);
  });

  it("rejects negative expenditure", () => {
    expect(() => computeRdRelief(-1, RATES)).toThrow();
  });
});

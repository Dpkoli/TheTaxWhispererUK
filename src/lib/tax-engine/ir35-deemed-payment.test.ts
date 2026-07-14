import { describe, expect, it } from "vitest";
import {
  computeIr35DeemedPayment,
  type Ir35RateTableValues,
} from "./ir35-deemed-payment";

// 2026-27 UK rates, verified against GOV.UK before use — see the seeded
// RateTable.
const RATES: Ir35RateTableValues = {
  flatRateDeduction: 0.05,
  employerNicRate: 0.15,
  employerNicSecondaryThreshold: 5000,
};

describe("computeIr35DeemedPayment — 2026-27 UK rates", () => {
  it("applies the 5% flat deduction and grosses up employer NIC with no other deductions", () => {
    const result = computeIr35DeemedPayment({ grossFeeIncome: 80000 }, RATES);
    // Step 1: 80,000 * 0.95 = 76,000 (Step 7 result, since steps 2-6 are 0)
    // Step 8: D + (D - 5,000) * 0.15 = 76,000 => D = (76,000 + 750) / 1.15
    expect(result.deemedPayment).toBe(66739.13);
    expect(result.employerNicOnDeemedPayment).toBe(9260.87);
  });

  it("applies situational deductions for pension contributions and salary already taxed", () => {
    const result = computeIr35DeemedPayment(
      {
        grossFeeIncome: 80000,
        pensionContributions: 5000,
        salaryAndBenefitsAlreadyTaxed: 10000,
      },
      RATES,
    );
    // Step 1-4: 76,000; Step 5: 71,000; Step 7: 61,000
    // Step 8: D = (61,000 + 750) / 1.15
    expect(result.deemedPayment).toBe(53695.65);
    expect(result.employerNicOnDeemedPayment).toBe(7304.35);
  });

  it("charges no employer NIC when the step 7 result is below the secondary threshold", () => {
    const result = computeIr35DeemedPayment(
      { grossFeeIncome: 3157.89 }, // step1 ≈ 3,000
      RATES,
    );
    expect(result.employerNicOnDeemedPayment).toBe(0);
    expect(result.deemedPayment).toBeCloseTo(3000, 0);
  });

  it("floors the deemed payment at zero when deductions exceed the fee income", () => {
    const result = computeIr35DeemedPayment(
      { grossFeeIncome: 1000, salaryAndBenefitsAlreadyTaxed: 2000 },
      RATES,
    );
    expect(result.deemedPayment).toBe(0);
    expect(result.employerNicOnDeemedPayment).toBe(0);
  });

  it("rejects negative gross fee income", () => {
    expect(() => computeIr35DeemedPayment({ grossFeeIncome: -1 }, RATES)).toThrow();
  });

  it("rejects a negative optional deduction", () => {
    expect(() =>
      computeIr35DeemedPayment({ grossFeeIncome: 50000, pensionContributions: -1 }, RATES),
    ).toThrow();
  });
});

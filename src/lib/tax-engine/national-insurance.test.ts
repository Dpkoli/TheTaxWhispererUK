import { describe, expect, it } from "vitest";
import { computeClass1Nic, type NationalInsuranceRateTableValues } from "./national-insurance";

// 2026-27 UK rates, verified against GOV.UK "Rates and thresholds for
// employers 2026 to 2027" before use — see the seeded RateTable.
const RATES_2026_27: NationalInsuranceRateTableValues = {
  primaryThreshold: 12570,
  upperEarningsLimit: 50270,
  mainRate: 0.08,
  additionalRate: 0.02,
};

describe("computeClass1Nic — 2026-27 UK rates", () => {
  it("charges nothing at or below the primary threshold", () => {
    const result = computeClass1Nic(12000, RATES_2026_27);
    expect(result.totalContributions).toBe(0);
  });

  it("charges the main rate on earnings between the primary threshold and UEL", () => {
    const result = computeClass1Nic(30000, RATES_2026_27);
    // (30,000 - 12,570) * 8% = 1,394.40
    expect(result.totalContributions).toBe(1394.4);
  });

  it("charges the additional rate above the upper earnings limit", () => {
    const result = computeClass1Nic(60000, RATES_2026_27);
    // (50,270 - 12,570) * 8% = 3,016; (60,000 - 50,270) * 2% = 194.60
    expect(result.totalContributions).toBe(3210.6);
  });

  it("returns zero for zero earnings", () => {
    const result = computeClass1Nic(0, RATES_2026_27);
    expect(result.totalContributions).toBe(0);
    expect(result.effectiveRate).toBe(0);
  });

  it("rejects negative earnings", () => {
    expect(() => computeClass1Nic(-1, RATES_2026_27)).toThrow();
  });
});

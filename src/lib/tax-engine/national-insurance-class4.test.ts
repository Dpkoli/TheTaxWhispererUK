import { describe, expect, it } from "vitest";
import { computeClass4Nic, type Class4NicRateTableValues } from "./national-insurance-class4";

// 2026-27 UK rates, verified against GOV.UK before use — see the seeded
// RateTable.
const RATES_2026_27: Class4NicRateTableValues = {
  primaryThreshold: 12570,
  upperEarningsLimit: 50270,
  mainRate: 0.06,
  additionalRate: 0.02,
};

describe("computeClass4Nic — 2026-27 UK rates", () => {
  it("charges nothing at or below the lower profits limit", () => {
    const result = computeClass4Nic(12000, RATES_2026_27);
    expect(result.totalContributions).toBe(0);
  });

  it("charges the main rate on profits between the lower and upper profits limits", () => {
    const result = computeClass4Nic(30000, RATES_2026_27);
    // (30,000 - 12,570) * 6% = 1,045.80
    expect(result.totalContributions).toBe(1045.8);
  });

  it("charges the additional rate above the upper profits limit", () => {
    const result = computeClass4Nic(60000, RATES_2026_27);
    // (50,270 - 12,570) * 6% = 2,262; (60,000 - 50,270) * 2% = 194.60
    expect(result.totalContributions).toBe(2456.6);
  });

  it("uses Class 4 terminology in its line item labels, not Class 1 wording", () => {
    const result = computeClass4Nic(30000, RATES_2026_27);
    const labels = result.lineItems.map((item) => item.label).join(" | ");
    expect(labels).toContain("Lower Profits Limit");
    expect(labels).toContain("Total Class 4 (self-employed) NI due");
    expect(labels).not.toContain("Primary Threshold");
  });
});

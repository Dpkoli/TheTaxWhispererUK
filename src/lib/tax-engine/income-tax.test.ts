import { describe, expect, it } from "vitest";
import { computeIncomeTax, type IncomeTaxRateTableValues } from "./income-tax";

// 2026-27 UK (England/Wales/NI) rates, verified against GOV.UK / House of
// Commons Library research briefing before use — see the seeded RateTable.
const RATES_2026_27: IncomeTaxRateTableValues = {
  personalAllowance: 12570,
  personalAllowanceTaperThreshold: 100000,
  personalAllowanceTaperRate: 0.5,
  bands: [
    { label: "Basic rate", upTo: 37700, rate: 0.2 },
    { label: "Higher rate", upTo: 125140, rate: 0.4 },
    { label: "Additional rate", upTo: null, rate: 0.45 },
  ],
};

describe("computeIncomeTax — 2026-27 UK rates", () => {
  it("taxes income entirely within the basic rate band", () => {
    const result = computeIncomeTax(30000, RATES_2026_27);
    expect(result.personalAllowance).toBe(12570);
    expect(result.incomeAfterAllowance).toBe(17430);
    expect(result.totalTax).toBe(3486);
  });

  it("taxes income spanning basic and higher rate bands", () => {
    const result = computeIncomeTax(60000, RATES_2026_27);
    expect(result.personalAllowance).toBe(12570);
    expect(result.incomeAfterAllowance).toBe(47430);
    // 37,700 @ 20% = 7,540; remaining 9,730 @ 40% = 3,892
    expect(result.totalTax).toBe(11432);
  });

  it("applies the personal allowance taper between £100,000 and £125,140", () => {
    const result = computeIncomeTax(110000, RATES_2026_27);
    // Excess over £100,000 = £10,000; reduction = £5,000; allowance = £7,570
    expect(result.personalAllowance).toBe(7570);
    expect(result.incomeAfterAllowance).toBe(102430);
    // 37,700 @ 20% = 7,540; remaining 64,730 @ 40% = 25,892
    expect(result.totalTax).toBe(33432);
  });

  it("fully withdraws the personal allowance at or above £125,140", () => {
    const result = computeIncomeTax(150000, RATES_2026_27);
    expect(result.personalAllowance).toBe(0);
    expect(result.incomeAfterAllowance).toBe(150000);
    // 37,700 @ 20% = 7,540
    // (125,140 - 37,700) = 87,440 @ 40% = 34,976
    // (150,000 - 125,140) = 24,860 @ 45% = 11,187
    expect(result.totalTax).toBe(53703);
  });

  it("returns zero tax for income at or below the personal allowance", () => {
    const result = computeIncomeTax(10000, RATES_2026_27);
    expect(result.personalAllowance).toBe(12570);
    expect(result.incomeAfterAllowance).toBe(0);
    expect(result.totalTax).toBe(0);
  });

  it("rejects negative income", () => {
    expect(() => computeIncomeTax(-1, RATES_2026_27)).toThrow();
  });
});

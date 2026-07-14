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

// 2026-27 Scottish rates, verified against gov.scot / GOV.UK before use —
// see the seeded RateTable (jurisdiction: scotland). Personal Allowance and
// its taper are reserved (UK-wide), only the bands above it are devolved.
const SCOTTISH_RATES_2026_27: IncomeTaxRateTableValues = {
  personalAllowance: 12570,
  personalAllowanceTaperThreshold: 100000,
  personalAllowanceTaperRate: 0.5,
  bands: [
    { label: "Starter rate", upTo: 3967, rate: 0.19 },
    { label: "Basic rate", upTo: 16956, rate: 0.2 },
    { label: "Intermediate rate", upTo: 31092, rate: 0.21 },
    { label: "Higher rate", upTo: 62430, rate: 0.42 },
    { label: "Advanced rate", upTo: 112570, rate: 0.45 },
    { label: "Top rate", upTo: null, rate: 0.48 },
  ],
};

describe("computeIncomeTax — 2026-27 Scottish rates", () => {
  it("spans starter, basic, and intermediate bands", () => {
    const result = computeIncomeTax(30000, SCOTTISH_RATES_2026_27);
    expect(result.personalAllowance).toBe(12570);
    expect(result.incomeAfterAllowance).toBe(17430);
    // 3,967 @ 19% = 753.73; 12,989 @ 20% = 2,597.80; 474 @ 21% = 99.54
    expect(result.totalTax).toBe(3451.07);
  });

  it("reaches the top rate above £112,570 of income after allowance", () => {
    const result = computeIncomeTax(125000, SCOTTISH_RATES_2026_27);
    // Personal allowance untouched below £100k taper threshold... but this
    // income exceeds £100k, so the reserved UK-wide taper still applies:
    // excess £25,000 -> reduction £12,500 (capped at £12,570) = £12,500
    expect(result.personalAllowance).toBe(70);
    expect(result.incomeAfterAllowance).toBe(124930);
  });
});

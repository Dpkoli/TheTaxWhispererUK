import { describe, expect, it } from "vitest";
import {
  computeCapitalGainsTax,
  type CapitalGainsTaxRateTableValues,
} from "./capital-gains-tax";

// 2026-27 UK rates, verified against GOV.UK "Capital Gains Tax rates and
// allowances" before use — see the seeded RateTable.
const RATES_2026_27: CapitalGainsTaxRateTableValues = {
  annualExemptAmount: 3000,
  basicRate: 0.18,
  higherRate: 0.24,
};

describe("computeCapitalGainsTax — 2026-27 UK rates", () => {
  it("charges nothing when gains are within the annual exempt amount", () => {
    const result = computeCapitalGainsTax(2000, 37700, RATES_2026_27);
    expect(result.taxableGains).toBe(0);
    expect(result.totalTax).toBe(0);
  });

  it("taxes the whole excess at the basic rate when it fits in the unused band", () => {
    const result = computeCapitalGainsTax(10000, 37700, RATES_2026_27);
    // Taxable = 10,000 - 3,000 = 7,000, all within unused basic rate band
    expect(result.taxableGains).toBe(7000);
    expect(result.totalTax).toBe(1260); // 7,000 * 18%
  });

  it("splits the excess across basic and higher rate when it exceeds the unused band", () => {
    const result = computeCapitalGainsTax(20000, 5000, RATES_2026_27);
    // Taxable = 20,000 - 3,000 = 17,000; 5,000 @ 18% = 900; 12,000 @ 24% = 2,880
    expect(result.taxableGains).toBe(17000);
    expect(result.totalTax).toBe(3780);
  });

  it("taxes everything at the higher rate when there's no unused basic rate band", () => {
    const result = computeCapitalGainsTax(10000, 0, RATES_2026_27);
    expect(result.taxableGains).toBe(7000);
    expect(result.totalTax).toBe(1680); // 7,000 * 24%
  });

  it("rejects negative gains", () => {
    expect(() => computeCapitalGainsTax(-1, 37700, RATES_2026_27)).toThrow();
  });
});

import { describe, expect, it } from "vitest";
import {
  computeCorporationTax,
  type CorporationTaxRateTableValues,
} from "./corporation-tax";

// 2026-27 UK rates, verified against GOV.UK before use — see the seeded
// RateTable.
const RATES_2026_27: CorporationTaxRateTableValues = {
  smallProfitsRate: 0.19,
  smallProfitsLimit: 50000,
  mainRate: 0.25,
  mainRateThreshold: 250000,
  marginalReliefFraction: 3 / 200,
};

describe("computeCorporationTax — 2026-27 UK rates", () => {
  it("charges the small profits rate at or below the small profits limit", () => {
    const result = computeCorporationTax(40000, RATES_2026_27);
    expect(result.totalTax).toBe(7600); // 40,000 * 19%
  });

  it("matches the small profits rate exactly at the small profits limit boundary", () => {
    const result = computeCorporationTax(50000, RATES_2026_27);
    expect(result.totalTax).toBe(9500); // 50,000 * 19%
  });

  it("applies marginal relief between the small profits limit and main rate threshold", () => {
    const result = computeCorporationTax(100000, RATES_2026_27);
    // Tax at main rate: 100,000 * 25% = 25,000
    // Marginal relief: (250,000 - 100,000) * 3/200 = 2,250
    expect(result.taxAtMainRate).toBe(25000);
    expect(result.marginalRelief).toBe(2250);
    expect(result.totalTax).toBe(22750);
  });

  it("matches the main rate exactly at the main rate threshold boundary", () => {
    const result = computeCorporationTax(250000, RATES_2026_27);
    expect(result.marginalRelief).toBe(0);
    expect(result.totalTax).toBe(62500); // 250,000 * 25%
  });

  it("charges the full main rate above the main rate threshold", () => {
    const result = computeCorporationTax(500000, RATES_2026_27);
    expect(result.totalTax).toBe(125000); // 500,000 * 25%
  });

  it("returns zero tax and zero effective rate for zero profits", () => {
    const result = computeCorporationTax(0, RATES_2026_27);
    expect(result.totalTax).toBe(0);
    expect(result.effectiveRate).toBe(0);
  });

  it("rejects negative profits", () => {
    expect(() => computeCorporationTax(-1, RATES_2026_27)).toThrow();
  });
});

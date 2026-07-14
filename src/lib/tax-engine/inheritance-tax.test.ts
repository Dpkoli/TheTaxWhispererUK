import { describe, expect, it } from "vitest";
import {
  computeInheritanceTax,
  type InheritanceTaxRateTableValues,
} from "./inheritance-tax";

// 2026-27 UK rates, verified against GOV.UK / IHTA 1984 s.7, s.8D before
// use — see the seeded RateTable.
const RATES_2026_27: InheritanceTaxRateTableValues = {
  nilRateBand: 325000,
  residenceNilRateBand: 175000,
  residenceTaperThreshold: 2000000,
  rate: 0.4,
};

describe("computeInheritanceTax — 2026-27 UK rates", () => {
  it("charges nothing when the estate exactly fills both nil-rate bands", () => {
    const result = computeInheritanceTax(500000, 300000, 0, RATES_2026_27);
    expect(result.totalNilRateBand).toBe(500000);
    expect(result.taxableEstate).toBe(0);
    expect(result.totalTax).toBe(0);
  });

  it("taxes the excess above both nil-rate bands at 40%", () => {
    const result = computeInheritanceTax(700000, 300000, 0, RATES_2026_27);
    // 700,000 - (325,000 + 175,000) = 200,000; 200,000 * 40% = 80,000
    expect(result.taxableEstate).toBe(200000);
    expect(result.totalTax).toBe(80000);
  });

  it("caps the residence nil-rate band at the value of the residence passing to descendants", () => {
    const result = computeInheritanceTax(600000, 100000, 0, RATES_2026_27);
    expect(result.residenceNilRateBandAvailable).toBe(100000);
    // 600,000 - (325,000 + 100,000) = 175,000; * 40% = 70,000
    expect(result.totalTax).toBe(70000);
  });

  it("gives zero residence nil-rate band when no residence passes to descendants", () => {
    const result = computeInheritanceTax(500000, 0, 0, RATES_2026_27);
    expect(result.residenceNilRateBandAvailable).toBe(0);
    expect(result.taxableEstate).toBe(175000);
  });

  it("tapers the residence nil-rate band by £1 for every £2 over £2m", () => {
    const result = computeInheritanceTax(2200000, 300000, 0, RATES_2026_27);
    // Excess over £2m = £200,000; reduction = £100,000; RNRB = 175,000 - 100,000 = 75,000
    expect(result.residenceNilRateBandAvailable).toBe(75000);
    // Taxable = 2,200,000 - (325,000 + 75,000) = 1,800,000; * 40% = 720,000
    expect(result.totalTax).toBe(720000);
  });

  it("fully withdraws the residence nil-rate band once the taper exceeds it", () => {
    const result = computeInheritanceTax(2400000, 300000, 0, RATES_2026_27);
    // Excess over £2m = £400,000; reduction = £200,000, capped at 175,000
    expect(result.residenceNilRateBandAvailable).toBe(0);
  });

  it("applies a 100% transferable nil-rate band from a predeceased spouse", () => {
    const result = computeInheritanceTax(900000, 0, 100, RATES_2026_27);
    expect(result.nilRateBandAvailable).toBe(650000);
    // 900,000 - 650,000 = 250,000; * 40% = 100,000
    expect(result.totalTax).toBe(100000);
  });

  it("rejects a transferable percentage outside 0-100", () => {
    expect(() => computeInheritanceTax(500000, 0, 150, RATES_2026_27)).toThrow();
  });

  it("rejects negative estate value", () => {
    expect(() => computeInheritanceTax(-1, 0, 0, RATES_2026_27)).toThrow();
  });
});

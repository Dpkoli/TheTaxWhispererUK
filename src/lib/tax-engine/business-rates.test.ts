import { describe, expect, it } from "vitest";
import {
  computeBusinessRates,
  type BusinessRatesRateTableValues,
} from "./business-rates";

// 2026-27 England rates, verified against GOV.UK before use — see the
// seeded RateTable.
const RATES: BusinessRatesRateTableValues = {
  smallBusinessMultiplier: 0.432,
  smallBusinessRhlMultiplier: 0.382,
  standardMultiplier: 0.48,
  standardRhlMultiplier: 0.43,
  smallBusinessThreshold: 51000,
  smallBusinessRateReliefFullThreshold: 12000,
  smallBusinessRateReliefTaperCeiling: 15000,
};

describe("computeBusinessRates — 2026-27 England rates", () => {
  it("gives 100% relief at or below the full-relief threshold", () => {
    const result = computeBusinessRates(10000, false, RATES);
    expect(result.reliefPercent).toBe(100);
    expect(result.netBill).toBe(0);
  });

  it("gives 50% relief at the taper midpoint", () => {
    const result = computeBusinessRates(13500, false, RATES);
    // Gross: 13,500 * 0.432 = 5,832; relief 50% = 2,916
    expect(result.grossBill).toBe(5832);
    expect(result.reliefPercent).toBe(50);
    expect(result.netBill).toBe(2916);
  });

  it("gives no relief once rateable value reaches the taper ceiling", () => {
    const result = computeBusinessRates(20000, false, RATES);
    expect(result.reliefPercent).toBe(0);
    expect(result.netBill).toBe(result.grossBill);
  });

  it("uses the standard multiplier above the small business threshold", () => {
    const result = computeBusinessRates(60000, false, RATES);
    expect(result.multiplierUsed).toBe(0.48);
    expect(result.netBill).toBe(28800);
  });

  it("uses the RHL multiplier for retail/hospitality/leisure properties", () => {
    const result = computeBusinessRates(10000, true, RATES);
    expect(result.multiplierUsed).toBe(0.382);
    expect(result.reliefPercent).toBe(100);
  });

  it("rejects a negative rateable value", () => {
    expect(() => computeBusinessRates(-1, false, RATES)).toThrow();
  });
});

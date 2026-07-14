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
  emptyPropertyReliefMonths: 3,
  emptyPropertyReliefIndustrialExtraMonths: 3,
  emptyPropertyExemptionThreshold: 2900,
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

  it("exempts an empty non-industrial property within the 3-month relief period", () => {
    const result = computeBusinessRates(60000, false, RATES, {
      isEmpty: true,
      monthsEmpty: 2,
    });
    expect(result.emptyPropertyReliefApplied).toBe(true);
    expect(result.netBill).toBe(0);
  });

  it("charges full rates on an empty property after the 3-month relief period", () => {
    const result = computeBusinessRates(60000, false, RATES, {
      isEmpty: true,
      monthsEmpty: 4,
    });
    expect(result.emptyPropertyReliefApplied).toBe(false);
    expect(result.netBill).toBe(result.grossBill);
  });

  it("extends the relief period to 6 months for an empty industrial property", () => {
    const result = computeBusinessRates(60000, false, RATES, {
      isEmpty: true,
      monthsEmpty: 5,
      isIndustrial: true,
    });
    expect(result.emptyPropertyReliefApplied).toBe(true);
    expect(result.netBill).toBe(0);
  });

  it("permanently exempts an empty property below the £2,900 threshold regardless of duration", () => {
    const result = computeBusinessRates(2000, false, RATES, {
      isEmpty: true,
      monthsEmpty: 36,
    });
    expect(result.emptyPropertyReliefApplied).toBe(true);
    expect(result.netBill).toBe(0);
  });
});

import { describe, expect, it } from "vitest";
import { computeIr35Chapter10, type Ir35Chapter10RateTableValues } from "./ir35-chapter10";

// 2026-27 UK rates, verified against GOV.UK before use — see the seeded
// RateTable.
const RATES: Ir35Chapter10RateTableValues = {
  employerNicRate: 0.15,
  employerNicSecondaryThreshold: 5000,
};

describe("computeIr35Chapter10 — 2026-27 UK rates", () => {
  it("treats the whole chain payment as the deemed direct payment with no materials", () => {
    const result = computeIr35Chapter10(80000, 0, RATES);
    expect(result.deemedDirectPayment).toBe(80000);
  });

  it("deducts direct materials cost before computing the deemed direct payment", () => {
    const result = computeIr35Chapter10(80000, 5000, RATES);
    expect(result.deemedDirectPayment).toBe(75000);
  });

  it("calculates employer NIC as an addition on top, not a deduction from the payment", () => {
    const result = computeIr35Chapter10(80000, 0, RATES);
    // (80,000 - 5,000) * 15% = 11,250
    expect(result.employerNicOnPayment).toBe(11250);
    expect(result.totalCostToFeePayer).toBe(91250);
    // The worker still receives (before their own tax/NIC) the full deemed payment
    expect(result.deemedDirectPayment).toBe(80000);
  });

  it("charges no employer NIC when the payment is below the secondary threshold", () => {
    const result = computeIr35Chapter10(4000, 0, RATES);
    expect(result.employerNicOnPayment).toBe(0);
    expect(result.totalCostToFeePayer).toBe(4000);
  });

  it("rejects negative chain payment", () => {
    expect(() => computeIr35Chapter10(-1, 0, RATES)).toThrow();
  });

  it("rejects materials cost exceeding the chain payment", () => {
    expect(() => computeIr35Chapter10(1000, 2000, RATES)).toThrow();
  });
});

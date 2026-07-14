import { describe, expect, it } from "vitest";
import {
  computeClass2Class3Position,
  type Class2Class3RateTableValues,
} from "./nic-class2-class3";

// 2026-27 UK rates, verified against GOV.UK before use — see the seeded
// RateTable.
const RATES: Class2Class3RateTableValues = {
  smallProfitsThreshold: 7105,
  class2WeeklyRate: 3.65,
  class3WeeklyRate: 18.4,
};

describe("computeClass2Class3Position — 2026-27 UK rates", () => {
  it("credits automatically at or above the Small Profits Threshold", () => {
    const result = computeClass2Class3Position(10000, 52, RATES);
    expect(result.isAutomaticallyCredited).toBe(true);
  });

  it("does not credit automatically below the Small Profits Threshold", () => {
    const result = computeClass2Class3Position(5000, 52, RATES);
    expect(result.isAutomaticallyCredited).toBe(false);
  });

  it("matches the Small Profits Threshold exactly as the credited boundary", () => {
    const result = computeClass2Class3Position(7105, 52, RATES);
    expect(result.isAutomaticallyCredited).toBe(true);
  });

  it("calculates voluntary Class 2 cost as weeks times the weekly rate", () => {
    const result = computeClass2Class3Position(5000, 52, RATES);
    expect(result.class2VoluntaryCost).toBe(189.8);
  });

  it("calculates voluntary Class 3 cost as weeks times the weekly rate", () => {
    const result = computeClass2Class3Position(5000, 52, RATES);
    expect(result.class3VoluntaryCost).toBe(956.8);
  });

  it("scales with a partial number of weeks", () => {
    const result = computeClass2Class3Position(5000, 26, RATES);
    expect(result.class2VoluntaryCost).toBe(94.9);
  });

  it("rejects negative profits", () => {
    expect(() => computeClass2Class3Position(-1, 52, RATES)).toThrow();
  });

  it("rejects zero or negative weeks", () => {
    expect(() => computeClass2Class3Position(5000, 0, RATES)).toThrow();
  });
});

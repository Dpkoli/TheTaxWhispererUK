import { describe, expect, it } from "vitest";
import { computeSdlt, type SdltRateTableValues } from "./stamp-duty-land-tax";

// 2026-27 England/NI residential rates, verified against GOV.UK before use
// — see the seeded RateTable.
const RATES_2026_27: SdltRateTableValues = {
  standardBands: [
    { label: "Up to £125,000", upTo: 125000, rate: 0 },
    { label: "£125,001 to £250,000", upTo: 250000, rate: 0.02 },
    { label: "£250,001 to £925,000", upTo: 925000, rate: 0.05 },
    { label: "£925,001 to £1,500,000", upTo: 1500000, rate: 0.1 },
    { label: "Above £1,500,000", upTo: null, rate: 0.12 },
  ],
  firstTimeBuyerBands: [
    { label: "Up to £300,000", upTo: 300000, rate: 0 },
    { label: "£300,001 to £500,000", upTo: 500000, rate: 0.05 },
  ],
  firstTimeBuyerReliefCeiling: 500000,
};

describe("computeSdlt — 2026-27 England/NI residential rates", () => {
  it("charges nothing at or below the nil-rate threshold", () => {
    const result = computeSdlt(120000, false, RATES_2026_27);
    expect(result.totalTax).toBe(0);
  });

  it("spans the 0/2/5% bands for a standard purchase", () => {
    const result = computeSdlt(300000, false, RATES_2026_27);
    // 0% on 125,000 + 2% on 125,000 (2,500) + 5% on 50,000 (2,500)
    expect(result.totalTax).toBe(5000);
  });

  it("spans all five standard bands for a high-value purchase", () => {
    const result = computeSdlt(1000000, false, RATES_2026_27);
    // 0 + 2,500 + 33,750 + 7,500
    expect(result.totalTax).toBe(43750);
  });

  it("applies first-time buyer relief within the relief ceiling", () => {
    const result = computeSdlt(250000, true, RATES_2026_27);
    expect(result.isFirstTimeBuyer).toBe(true);
    expect(result.totalTax).toBe(0);
  });

  it("charges the first-time buyer 5% band between £300k and £500k", () => {
    const result = computeSdlt(400000, true, RATES_2026_27);
    expect(result.totalTax).toBe(5000);
  });

  it("withdraws first-time buyer relief entirely above the relief ceiling", () => {
    const result = computeSdlt(600000, true, RATES_2026_27);
    expect(result.isFirstTimeBuyer).toBe(false);
    // Standard bands on the whole price: 0 + 2,500 + 17,500
    expect(result.totalTax).toBe(20000);
  });

  it("rejects a negative purchase price", () => {
    expect(() => computeSdlt(-1, false, RATES_2026_27)).toThrow();
  });
});

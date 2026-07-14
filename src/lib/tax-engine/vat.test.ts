import { describe, expect, it } from "vitest";
import { computeVat, type VatRateTableValues } from "./vat";

// Current UK VAT rates, verified against GOV.UK / VATA 1994 before use —
// see the seeded RateTable.
const RATES: VatRateTableValues = {
  standardRate: 0.2,
  reducedRate: 0.05,
  zeroRate: 0,
};

describe("computeVat — current UK rates", () => {
  it("charges 20% output VAT on standard-rated sales only", () => {
    const result = computeVat(10000, 0, 0, 0, RATES);
    expect(result.outputVat).toBe(2000);
    expect(result.netVatDue).toBe(2000);
  });

  it("charges 5% on reduced-rated sales and 0% on zero-rated sales", () => {
    const result = computeVat(0, 2000, 5000, 0, RATES);
    // 2,000 * 5% = 100; 5,000 * 0% = 0
    expect(result.outputVat).toBe(100);
  });

  it("nets output VAT against reclaimable input VAT", () => {
    const result = computeVat(10000, 0, 0, 800, RATES);
    // Output 2,000 - Input 800 = 1,200 due
    expect(result.netVatDue).toBe(1200);
  });

  it("returns a negative net figure (repayment due) when input VAT exceeds output VAT", () => {
    const result = computeVat(1000, 0, 0, 500, RATES);
    // Output 200 - Input 500 = -300 (repayable)
    expect(result.netVatDue).toBe(-300);
  });

  it("combines all three sale types correctly", () => {
    const result = computeVat(5000, 2000, 3000, 300, RATES);
    // Output: 5,000*20% + 2,000*5% + 3,000*0% = 1,000 + 100 + 0 = 1,100
    expect(result.outputVat).toBe(1100);
    expect(result.netVatDue).toBe(800);
  });

  it("rejects negative sales figures", () => {
    expect(() => computeVat(-1, 0, 0, 0, RATES)).toThrow();
  });

  it("rejects negative input VAT", () => {
    expect(() => computeVat(1000, 0, 0, -1, RATES)).toThrow();
  });
});

import { describe, expect, it } from "vitest";
import { computeTransferPricing } from "./transfer-pricing";

const rates = { corporationTaxRate: 0.25 };

describe("computeTransferPricing", () => {
  it("makes no adjustment when a sale price sits inside the arm's-length range", () => {
    const result = computeTransferPricing(100000, 90000, 110000, "sale", rates);
    expect(result.withinRange).toBe(true);
    expect(result.profitAdjustment).toBe(0);
    expect(result.additionalTax).toBe(0);
  });

  it("adjusts profit up when a sale price is below the arm's-length range", () => {
    const result = computeTransferPricing(80000, 90000, 110000, "sale", rates);
    expect(result.withinRange).toBe(false);
    expect(result.profitAdjustment).toBe(10000);
    expect(result.additionalTax).toBe(2500);
  });

  it("makes no adjustment when a sale price is above the range (favours HMRC already)", () => {
    const result = computeTransferPricing(120000, 90000, 110000, "sale", rates);
    expect(result.profitAdjustment).toBe(0);
    expect(result.additionalTax).toBe(0);
  });

  it("adjusts profit up when a purchase price is above the arm's-length range", () => {
    const result = computeTransferPricing(130000, 90000, 110000, "purchase", rates);
    expect(result.withinRange).toBe(false);
    expect(result.profitAdjustment).toBe(20000);
    expect(result.additionalTax).toBe(5000);
  });

  it("makes no adjustment when a purchase price is below the range (favours HMRC already)", () => {
    const result = computeTransferPricing(70000, 90000, 110000, "purchase", rates);
    expect(result.profitAdjustment).toBe(0);
    expect(result.additionalTax).toBe(0);
  });

  it("rejects a negative actual price", () => {
    expect(() => computeTransferPricing(-1, 90000, 110000, "sale", rates)).toThrow();
  });

  it("rejects an arm's-length high below the low", () => {
    expect(() => computeTransferPricing(100000, 110000, 90000, "sale", rates)).toThrow();
  });
});

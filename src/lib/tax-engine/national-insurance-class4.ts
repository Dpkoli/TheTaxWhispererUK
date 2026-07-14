import {
  computeClass1Nic,
  type NationalInsuranceRateTableValues,
  type NationalInsuranceResult,
} from "./national-insurance";

export type Class4NicRateTableValues = NationalInsuranceRateTableValues;
export type Class4NicResult = NationalInsuranceResult;

/**
 * Deterministic Class 4 self-employed National Insurance computation, per
 * SSCBA 1992 s.15. The band mechanism (a lower profits limit, an upper
 * profits limit, a main rate between them, and a lower additional rate
 * above) is structurally identical to employee Class 1 NI — only the rate
 * values differ — so this reuses that engine directly rather than
 * duplicating the same arithmetic under a different name.
 */
const CLASS_4_LABELS = {
  earningsLabel: "Annual taxable profits",
  thresholdName: "Lower Profits Limit",
  upperLimitName: "Upper Profits Limit",
  totalLabel: "Total Class 4 (self-employed) NI due",
};

export function computeClass4Nic(
  annualProfits: number,
  rates: Class4NicRateTableValues,
): Class4NicResult {
  return computeClass1Nic(annualProfits, rates, CLASS_4_LABELS);
}

export type RdReliefRateTableValues = {
  creditRate: number;
  corporationTaxRate: number;
};

export type RdReliefLineItem = {
  label: string;
  amount: number;
  rate?: number;
};

export type RdReliefResult = {
  qualifyingExpenditure: number;
  grossCredit: number;
  taxOnCredit: number;
  netCashBenefit: number;
  lineItems: RdReliefLineItem[];
};

/**
 * Deterministic R&D tax relief computation under the merged R&D
 * Expenditure Credit (RDEC) scheme, for accounting periods beginning on
 * or after 1 April 2024. The credit is an above-the-line 20% of
 * qualifying R&D expenditure, but the credit itself is taxable income —
 * so the net cash benefit is the credit less Corporation Tax on that
 * credit, not the gross credit figure. Doesn't model the PAYE/NIC cap on
 * the payable credit, subcontractor restrictions, or the separate
 * Enhanced R&D Intensive Support (ERIS) scheme for loss-making R&D-intensive
 * SMEs.
 */
export function computeRdRelief(
  qualifyingExpenditure: number,
  rates: RdReliefRateTableValues,
): RdReliefResult {
  if (qualifyingExpenditure < 0) throw new Error("qualifyingExpenditure cannot be negative");

  const grossCredit = round2(qualifyingExpenditure * rates.creditRate);
  const taxOnCredit = round2(grossCredit * rates.corporationTaxRate);
  const netCashBenefit = round2(grossCredit - taxOnCredit);

  const lineItems: RdReliefLineItem[] = [
    { label: "Qualifying R&D expenditure", amount: round2(qualifyingExpenditure) },
    {
      label: `R&D Expenditure Credit @ ${(rates.creditRate * 100).toFixed(0)}%`,
      amount: grossCredit,
      rate: rates.creditRate,
    },
    {
      label: `Corporation Tax on the credit @ ${(rates.corporationTaxRate * 100).toFixed(0)}%`,
      amount: -taxOnCredit,
      rate: rates.corporationTaxRate,
    },
    { label: "Net cash benefit", amount: netCashBenefit },
  ];

  return { qualifyingExpenditure: round2(qualifyingExpenditure), grossCredit, taxOnCredit, netCashBenefit, lineItems };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export type Ir35RateTableValues = {
  flatRateDeduction: number;
  employerNicRate: number;
  employerNicSecondaryThreshold: number;
};

export type Ir35Inputs = {
  grossFeeIncome: number;
  otherNonPayeIncome?: number;
  capitalAllowances?: number;
  allowableExpenses?: number;
  pensionContributions?: number;
  employerNicAlreadyPaid?: number;
  salaryAndBenefitsAlreadyTaxed?: number;
};

export type Ir35LineItem = {
  label: string;
  amount: number;
  rate?: number;
};

export type Ir35Result = {
  deemedPayment: number;
  employerNicOnDeemedPayment: number;
  lineItems: Ir35LineItem[];
};

/**
 * Deterministic deemed employment payment computation under ITEPA 2003
 * s.54 (Chapter 8 "own intermediary" IR35 — the worker's PSC calculates
 * this itself, which applies where the end client is small or has no UK
 * presence; medium/large clients instead use the Chapter 10 off-payroll
 * fee-payer withholding rules, not modeled here).
 *
 * Follows all 8 statutory steps. Steps 2-7 are situational deductions
 * that default to zero (a contractor who has taken no salary, made no
 * pension contributions, and has no other relevant income collapses
 * cleanly to gross fee income less the flat 5%, then step 8's grossing-up
 * for employer NIC) — not an approximation of the real mechanism, just
 * the real mechanism with its optional inputs left at zero.
 *
 * The resulting deemed payment is itself then subject to Income Tax and
 * employee Class 1 NIC in the normal way — run it through those
 * calculators separately for the worker's actual take-home figure.
 */
export function computeIr35DeemedPayment(
  inputs: Ir35Inputs,
  rates: Ir35RateTableValues,
): Ir35Result {
  const {
    grossFeeIncome,
    otherNonPayeIncome = 0,
    capitalAllowances = 0,
    allowableExpenses = 0,
    pensionContributions = 0,
    employerNicAlreadyPaid = 0,
    salaryAndBenefitsAlreadyTaxed = 0,
  } = inputs;

  for (const [label, value] of [
    ["grossFeeIncome", grossFeeIncome],
    ["otherNonPayeIncome", otherNonPayeIncome],
    ["capitalAllowances", capitalAllowances],
    ["allowableExpenses", allowableExpenses],
    ["pensionContributions", pensionContributions],
    ["employerNicAlreadyPaid", employerNicAlreadyPaid],
    ["salaryAndBenefitsAlreadyTaxed", salaryAndBenefitsAlreadyTaxed],
  ] as const) {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${label} cannot be negative`);
    }
  }

  const step1 = grossFeeIncome * (1 - rates.flatRateDeduction);
  const step2 = step1 + otherNonPayeIncome;
  const step3 = step2 - capitalAllowances;
  const step4 = step3 - allowableExpenses;
  const step5 = step4 - pensionContributions;
  const step6 = step5 - employerNicAlreadyPaid;
  const step7 = Math.max(0, step6 - salaryAndBenefitsAlreadyTaxed);

  // Step 8: find D such that D + employerNic(D) = step7, where
  // employerNic(D) = max(0, D - secondaryThreshold) * employerNicRate.
  let deemedPayment: number;
  let employerNicOnDeemedPayment: number;
  const assumingAboveThreshold =
    (step7 + rates.employerNicSecondaryThreshold * rates.employerNicRate) /
    (1 + rates.employerNicRate);

  if (assumingAboveThreshold > rates.employerNicSecondaryThreshold) {
    deemedPayment = assumingAboveThreshold;
    employerNicOnDeemedPayment = step7 - deemedPayment;
  } else {
    deemedPayment = step7;
    employerNicOnDeemedPayment = 0;
  }

  deemedPayment = round2(deemedPayment);
  employerNicOnDeemedPayment = round2(employerNicOnDeemedPayment);

  const lineItems: Ir35LineItem[] = [
    {
      label: `Step 1: Gross fee income less flat ${(rates.flatRateDeduction * 100).toFixed(0)}% deduction`,
      amount: round2(step1),
    },
    { label: "Step 2: Add other non-PAYE income", amount: round2(step2) },
    { label: "Step 3: Deduct capital allowances", amount: round2(step3) },
    { label: "Step 4: Deduct allowable expenses", amount: round2(step4) },
    { label: "Step 5: Deduct pension contributions", amount: round2(step5) },
    { label: "Step 6: Deduct employer NIC already paid", amount: round2(step6) },
    {
      label: "Step 7: Deduct salary/benefits already taxed",
      amount: round2(step7),
    },
    {
      label: `Step 8: Employer NIC on the deemed payment @ ${(rates.employerNicRate * 100).toFixed(0)}%`,
      amount: -employerNicOnDeemedPayment,
      rate: rates.employerNicRate,
    },
    { label: "Deemed employment payment", amount: deemedPayment },
  ];

  return { deemedPayment, employerNicOnDeemedPayment, lineItems };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

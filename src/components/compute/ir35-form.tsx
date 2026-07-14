"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CitationChip } from "@/components/ui/citation-chip";
import { runIr35Computation } from "@/app/compute/ir35/actions";

type ComputationResult = Awaited<ReturnType<typeof runIr35Computation>>;

const currency = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 2,
});

const OPTIONAL_FIELDS: { key: string; label: string }[] = [
  { key: "otherNonPayeIncome", label: "Other non-PAYE income (Step 2)" },
  { key: "capitalAllowances", label: "Capital allowances (Step 3)" },
  { key: "allowableExpenses", label: "Allowable expenses, e.g. travel (Step 4)" },
  { key: "pensionContributions", label: "Pension contributions (Step 5)" },
  { key: "employerNicAlreadyPaid", label: "Employer NIC already paid (Step 6)" },
  { key: "salaryAndBenefitsAlreadyTaxed", label: "Salary/benefits already taxed (Step 7)" },
];

function downloadCsv(result: ComputationResult) {
  const rows = [
    ["Line item", "Amount (£)"],
    ...result.result.lineItems.map((item) => [item.label, item.amount.toFixed(2)]),
    [],
    ["Rate table", `${result.rateTableVersion.taxYear} (${result.rateTableVersion.jurisdiction})`],
    ["Source", result.rateTableVersion.sourceCitationCode],
  ];
  const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ir35-deemed-payment-${result.rateTableVersion.taxYear}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function Ir35Form({ isGuest }: { isGuest: boolean }) {
  const [grossFeeIncome, setGrossFeeIncome] = useState("");
  const [optional, setOptional] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [result, setResult] = useState<ComputationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsedFee = Number(grossFeeIncome);
    if (!Number.isFinite(parsedFee) || parsedFee < 0) {
      setError("Enter a valid, non-negative gross fee income figure.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const inputs = {
          grossFeeIncome: parsedFee,
          ...Object.fromEntries(
            Object.entries(optional)
              .filter(([, v]) => v !== "")
              .map(([k, v]) => [k, Number(v)]),
          ),
        };
        const res = await runIr35Computation(inputs);
        setResult(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="gross-fee" className="text-sm font-medium text-ink/80">
              Gross fee income from the relevant engagement(s) this year
            </label>
            <input
              id="gross-fee"
              type="number"
              min={0}
              step="0.01"
              value={grossFeeIncome}
              onChange={(event) => setGrossFeeIncome(event.target.value)}
              placeholder="e.g. 80000"
              className="mt-1.5 w-full max-w-sm rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-xs font-medium text-accent-dark hover:underline"
          >
            {showAdvanced ? "Hide" : "Show"} optional steps 2-7 (pension, expenses, salary already taken…)
          </button>

          {showAdvanced && (
            <div className="grid gap-3 sm:grid-cols-2">
              {OPTIONAL_FIELDS.map((field) => (
                <div key={field.key}>
                  <label htmlFor={field.key} className="text-xs font-medium text-ink/70">
                    {field.label}
                  </label>
                  <input
                    id={field.key}
                    type="number"
                    min={0}
                    step="0.01"
                    value={optional[field.key] ?? ""}
                    onChange={(event) =>
                      setOptional((prev) => ({ ...prev, [field.key]: event.target.value }))
                    }
                    placeholder="0"
                    className="mt-1 w-full rounded-md border border-line px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              ))}
            </div>
          )}

          <Button type="submit" variant="primary" disabled={isPending || !grossFeeIncome}>
            {isPending ? "Computing…" : "Compute"}
          </Button>
        </form>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        <p className="mt-3 text-xs leading-relaxed text-ink/50">
          Covers the Chapter 8 "own intermediary" calculation, where the
          worker's own company assesses IR35 status — this applies when
          the end client is small or has no UK presence. Medium/large
          clients instead operate the Chapter 10 off-payroll fee-payer
          rules, which aren&apos;t modeled here.
        </p>
      </Card>

      {result && (
        <Card className="print-area">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
              Computation breakdown
            </h2>
            <div className="flex items-center gap-2 text-xs text-ink/50">
              Rate table {result.rateTableVersion.taxYear}
              <CitationChip
                href={`/sources/${result.rateTableVersion.sourceSlug}`}
                code={result.rateTableVersion.sourceCitationCode}
              />
            </div>
          </div>

          <table className="mt-4 w-full text-sm">
            <tbody>
              {result.result.lineItems.map((item, index) => {
                const isTotal = item.label.startsWith("Deemed");
                return (
                  <tr
                    key={index}
                    className={isTotal ? "border-t border-line font-semibold text-navy-950" : ""}
                  >
                    <td className="py-1.5 pr-4 text-ink/80">{item.label}</td>
                    <td className="py-1.5 text-right tabular-nums">
                      {currency.format(item.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <p className="mt-4 text-sm leading-relaxed text-ink/70">{result.narrative}</p>

          <div className="no-print mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => downloadCsv(result)}>
                Export as CSV
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                Export as PDF
              </Button>
            </div>
            {!result.persisted && isGuest && (
              <p className="text-xs text-ink/50">
                Sign in to save this computation to your account.
              </p>
            )}
          </div>

          <p className="mt-4 text-xs leading-relaxed text-ink/50">
            Illustrative — for review by a qualified professional before
            relying on this result. This is not regulated financial or
            tax advice.
          </p>
        </Card>
      )}
    </div>
  );
}

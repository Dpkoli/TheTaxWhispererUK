"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CitationChip } from "@/components/ui/citation-chip";
import { runCapitalGainsTaxComputation } from "@/app/compute/capital-gains-tax/actions";

type ComputationResult = Awaited<ReturnType<typeof runCapitalGainsTaxComputation>>;

const currency = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 2,
});

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
  a.download = `capital-gains-tax-computation-${result.rateTableVersion.taxYear}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function CapitalGainsTaxForm({ isGuest }: { isGuest: boolean }) {
  const [gains, setGains] = useState("");
  const [otherIncome, setOtherIncome] = useState("");
  const [result, setResult] = useState<ComputationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsedGains = Number(gains);
    const parsedIncome = Number(otherIncome || 0);
    if (!Number.isFinite(parsedGains) || parsedGains < 0) {
      setError("Enter a valid, non-negative gains figure.");
      return;
    }
    if (!Number.isFinite(parsedIncome) || parsedIncome < 0) {
      setError("Enter a valid, non-negative income figure.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await runCapitalGainsTaxComputation(parsedGains, parsedIncome);
        setResult(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="gains" className="text-sm font-medium text-ink/80">
              Total chargeable gains for the tax year
            </label>
            <input
              id="gains"
              type="number"
              min={0}
              step="0.01"
              value={gains}
              onChange={(event) => setGains(event.target.value)}
              placeholder="e.g. 15000"
              className="mt-1.5 w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label htmlFor="other-income" className="text-sm font-medium text-ink/80">
              Other taxable income for the year (optional)
            </label>
            <input
              id="other-income"
              type="number"
              min={0}
              step="0.01"
              value={otherIncome}
              onChange={(event) => setOtherIncome(event.target.value)}
              placeholder="e.g. 30000"
              className="mt-1.5 w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" variant="primary" disabled={isPending || !gains}>
              {isPending ? "Computing…" : "Compute"}
            </Button>
          </div>
        </form>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        <p className="mt-3 text-xs leading-relaxed text-ink/50">
          &quot;Other taxable income&quot; decides how much of your gain
          falls in the basic-rate band versus the higher rate — it&apos;s run
          through the same Income Tax engine used on the Income Tax page.
          Leave it at zero if gains are your only taxable amount for the
          year.
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
                const isTotal = item.label.startsWith("Total");
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
            filing or relying on this result. This is not regulated
            financial or tax advice.
          </p>
        </Card>
      )}
    </div>
  );
}

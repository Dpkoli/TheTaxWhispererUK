"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CitationChip } from "@/components/ui/citation-chip";
import { runClass2Class3Computation } from "@/app/compute/nic-class2-class3/actions";

type ComputationResult = Awaited<ReturnType<typeof runClass2Class3Computation>>;

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
  a.download = `nic-class2-class3-${result.rateTableVersion.taxYear}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function NationalInsuranceClass2Class3Form({ isGuest }: { isGuest: boolean }) {
  const [profits, setProfits] = useState("");
  const [weeks, setWeeks] = useState("52");
  const [result, setResult] = useState<ComputationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsedProfits = Number(profits);
    const parsedWeeks = Number(weeks);
    if (!Number.isFinite(parsedProfits) || parsedProfits < 0) {
      setError("Enter a valid, non-negative profits figure.");
      return;
    }
    if (!Number.isFinite(parsedWeeks) || parsedWeeks <= 0) {
      setError("Enter a valid number of weeks greater than zero.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await runClass2Class3Computation(parsedProfits, parsedWeeks);
        setResult(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[220px]">
            <label htmlFor="profits" className="text-sm font-medium text-ink/80">
              Annual self-employment profits
            </label>
            <input
              id="profits"
              type="number"
              min={0}
              step="0.01"
              value={profits}
              onChange={(event) => setProfits(event.target.value)}
              placeholder="e.g. 5000"
              className="mt-1.5 w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label htmlFor="weeks" className="text-sm font-medium text-ink/80">
              Weeks to cover
            </label>
            <input
              id="weeks"
              type="number"
              min={1}
              max={53}
              step="1"
              value={weeks}
              onChange={(event) => setWeeks(event.target.value)}
              className="mt-1.5 w-24 rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <Button type="submit" variant="primary" disabled={isPending || !profits}>
            {isPending ? "Computing…" : "Compute"}
          </Button>
        </form>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        <p className="mt-3 text-xs leading-relaxed text-ink/50">
          Since 6 April 2024, nobody pays Class 2 compulsorily — this tool
          tells you whether you&apos;re credited automatically, and what
          the voluntary Class 2/Class 3 options would cost if you want to
          fill a gap in your National Insurance record.
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
              {result.result.lineItems.map((item, index) => (
                <tr key={index}>
                  <td className="py-1.5 pr-4 text-ink/80">{item.label}</td>
                  <td className="py-1.5 text-right tabular-nums">
                    {currency.format(item.amount)}
                  </td>
                </tr>
              ))}
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

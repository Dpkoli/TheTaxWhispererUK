"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CitationChip } from "@/components/ui/citation-chip";
import { runInheritanceTaxComputation } from "@/app/compute/inheritance-tax/actions";

type ComputationResult = Awaited<ReturnType<typeof runInheritanceTaxComputation>>;

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
  a.download = `inheritance-tax-computation-${result.rateTableVersion.taxYear}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function InheritanceTaxForm({ isGuest }: { isGuest: boolean }) {
  const [netEstateValue, setNetEstateValue] = useState("");
  const [residenceValue, setResidenceValue] = useState("");
  const [transferablePercent, setTransferablePercent] = useState("0");
  const [result, setResult] = useState<ComputationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsedEstate = Number(netEstateValue);
    const parsedResidence = Number(residenceValue || 0);
    const parsedTransferable = Number(transferablePercent || 0);
    if (!Number.isFinite(parsedEstate) || parsedEstate < 0) {
      setError("Enter a valid, non-negative net estate value.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await runInheritanceTaxComputation(
          parsedEstate,
          parsedResidence,
          parsedTransferable,
        );
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
            <label htmlFor="net-estate" className="text-sm font-medium text-ink/80">
              Net estate value
            </label>
            <input
              id="net-estate"
              type="number"
              min={0}
              step="0.01"
              value={netEstateValue}
              onChange={(event) => setNetEstateValue(event.target.value)}
              placeholder="e.g. 700000"
              className="mt-1.5 w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label htmlFor="residence-value" className="text-sm font-medium text-ink/80">
              Residence value passing to direct descendants (optional)
            </label>
            <input
              id="residence-value"
              type="number"
              min={0}
              step="0.01"
              value={residenceValue}
              onChange={(event) => setResidenceValue(event.target.value)}
              placeholder="e.g. 300000"
              className="mt-1.5 w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label htmlFor="transferable" className="text-sm font-medium text-ink/80">
              Transferable nil-rate band from a predeceased spouse/civil partner (%)
            </label>
            <input
              id="transferable"
              type="number"
              min={0}
              max={100}
              step="1"
              value={transferablePercent}
              onChange={(event) => setTransferablePercent(event.target.value)}
              className="mt-1.5 w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div className="flex items-end sm:col-span-2">
            <Button type="submit" variant="primary" disabled={isPending || !netEstateValue}>
              {isPending ? "Computing…" : "Compute"}
            </Button>
          </div>
        </form>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        <p className="mt-3 text-xs leading-relaxed text-ink/50">
          Covers the standard nil-rate band and residence nil-rate band
          (including its £2m taper) only — it doesn&apos;t yet model
          business/agricultural property relief, gifts within 7 years, or
          trusts.
        </p>
      </Card>

      {result && (
        <Card>
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

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <Button variant="outline" onClick={() => downloadCsv(result)}>
              Export as CSV
            </Button>
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

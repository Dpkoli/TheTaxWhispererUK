"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CitationChip } from "@/components/ui/citation-chip";
import { runCouncilTaxComputation } from "@/app/compute/council-tax/actions";
import type { CouncilTaxBand } from "@/lib/tax-engine/council-tax";

type ComputationResult = Awaited<ReturnType<typeof runCouncilTaxComputation>>;

const currency = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 2,
});

const BANDS: CouncilTaxBand[] = ["A", "B", "C", "D", "E", "F", "G", "H"];

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
  a.download = `council-tax-computation-${result.rateTableVersion.taxYear}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function CouncilTaxForm({ isGuest }: { isGuest: boolean }) {
  const [band, setBand] = useState<CouncilTaxBand>("D");
  const [bandDCharge, setBandDCharge] = useState("");
  const [result, setResult] = useState<ComputationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = Number(bandDCharge);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Enter a valid, non-negative Band D charge.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await runCouncilTaxComputation(band, parsed);
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
          <div>
            <label htmlFor="band" className="text-sm font-medium text-ink/80">
              Council Tax band
            </label>
            <select
              id="band"
              value={band}
              onChange={(event) => setBand(event.target.value as CouncilTaxBand)}
              className="mt-1.5 rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {BANDS.map((b) => (
                <option key={b} value={b}>
                  Band {b}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[220px]">
            <label htmlFor="band-d-charge" className="text-sm font-medium text-ink/80">
              Your billing authority&apos;s Band D charge for the year
            </label>
            <input
              id="band-d-charge"
              type="number"
              min={0}
              step="0.01"
              value={bandDCharge}
              onChange={(event) => setBandDCharge(event.target.value)}
              placeholder="e.g. 2200 — find this on your council's website"
              className="mt-1.5 w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <Button type="submit" variant="primary" disabled={isPending || !bandDCharge}>
            {isPending ? "Computing…" : "Compute"}
          </Button>
        </form>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        <p className="mt-3 text-xs leading-relaxed text-ink/50">
          Applies the statutory Band A-H ratios to whatever Band D charge
          you enter — the Band D figure itself is set annually by each of
          England&apos;s ~300 billing authorities individually, so there is
          no single UK-wide amount this tool can look up for you.
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
            relying on this result. This is not regulated financial or
            tax advice.
          </p>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CitationChip } from "@/components/ui/citation-chip";
import { runSdltComputation } from "@/app/compute/stamp-duty-land-tax/actions";

type ComputationResult = Awaited<ReturnType<typeof runSdltComputation>>;

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
  a.download = `sdlt-computation-${result.rateTableVersion.taxYear}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function StampDutyLandTaxForm({ isGuest }: { isGuest: boolean }) {
  const [purchasePrice, setPurchasePrice] = useState("");
  const [isFirstTimeBuyer, setIsFirstTimeBuyer] = useState(false);
  const [result, setResult] = useState<ComputationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = Number(purchasePrice);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Enter a valid, non-negative purchase price.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await runSdltComputation(parsed, isFirstTimeBuyer);
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
            <label htmlFor="purchase-price" className="text-sm font-medium text-ink/80">
              Purchase price
            </label>
            <input
              id="purchase-price"
              type="number"
              min={0}
              step="0.01"
              value={purchasePrice}
              onChange={(event) => setPurchasePrice(event.target.value)}
              placeholder="e.g. 400000"
              className="mt-1.5 w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink/80">
            <input
              type="checkbox"
              checked={isFirstTimeBuyer}
              onChange={(event) => setIsFirstTimeBuyer(event.target.checked)}
              className="rounded border-line"
            />
            First-time buyer
          </label>
          <Button type="submit" variant="primary" disabled={isPending || !purchasePrice}>
            {isPending ? "Computing…" : "Compute"}
          </Button>
        </form>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        <p className="mt-3 text-xs leading-relaxed text-ink/50">
          Covers standard residential rates for England/Northern Ireland
          only — it doesn&apos;t yet cover the additional-property
          surcharge, non-resident surcharge, Land Transaction Tax (Wales),
          or the Land and Buildings Transaction Tax (Scotland).
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

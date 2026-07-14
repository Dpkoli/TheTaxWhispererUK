"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CitationChip } from "@/components/ui/citation-chip";
import { runTransferPricingComputation } from "@/app/compute/transfer-pricing/actions";
import type { TransferPricingTransactionType } from "@/lib/tax-engine/transfer-pricing";

type ComputationResult = Awaited<ReturnType<typeof runTransferPricingComputation>>;

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
  a.download = `transfer-pricing-${result.rateTableVersion.taxYear}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function TransferPricingForm({ isGuest }: { isGuest: boolean }) {
  const [transactionType, setTransactionType] =
    useState<TransferPricingTransactionType>("sale");
  const [actualPrice, setActualPrice] = useState("");
  const [armsLengthLow, setArmsLengthLow] = useState("");
  const [armsLengthHigh, setArmsLengthHigh] = useState("");
  const [result, setResult] = useState<ComputationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const price = Number(actualPrice);
    const low = Number(armsLengthLow);
    const high = Number(armsLengthHigh);
    if (!Number.isFinite(price) || price < 0) {
      setError("Enter a valid, non-negative actual transaction price.");
      return;
    }
    if (!Number.isFinite(low) || low < 0) {
      setError("Enter a valid, non-negative arm's-length range low figure.");
      return;
    }
    if (!Number.isFinite(high) || high < low) {
      setError("The arm's-length range high figure cannot be below the low figure.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await runTransferPricingComputation(price, low, high, transactionType);
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
          <div className="sm:col-span-2">
            <label htmlFor="transaction-type" className="text-sm font-medium text-ink/80">
              Transaction type
            </label>
            <select
              id="transaction-type"
              value={transactionType}
              onChange={(event) =>
                setTransactionType(event.target.value as TransferPricingTransactionType)
              }
              className="mt-1.5 w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="sale">Sale — UK entity sells to a connected party</option>
              <option value="purchase">Purchase — UK entity buys from a connected party</option>
            </select>
          </div>
          <div>
            <label htmlFor="actual-price" className="text-sm font-medium text-ink/80">
              Actual transaction price
            </label>
            <input
              id="actual-price"
              type="number"
              min={0}
              step="0.01"
              value={actualPrice}
              onChange={(event) => setActualPrice(event.target.value)}
              placeholder="e.g. 80000"
              className="mt-1.5 w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div />
          <div>
            <label htmlFor="arms-length-low" className="text-sm font-medium text-ink/80">
              Arm&apos;s-length range — low
            </label>
            <input
              id="arms-length-low"
              type="number"
              min={0}
              step="0.01"
              value={armsLengthLow}
              onChange={(event) => setArmsLengthLow(event.target.value)}
              placeholder="e.g. 90000"
              className="mt-1.5 w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label htmlFor="arms-length-high" className="text-sm font-medium text-ink/80">
              Arm&apos;s-length range — high
            </label>
            <input
              id="arms-length-high"
              type="number"
              min={0}
              step="0.01"
              value={armsLengthHigh}
              onChange={(event) => setArmsLengthHigh(event.target.value)}
              placeholder="e.g. 110000"
              className="mt-1.5 w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div className="sm:col-span-2">
            <Button
              type="submit"
              variant="primary"
              disabled={isPending || !actualPrice || !armsLengthLow || !armsLengthHigh}
            >
              {isPending ? "Computing…" : "Compute"}
            </Button>
          </div>
        </form>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        <p className="mt-3 text-xs leading-relaxed text-ink/50">
          Applies the TIOPA 2010 s.147 basic transfer pricing rule as a
          one-way adjustment — UK taxable profits can only be adjusted
          upward toward the arm&apos;s-length range, never downward.
          Determining the arm&apos;s-length range itself (comparables
          analysis, OECD-consistent methodology) is outside this
          calculator&apos;s scope; enter a range you&apos;ve already
          established.
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
                const isTotal = item.label.startsWith("Additional");
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

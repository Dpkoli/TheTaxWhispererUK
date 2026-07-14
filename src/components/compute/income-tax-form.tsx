"use client";

import { useRef, useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CitationChip } from "@/components/ui/citation-chip";
import { runIncomeTaxComputation } from "@/app/compute/income-tax/actions";
import { uploadIncomeTaxDocument, type UploadResult } from "@/app/compute/income-tax/upload-actions";

type ComputationResult = Awaited<ReturnType<typeof runIncomeTaxComputation>>;

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
  a.download = `income-tax-computation-${result.rateTableVersion.taxYear}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function IncomeTaxForm({ isGuest }: { isGuest: boolean }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [income, setIncome] = useState("");
  const [jurisdiction, setJurisdiction] = useState<"uk" | "scotland">("uk");
  const [result, setResult] = useState<ComputationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<UploadResult | null>(null);
  const [wasEdited, setWasEdited] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await uploadIncomeTaxDocument(formData);
      setExtraction(res);
      setWasEdited(false);
      if (res.totalPayForYear) {
        setIncome(String(res.totalPayForYear.value));
      } else {
        setUploadError(
          "Couldn't find a total pay figure in that document — enter it manually below.",
        );
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = Number(income);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Enter a valid, non-negative income figure.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await runIncomeTaxComputation(parsed, jurisdiction, extraction?.extractionId);
        setResult(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-sm font-semibold text-navy-950">
          Upload a P60 or payslip (optional)
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-ink/60">
          PDF or Excel. We&apos;ll try to read a total pay figure and pre-fill
          it below — you always review and can edit it before computing
          anything.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.xlsx,.csv"
            onChange={handleFileChange}
            disabled={isUploading}
            className="text-sm text-ink/70 file:mr-3 file:rounded-md file:border file:border-line file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink hover:file:bg-paper-muted"
          />
          {isUploading && <span className="text-xs text-ink/50">Reading document…</span>}
        </div>
        {uploadError && <p className="mt-2 text-sm text-red-700">{uploadError}</p>}

        {extraction && (extraction.totalPayForYear || extraction.totalTaxDeducted) && (
          <div className="mt-3 rounded-md border border-accent/30 bg-accent/5 p-3 text-xs text-ink/70">
            <p className="font-semibold text-navy-950">
              {wasEdited ? "Auto-extracted, then edited by you" : "Auto-extracted — review before computing"}
            </p>
            {extraction.totalPayForYear && (
              <p className="mt-1">
                Total pay for year: {currency.format(extraction.totalPayForYear.value)} (
                {extraction.totalPayForYear.confidence} confidence)
              </p>
            )}
            {extraction.totalTaxDeducted && (
              <p>
                Total tax deducted (per document): {currency.format(extraction.totalTaxDeducted.value)}
              </p>
            )}
          </div>
        )}
      </Card>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[220px]">
            <label htmlFor="income" className="text-sm font-medium text-ink/80">
              Taxable income (adjusted net income) for the tax year
            </label>
            <input
              id="income"
              type="number"
              min={0}
              step="0.01"
              value={income}
              onChange={(event) => {
                setIncome(event.target.value);
                if (extraction) setWasEdited(true);
              }}
              placeholder="e.g. 110000"
              className="mt-1.5 w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label htmlFor="jurisdiction" className="text-sm font-medium text-ink/80">
              Jurisdiction
            </label>
            <select
              id="jurisdiction"
              value={jurisdiction}
              onChange={(event) => setJurisdiction(event.target.value as "uk" | "scotland")}
              className="mt-1.5 rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="uk">Rest of UK</option>
              <option value="scotland">Scotland</option>
            </select>
          </div>
          <Button type="submit" variant="primary" disabled={isPending || !income}>
            {isPending ? "Computing…" : "Compute"}
          </Button>
        </form>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        <p className="mt-3 text-xs leading-relaxed text-ink/50">
          This v1 covers non-savings, non-dividend income only, and treats
          the figure you enter as your adjusted net income directly — it
          does not yet separately model pension contributions or Gift Aid
          reducing that figure. Clicking Compute is what confirms this
          figure, whether typed or extracted from an upload.
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

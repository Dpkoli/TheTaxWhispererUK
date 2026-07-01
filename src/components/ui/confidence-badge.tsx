import { cn } from "@/lib/cn";

const CONFIDENCE_LABELS = {
  settled_law: "Settled law",
  hmrc_view_untested: "HMRC view — not yet tested",
  interpretation: "Interpretation",
  unverified: "Unverified — needs source check",
} as const;

const CONFIDENCE_STYLES = {
  settled_law: "bg-emerald-50 text-emerald-800 border-emerald-200",
  hmrc_view_untested: "bg-amber-50 text-amber-800 border-amber-200",
  interpretation: "bg-slate-100 text-slate-700 border-slate-200",
  unverified: "bg-red-50 text-red-800 border-red-200",
} as const;

export type ConfidenceLevel = keyof typeof CONFIDENCE_LABELS;

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        CONFIDENCE_STYLES[level],
      )}
    >
      {CONFIDENCE_LABELS[level]}
    </span>
  );
}

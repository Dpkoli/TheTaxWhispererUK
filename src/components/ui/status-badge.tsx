import { cn } from "@/lib/cn";

const STATUS_LABELS = {
  in_force: "In force",
  amended: "In force — amended",
  repealed: "Repealed",
  superseded: "Superseded",
  unverified: "Unverified",
} as const;

const STATUS_STYLES = {
  in_force: "bg-emerald-50 text-emerald-800 border-emerald-200",
  amended: "bg-sky-50 text-sky-800 border-sky-200",
  repealed: "bg-slate-100 text-slate-600 border-slate-200",
  superseded: "bg-slate-100 text-slate-600 border-slate-200",
  unverified: "bg-red-50 text-red-800 border-red-200",
} as const;

export type SourceStatus = keyof typeof STATUS_LABELS;

export function StatusBadge({ status }: { status: SourceStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

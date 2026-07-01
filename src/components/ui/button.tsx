import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:opacity-50 disabled:pointer-events-none";

const variants = {
  primary: "bg-accent text-navy-950 hover:bg-accent-dark px-5 py-2.5",
  secondary:
    "bg-navy-950 text-paper hover:bg-navy-900 px-5 py-2.5 border border-navy-800",
  outline:
    "border border-line text-ink hover:bg-paper-muted px-5 py-2.5 bg-transparent",
  ghost: "text-ink hover:bg-paper-muted px-4 py-2",
};

type Variant = keyof typeof variants;

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return (
    <button className={cn(base, variants[variant], className)} {...props} />
  );
}

export function LinkButton({
  variant = "primary",
  className,
  href,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return (
    <Link href={href} className={cn(base, variants[variant], className)} {...props} />
  );
}

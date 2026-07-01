import Link from "next/link";

export function CitationChip({
  href,
  code,
}: {
  href: string;
  code: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-md border border-navy-800/20 bg-navy-950/[0.04] px-2 py-0.5 font-mono text-xs text-navy-900 no-underline transition-colors hover:border-accent hover:bg-accent/10 hover:text-accent-dark"
    >
      {code}
    </Link>
  );
}

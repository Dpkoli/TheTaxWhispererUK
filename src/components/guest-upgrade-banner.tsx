import Link from "next/link";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";

export function GuestUpgradeBanner() {
  return (
    <Card className="flex flex-col items-start gap-3 border-accent/30 bg-accent/5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-navy-950">
          You&apos;re chatting as a guest
        </p>
        <p className="mt-1 text-sm text-ink/70">
          This conversation will disappear when you close the tab. Sign in to
          keep your history, and unlock Advisory and Learning progress
          tracking.
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <LinkButton href="/sign-in" variant="primary" className="whitespace-nowrap">
          Save this chat
        </LinkButton>
      </div>
    </Card>
  );
}

export function InlineUpgradeNudge() {
  return (
    <p className="text-xs text-ink/50">
      Guest session — history won&apos;t be saved.{" "}
      <Link href="/sign-in" className="font-medium text-accent-dark hover:underline">
        Sign in to keep it
      </Link>
      .
    </p>
  );
}

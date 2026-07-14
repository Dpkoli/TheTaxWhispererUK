import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { TransferPricingForm } from "@/components/compute/transfer-pricing-form";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function TransferPricingComputePage() {
  const session = await auth();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-16">
          <Link href="/compute" className="text-sm text-accent-dark hover:underline">
            ← Tax Computation
          </Link>

          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-accent-dark">
            Corporation Tax — Transfer Pricing
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-navy-950 sm:text-3xl">
            Arm&apos;s-length adjustment computation
          </h1>
          <p className="mt-3 max-w-2xl text-ink/70">
            Compare an intra-group transaction price against an
            arm&apos;s-length range and see whether a TIOPA 2010 s.147
            profit adjustment — and the resulting Corporation Tax — applies.
          </p>

          <div className="mt-8 max-w-2xl">
            <TransferPricingForm isGuest={!session?.user} />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

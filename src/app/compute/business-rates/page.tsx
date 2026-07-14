import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { BusinessRatesForm } from "@/components/compute/business-rates-form";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function BusinessRatesComputePage() {
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
            Business Rates
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-navy-950 sm:text-3xl">
            Business Rates computation
          </h1>
          <p className="mt-3 max-w-2xl text-ink/70">
            Enter a rateable value to get a full line-by-line breakdown
            including Small Business Rate Relief, computed by
            deterministic code against a versioned GOV.UK-sourced rate
            table — never by AI arithmetic.
          </p>

          <div className="mt-8 max-w-2xl">
            <BusinessRatesForm isGuest={!session?.user} />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

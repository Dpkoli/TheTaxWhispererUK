import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { IncomeTaxForm } from "@/components/compute/income-tax-form";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function IncomeTaxComputePage() {
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
            Income Tax
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-navy-950 sm:text-3xl">
            Income Tax computation
          </h1>
          <p className="mt-3 max-w-2xl text-ink/70">
            Enter a taxable income figure to get a full line-by-line
            breakdown, computed by deterministic code against a versioned
            HMRC-sourced rate table — never by AI arithmetic.
          </p>

          <div className="mt-8 max-w-2xl">
            <IncomeTaxForm isGuest={!session?.user} />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { RdReliefForm } from "@/components/compute/rd-relief-form";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RdReliefComputePage() {
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
            R&amp;D Tax Relief
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-navy-950 sm:text-3xl">
            R&amp;D tax relief computation (merged RDEC scheme)
          </h1>
          <p className="mt-3 max-w-2xl text-ink/70">
            Enter qualifying R&amp;D expenditure to get the gross credit
            and net cash benefit after Corporation Tax on the credit
            itself — computed by deterministic code against a versioned
            GOV.UK-sourced rate table, never by AI arithmetic.
          </p>

          <div className="mt-8 max-w-2xl">
            <RdReliefForm isGuest={!session?.user} />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

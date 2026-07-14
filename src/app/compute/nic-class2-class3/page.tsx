import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { NationalInsuranceClass2Class3Form } from "@/components/compute/nic-class2-class3-form";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NationalInsuranceClass2Class3ComputePage() {
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
            National Insurance
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-navy-950 sm:text-3xl">
            Class 2 / Class 3 National Insurance position
          </h1>
          <p className="mt-3 max-w-2xl text-ink/70">
            Enter annual self-employment profits to see whether
            you&apos;re credited automatically, and what voluntary Class
            2 or Class 3 contributions would cost — computed by
            deterministic code against a versioned GOV.UK-sourced rate
            table, never by AI arithmetic.
          </p>

          <div className="mt-8 max-w-2xl">
            <NationalInsuranceClass2Class3Form isGuest={!session?.user} />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

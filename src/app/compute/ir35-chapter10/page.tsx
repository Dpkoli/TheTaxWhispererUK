import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { Ir35Chapter10Form } from "@/components/compute/ir35-chapter10-form";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Ir35Chapter10ComputePage() {
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
            IR35 / Off-Payroll Working
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-navy-950 sm:text-3xl">
            Chapter 10 fee-payer deduction computation
          </h1>
          <p className="mt-3 max-w-2xl text-ink/70">
            Enter the chain payment to get the deemed direct payment and
            the employer NIC cost the fee-payer bears on top — computed
            by deterministic code against a versioned GOV.UK-sourced rate
            table, never by AI arithmetic.
          </p>

          <div className="mt-8 max-w-2xl">
            <Ir35Chapter10Form isGuest={!session?.user} />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

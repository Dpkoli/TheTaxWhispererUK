import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { Ir35Form } from "@/components/compute/ir35-form";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Ir35ComputePage() {
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
            Deemed employment payment computation
          </h1>
          <p className="mt-3 max-w-2xl text-ink/70">
            Enter gross fee income to get the full 8-step deemed
            employment payment breakdown under ITEPA 2003 s.54, including
            the employer National Insurance grossing-up calculation —
            computed by deterministic code, never by AI arithmetic.
          </p>

          <div className="mt-8 max-w-2xl">
            <Ir35Form isGuest={!session?.user} />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";

const CALCULATORS = [
  {
    href: "/compute/income-tax",
    title: "Income Tax",
    status: "Available",
    description:
      "Personal Allowance (including the £100,000 taper) and the basic/higher/additional rate bands, for non-savings, non-dividend income.",
  },
  {
    href: null,
    title: "Capital Gains Tax",
    status: "Coming soon",
    description: "Annual exempt amount, rates, and relief calculations.",
  },
  {
    href: null,
    title: "Inheritance Tax",
    status: "Coming soon",
    description: "Nil-rate band, residence nil-rate band, and reliefs.",
  },
  {
    href: null,
    title: "National Insurance",
    status: "Coming soon",
    description: "Class 1, 2, and 4 contributions.",
  },
];

export default function ComputePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-16">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">
            Tax Computation
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-navy-950">
            Get the number right, with the working shown
          </h1>
          <p className="mt-3 max-w-2xl text-ink/70">
            Every calculation here runs on deterministic code against a
            versioned rate table — never on free-form AI arithmetic — and
            shows a full line-by-line breakdown, not just a final figure.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {CALCULATORS.map((calc) => {
              const content = (
                <Card
                  className={
                    calc.href ? "h-full transition-shadow hover:shadow-md" : "h-full opacity-60"
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base font-semibold text-navy-950">
                      {calc.title}
                    </h2>
                    <span className="whitespace-nowrap text-xs font-medium text-accent-dark">
                      {calc.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ink/70">
                    {calc.description}
                  </p>
                </Card>
              );
              return calc.href ? (
                <Link key={calc.title} href={calc.href}>
                  {content}
                </Link>
              ) : (
                <div key={calc.title}>{content}</div>
              );
            })}
          </div>

          <p className="mt-10 text-xs leading-relaxed text-ink/50">
            Illustrative — for review by a qualified professional before
            filing or relying on any result.
          </p>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

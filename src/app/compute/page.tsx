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
    href: "/compute/capital-gains-tax",
    title: "Capital Gains Tax",
    status: "Available",
    description:
      "Annual exempt amount and the basic/higher rate split based on your unused Income Tax basic rate band.",
  },
  {
    href: "/compute/inheritance-tax",
    title: "Inheritance Tax",
    status: "Available",
    description:
      "Nil-rate band and residence nil-rate band (with its £2m taper) and transferable band from a predeceased spouse. Reliefs and gifts within 7 years coming soon.",
  },
  {
    href: "/compute/national-insurance",
    title: "National Insurance (Class 1)",
    status: "Available",
    description: "Employee contributions for a single employment.",
  },
  {
    href: "/compute/national-insurance-class4",
    title: "National Insurance (Class 4)",
    status: "Available",
    description: "Self-employed contributions on annual taxable profits. Class 2 is coming soon.",
  },
  {
    href: "/compute/stamp-duty-land-tax",
    title: "SDLT / LBTT / LTT",
    status: "Available",
    description:
      "Residential property transaction tax with a jurisdiction selector — Stamp Duty Land Tax (England/NI), Land and Buildings Transaction Tax (Scotland), or Land Transaction Tax (Wales).",
  },
  {
    href: "/compute/corporation-tax",
    title: "Corporation Tax",
    status: "Available",
    description:
      "Main rate, small profits rate, and marginal relief for a single company with no associated companies.",
  },
  {
    href: "/compute/vat",
    title: "VAT",
    status: "Available",
    description: "Output VAT by rate minus reclaimable input VAT for one return period.",
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

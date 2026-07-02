import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { CitationChip } from "@/components/ui/citation-chip";

const MODULES = [
  {
    href: "/chat",
    title: "Chat",
    tag: "Talk it through",
    description:
      "Describe your situation in plain English and think it through with a patient, empathetic guide. No jargon required to get started.",
  },
  {
    href: "/advisory",
    title: "Advisory",
    tag: "The detailed breakdown",
    description:
      "Structured answers with the applicable law, HMRC manual paragraphs, relevant case law, a worked example, and a confidence flag on every point.",
  },
  {
    href: "/learning",
    title: "Learning",
    tag: "Learn it properly",
    description:
      "A syllabus-depth curriculum — comparable to professional tax papers — with legislation, cases, and practice questions built into every chapter.",
  },
  {
    href: "/compute",
    title: "Tax Computation",
    tag: "Get the number right",
    description:
      "A deterministic, audit-grade calculation engine with versioned rate tables — built for people who need a defensible figure, not an estimate.",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-line bg-gradient-to-b from-paper-muted to-paper">
          <Container className="py-20 sm:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-accent-dark">
                UK tax &amp; pensions, sourced properly
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-navy-950 sm:text-5xl">
                Your UK tax question, answered — with its working shown.
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-ink/70">
                The Tax Whisperer UK turns dense legislation, HMRC manuals, and
                tribunal rulings into answers you can actually use — and every
                claim links back to the primary source behind it. No
                generic-chatbot guessing dressed up as advice.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <LinkButton href="/chat" variant="primary" className="text-base">
                  Start chatting — free
                </LinkButton>
                <LinkButton href="/sources" variant="outline" className="text-base">
                  See how citations work
                </LinkButton>
              </div>

              <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-4 py-2 text-sm text-ink/70">
                <span aria-hidden className="text-accent-dark">
                  ✓
                </span>
                Educational and informational only — not regulated financial or
                legal advice.
              </div>
            </div>
          </Container>
        </section>

        {/* Module cards */}
        <section>
          <Container className="py-16">
            <h2 className="text-center text-2xl font-semibold text-navy-950">
              Four ways in — pick the one that matches how you want to work
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {MODULES.map((module) => (
                <Card key={module.href} className="flex flex-col">
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">
                    {module.tag}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-navy-950">
                    {module.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/70">
                    {module.description}
                  </p>
                  <Link
                    href={module.href}
                    className="mt-4 text-sm font-medium text-accent-dark hover:underline"
                  >
                    Open {module.title} →
                  </Link>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        {/* Citations proof section */}
        <section className="border-y border-line bg-navy-950 text-paper">
          <Container className="grid gap-12 py-20 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-accent-light">
                Not another AI chatbot skin
              </p>
              <h2 className="mt-3 text-3xl font-semibold">
                Every citation is a real, clickable source.
              </h2>
              <p className="mt-4 leading-relaxed text-paper/70">
                Click any Act section, HMRC manual paragraph, or tribunal case
                cited anywhere in the app and you land on its own page — full
                text, plain-English annotation, and every other answer that
                cites it. If we can&apos;t verify a citation, we say so instead of
                making one up.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-paper/70">
                <li className="flex gap-2">
                  <span className="text-accent-light">—</span>
                  Nothing is presented as settled law unless it is.
                </li>
                <li className="flex gap-2">
                  <span className="text-accent-light">—</span>
                  The Tax Computation engine never lets an AI do the arithmetic.
                </li>
                <li className="flex gap-2">
                  <span className="text-accent-light">—</span>
                  Legislation and HMRC guidance changes are tracked and
                  versioned, not silently forgotten.
                </li>
              </ul>
            </div>

            <Card className="border-white/10 bg-white text-ink">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                  Advisory answer — example
                </p>
                <ConfidenceBadge level="settled_law" />
              </div>
              <p className="mt-3 text-sm font-medium text-navy-950">
                Do I get the Personal Allowance if I earn £110,000?
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">
                No — not in full. Your Personal Allowance reduces by £1 for
                every £2 of adjusted net income above £100,000 (
                <CitationChip href="/sources/ita-2007-s35" code="ITA 2007, s.35" />
                ), tapering to nil at £125,140. &quot;Adjusted net income&quot; has
                its own precise legal meaning, set out in{" "}
                <CitationChip href="/sources/ita-2007-s58" code="ITA 2007, s.58" />.
              </p>
            </Card>
          </Container>
        </section>

        {/* Final CTA */}
        <section>
          <Container className="py-20 text-center">
            <h2 className="text-2xl font-semibold text-navy-950">
              Create a free account to save your history and track progress
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-ink/70">
              Chat works instantly as a guest. Sign in with Google, Microsoft,
              or GitHub to unlock saved chat history, Advisory, and Learning
              progress tracking.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <LinkButton href="/sign-in" variant="primary">
                Sign in / Sign up
              </LinkButton>
              <LinkButton href="/chat" variant="outline">
                Continue as guest
              </LinkButton>
            </div>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

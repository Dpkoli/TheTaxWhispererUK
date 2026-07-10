import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { ConfidenceBadge, type ConfidenceLevel } from "@/components/ui/confidence-badge";
import { AskQuestionForm } from "@/components/advisory/ask-question-form";
import { listAdvisoryQuestions } from "@/db/queries/advisory";

export const dynamic = "force-dynamic";

export default async function AdvisoryPage() {
  const items = await listAdvisoryQuestions();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-16">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">
            Advisory
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-navy-950">
            The detailed, cited breakdown
          </h1>
          <p className="mt-3 max-w-2xl text-ink/70">
            Structured answers with the applicable law, a worked example, and
            a confidence flag on every point — every citation links straight
            to its source.
          </p>

          <AskQuestionForm />

          {items.length === 0 ? (
            <Card className="mt-6">
              <p className="text-sm text-ink/60">No answered questions yet.</p>
            </Card>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {items.map(({ question, answer, topic }) => (
                <Link key={question.id} href={`/advisory/${question.id}`}>
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                      {topic && (
                        <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">
                          {topic.name}
                        </p>
                      )}
                      <ConfidenceBadge
                        level={answer.confidenceFlag as ConfidenceLevel}
                      />
                    </div>
                    <h2 className="mt-2 text-base font-semibold text-navy-950">
                      {question.rawQuestion}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-ink/70">
                      {answer.plainSummary}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          <p className="mt-10 text-xs leading-relaxed text-ink/50">
            Educational and informational only — not regulated financial or
            legal advice. Always have a qualified professional review
            anything before you file or rely on it.
          </p>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

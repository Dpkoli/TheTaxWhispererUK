import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { ConfidenceBadge, type ConfidenceLevel } from "@/components/ui/confidence-badge";
import { CitationChip } from "@/components/ui/citation-chip";
import { getAdvisoryAnswer } from "@/db/queries/advisory";

export const dynamic = "force-dynamic";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
        {title}
      </h2>
      <div className="mt-3 text-sm leading-relaxed text-ink/80">{children}</div>
    </Card>
  );
}

export default async function AdvisoryAnswerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getAdvisoryAnswer(id);
  if (!result) notFound();

  const { question, answer, topic, citations } = result;

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-16">
          <Link href="/advisory" className="text-sm text-accent-dark hover:underline">
            ← Advisory
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {topic && (
              <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">
                {topic.name}
              </p>
            )}
            <ConfidenceBadge level={answer.confidenceFlag as ConfidenceLevel} />
          </div>

          <h1 className="mt-2 text-2xl font-semibold text-navy-950 sm:text-3xl">
            {question.rawQuestion}
          </h1>

          <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <Section title="Plain-English summary">
                <p>{answer.plainSummary}</p>
              </Section>

              <Section title="Applicable law and technical analysis">
                <p>{answer.technicalAnalysis}</p>
              </Section>

              {answer.workedExample && (
                <Section title="Worked example">
                  <p className="whitespace-pre-line">{answer.workedExample}</p>
                </Section>
              )}

              {answer.complianceNotes && (
                <Section title="Compliance notes">
                  <p>{answer.complianceNotes}</p>
                </Section>
              )}

              {answer.deadlines && (
                <Section title="Deadlines">
                  <p>{answer.deadlines}</p>
                </Section>
              )}
            </div>

            <div className="space-y-4">
              <Card>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
                  Sources for this answer
                </h2>
                {citations.length === 0 ? (
                  <p className="mt-3 text-sm text-ink/50">No citations recorded.</p>
                ) : (
                  <ul className="mt-3 space-y-4">
                    {citations.map(({ citation, source }) => (
                      <li key={citation.id} className="border-l-2 border-line pl-3">
                        <CitationChip
                          href={`/sources/${source.slug}`}
                          code={source.citationCode}
                        />
                        <p className="mt-1 text-xs leading-relaxed text-ink/60">
                          {citation.claimText}
                        </p>
                        <div className="mt-1">
                          <ConfidenceBadge
                            level={citation.confidence as ConfidenceLevel}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card className="border-accent/30 bg-accent/5">
                <p className="text-xs leading-relaxed text-ink/60">
                  Educational and informational only — not regulated financial
                  or legal advice. Always have a qualified professional review
                  anything before you file or rely on it.
                </p>
              </Card>
            </div>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

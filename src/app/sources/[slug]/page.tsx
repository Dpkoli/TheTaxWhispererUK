import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { StatusBadge, type SourceStatus } from "@/components/ui/status-badge";
import { ConfidenceBadge, type ConfidenceLevel } from "@/components/ui/confidence-badge";
import { getSourceBySlug } from "@/db/queries/sources";
import { JURISDICTION_LABELS, SOURCE_TYPE_LABELS } from "@/lib/source-labels";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function SourceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getSourceBySlug(slug);
  if (!result) notFound();

  const { source, sections, topicLinks, backlinks } = result;

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-16">
          <Link href="/sources" className="text-sm text-accent-dark hover:underline">
            ← Source Library
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">
              {SOURCE_TYPE_LABELS[source.sourceType] ?? source.sourceType}
            </p>
            <StatusBadge status={source.status as SourceStatus} />
            <span className="text-xs text-ink/50">
              {JURISDICTION_LABELS[source.jurisdiction] ?? source.jurisdiction}
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-semibold text-navy-950 sm:text-3xl">
            {source.title}
          </h1>
          <p className="mt-1 font-mono text-sm text-ink/50">{source.citationCode}</p>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink/60">
            {source.effectiveFrom && (
              <span>Effective from {formatDate(source.effectiveFrom)}</span>
            )}
            {source.effectiveTo && (
              <span>Effective to {formatDate(source.effectiveTo)}</span>
            )}
            {source.lastVerifiedAt && (
              <span>
                Last verified{" "}
                {new Date(source.lastVerifiedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
          </div>

          <a
            href={source.officialUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-sm font-medium text-accent-dark hover:underline"
          >
            View the primary source ↗
          </a>

          <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-8">
              <Card>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
                  Plain-English summary
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-ink/80">
                  {source.summaryPlainEnglish}
                </p>
              </Card>

              {source.fullTextExtract && (
                <Card>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
                    Text extract
                  </h2>
                  <p className="mt-3 whitespace-pre-line font-mono text-sm leading-relaxed text-ink/80">
                    {source.fullTextExtract}
                  </p>
                </Card>
              )}

              {sections.length > 0 && (
                <Card>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
                    Pinpoint sections
                  </h2>
                  <div className="mt-3 space-y-4">
                    {sections.map((section) => (
                      <div
                        key={section.id}
                        id={section.anchorSlug}
                        className="border-l-2 border-accent/40 pl-4"
                      >
                        <p className="font-mono text-xs font-semibold text-navy-950">
                          {section.sectionLabel}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-ink/70">
                          {section.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
                  Cited by
                </h2>
                {backlinks.length === 0 ? (
                  <p className="mt-3 text-sm text-ink/50">
                    Nothing in Chat, Advisory, or Learning cites this source yet.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {backlinks.map((citation) => (
                      <li key={citation.id} className="border-l-2 border-line pl-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase tracking-wide text-ink/40">
                            {citation.contentType.replace("_", " ")}
                          </span>
                          <ConfidenceBadge
                            level={citation.confidence as ConfidenceLevel}
                          />
                        </div>
                        <p className="mt-1 text-sm text-ink/70">
                          {citation.claimText}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
                  Related topics
                </h2>
                {topicLinks.length === 0 ? (
                  <p className="mt-3 text-sm text-ink/50">Not yet tagged to a topic.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {topicLinks.map(({ topic, relevance }) => (
                      <li key={topic.id} className="flex items-center justify-between gap-2">
                        <span className="text-sm text-ink/80">{topic.name}</span>
                        <span className="text-xs uppercase tracking-wide text-ink/40">
                          {relevance}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

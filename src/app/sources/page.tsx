import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { StatusBadge, type SourceStatus } from "@/components/ui/status-badge";
import { listSources } from "@/db/queries/sources";
import { SOURCE_TYPE_LABELS } from "@/lib/source-labels";

export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  const sources = await listSources();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-16">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">
            Source Library
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-navy-950">
            Every claim in this app traces back here
          </h1>
          <p className="mt-3 max-w-2xl text-ink/70">
            Legislation, HMRC internal manuals, and tribunal decisions cited
            anywhere in Chat, Advisory, or Learning. Click through to a source
            to see its full text, current status, and everywhere it&apos;s cited.
          </p>

          {sources.length === 0 ? (
            <Card className="mt-10">
              <p className="text-sm text-ink/60">
                No sources have been indexed yet.
              </p>
            </Card>
          ) : (
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {sources.map((source) => (
                <Link key={source.id} href={`/sources/${source.slug}`}>
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">
                        {SOURCE_TYPE_LABELS[source.sourceType] ?? source.sourceType}
                      </p>
                      <StatusBadge status={source.status as SourceStatus} />
                    </div>
                    <h2 className="mt-2 text-base font-semibold text-navy-950">
                      {source.title}
                    </h2>
                    <p className="mt-1 font-mono text-xs text-ink/50">
                      {source.citationCode}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-ink/70">
                      {source.summaryPlainEnglish}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { listFlags } from "@/db/queries/ingestion";

export const dynamic = "force-dynamic";

export default async function ChangelogPage() {
  const approved = (await listFlags("approved")).filter(
    (row) => row.flag.reviewStatus === "approved",
  );

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-16">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">
            Changelog
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-navy-950">
            What changed, and when
          </h1>
          <p className="mt-3 max-w-2xl text-ink/70">
            Reviewed updates from the content update pipeline. Each entry
            links back to the affected Source Library page, which also shows
            its own &quot;last verified&quot; date.
          </p>
          <p className="mt-2 max-w-2xl text-xs text-ink/50">
            The pipeline that produces these entries is currently a
            manually-triggered simulation (see{" "}
            <Link href="/admin/ingestion" className="underline">
              the admin tool
            </Link>
            ) rather than a live scheduled scan of legislation.gov.uk, GOV.UK,
            or tribunal decisions — that&apos;s real infrastructure work for a
            later phase, not something to fake here.
          </p>

          {approved.length === 0 ? (
            <Card className="mt-8">
              <p className="text-sm text-ink/60">
                No reviewed changes yet — nothing has been approved from the
                ingestion review queue.
              </p>
            </Card>
          ) : (
            <div className="mt-8 space-y-4">
              {approved.map(({ flag, source }) => (
                <Card key={flag.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      href={`/sources/${source.slug}`}
                      className="text-sm font-semibold text-navy-950 hover:underline"
                    >
                      {source.title}
                    </Link>
                    <span className="font-mono text-xs text-ink/40">
                      {source.citationCode}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ink/70">
                    {flag.changeSummary}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

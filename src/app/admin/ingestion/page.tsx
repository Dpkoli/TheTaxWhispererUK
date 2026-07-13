import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { listFlags, listIngestionRuns } from "@/db/queries/ingestion";
import { reviewFlag, triggerIngestion } from "./actions";

export const dynamic = "force-dynamic";

export default async function IngestionAdminPage() {
  const session = await auth();
  const [runs, flags] = await Promise.all([listIngestionRuns(), listFlags()]);
  const pending = flags.filter((f) => f.flag.reviewStatus === "pending");
  const decided = flags.filter((f) => f.flag.reviewStatus !== "pending");

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-16">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">
            Content Update Pipeline — Admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-navy-950">
            Ingestion runs &amp; review queue
          </h1>
          <p className="mt-3 max-w-2xl text-ink/70">
            GOV.UK guidance sources are checked for real against GOV.UK&apos;s
            public Content API — a flag means GOV.UK reports that page
            changed since we last verified it. Legislation, HMRC manual, and
            case law sources don&apos;t have an equivalent lightweight API
            yet, so those flags are still illustrative and prefixed
            &quot;[Simulated]&quot; below. This also runs daily on a schedule
            (see <code>vercel.json</code>) — the button below triggers an
            extra on-demand pass.
          </p>
          {!session?.user && (
            <Card className="mt-6 border-accent/30 bg-accent/5">
              <p className="text-sm text-ink/70">Sign in to run or review ingestion.</p>
            </Card>
          )}

          {session?.user && session.user.role !== "admin" && (
            <Card className="mt-6 border-accent/30 bg-accent/5">
              <p className="text-sm text-ink/70">
                You&apos;re signed in, but this account doesn&apos;t hold the
                admin role, so run/review actions are disabled.
              </p>
            </Card>
          )}

          {session?.user?.role === "admin" && (
            <form action={triggerIngestion} className="mt-6">
              <Button type="submit" variant="primary">
                Run simulated ingestion check
              </Button>
            </form>
          )}

          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
                Pending review ({pending.length})
              </h2>
              <div className="mt-3 space-y-3">
                {pending.length === 0 && (
                  <p className="text-sm text-ink/50">Nothing pending.</p>
                )}
                {pending.map(({ flag, source }) => (
                  <Card key={flag.id}>
                    <p className="text-xs font-semibold text-navy-950">
                      {source.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-ink/60">
                      {flag.changeSummary}
                    </p>
                    {session?.user?.role === "admin" && (
                      <div className="mt-3 flex gap-2">
                        <form action={reviewFlag.bind(null, flag.id, "approved")}>
                          <Button type="submit" variant="outline" className="text-xs">
                            Approve
                          </Button>
                        </form>
                        <form action={reviewFlag.bind(null, flag.id, "rejected")}>
                          <Button type="submit" variant="ghost" className="text-xs">
                            Reject
                          </Button>
                        </form>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
                Recently decided
              </h2>
              <div className="mt-3 space-y-3">
                {decided.length === 0 && (
                  <p className="text-sm text-ink/50">Nothing decided yet.</p>
                )}
                {decided.map(({ flag, source }) => (
                  <Card key={flag.id} className="opacity-70">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-navy-950">
                        {source.title}
                      </p>
                      <span className="text-xs uppercase tracking-wide text-ink/40">
                        {flag.reviewStatus}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-ink/60">
                      {flag.changeSummary}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
              Ingestion run history
            </h2>
            <div className="mt-3 overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-sm">
                <thead className="bg-paper-muted text-left text-xs uppercase tracking-wide text-ink/50">
                  <tr>
                    <th className="px-4 py-2">Source type</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Flagged</th>
                    <th className="px-4 py-2">Started</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id} className="border-t border-line">
                      <td className="px-4 py-2">{run.sourceTypeScanned}</td>
                      <td className="px-4 py-2">{run.status}</td>
                      <td className="px-4 py-2">{run.sourcesFlaggedForReview}</td>
                      <td className="px-4 py-2 text-ink/60">
                        {new Date(run.startedAt).toLocaleString("en-GB")}
                      </td>
                    </tr>
                  ))}
                  {runs.length === 0 && (
                    <tr>
                      <td className="px-4 py-3 text-ink/50" colSpan={4}>
                        No runs yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

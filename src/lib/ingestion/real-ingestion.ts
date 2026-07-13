import { eq } from "drizzle-orm";
import { db } from "@/db";
import { citations, ingestionRuns, sourceChangeFlags, sources, topicSources } from "@/db/schema";
import { runMockIngestion } from "./mock-ingestion";

type GovukContentApiResponse = {
  public_updated_at?: string;
  title?: string;
};

/**
 * Real check for GOV.UK guidance sources, using GOV.UK's public Content API
 * (https://www.gov.uk/api/content/<path>), which returns `public_updated_at`
 * for any page on gov.uk. If that timestamp is newer than the source's
 * `lastVerifiedAt`, the page has changed since we last checked it and gets
 * flagged for human review — nothing is auto-applied.
 *
 * Not yet implemented for `act` (legislation.gov.uk doesn't expose an
 * equivalent lightweight "last changed" API — it would need scraping the
 * "Changes to Legislation" table or its Atom feed) or `hmrc_manual` /
 * `case_ftt` sources — those still fall back to the illustrative mock scan
 * below. This has not been exercised against live network from the
 * development sandbox (outbound HTTPS to gov.uk was blocked there); verify
 * against a real deployment before relying on it.
 */
async function checkGovukGuidanceSource(source: typeof sources.$inferSelect) {
  const url = new URL(source.officialUrl);
  const contentApiUrl = `https://www.gov.uk/api/content${url.pathname}`;

  const response = await fetch(contentApiUrl, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`GOV.UK Content API returned ${response.status} for ${contentApiUrl}`);
  }

  const data: GovukContentApiResponse = await response.json();
  const publicUpdatedAt = data.public_updated_at ? new Date(data.public_updated_at) : null;

  const hasChanged =
    publicUpdatedAt !== null &&
    (!source.lastVerifiedAt || publicUpdatedAt > source.lastVerifiedAt);

  return { hasChanged, publicUpdatedAt };
}

async function runGovukGuidanceScan() {
  const guidanceSources = await db.query.sources.findMany({
    where: eq(sources.sourceType, "govuk_guidance"),
  });

  const [run] = await db
    .insert(ingestionRuns)
    .values({
      sourceTypeScanned: "govuk_guidance",
      newSourcesFound: 0,
      sourcesFlaggedForReview: 0,
      status: "running",
    })
    .returning();

  let flagged = 0;

  for (const source of guidanceSources) {
    try {
      const { hasChanged, publicUpdatedAt } = await checkGovukGuidanceSource(source);
      if (!hasChanged) continue;

      const [topicLinks, citationLinks] = await Promise.all([
        db
          .select({ topicId: topicSources.topicId })
          .from(topicSources)
          .where(eq(topicSources.sourceId, source.id)),
        db
          .select({ contentType: citations.contentType, contentId: citations.contentId })
          .from(citations)
          .where(eq(citations.sourceId, source.id)),
      ]);

      await db.insert(sourceChangeFlags).values({
        sourceId: source.id,
        ingestionRunId: run.id,
        changeSummary: `GOV.UK reports this page was last updated ${publicUpdatedAt?.toISOString() ?? "recently"}, which is after we last verified it${source.lastVerifiedAt ? ` on ${source.lastVerifiedAt.toISOString()}` : ""}. Re-check the page text and rate figures against the live page before approving.`,
        affectedTopics: topicLinks.map((t) => t.topicId),
        affectedContent: citationLinks,
        reviewStatus: "pending",
      });
      flagged += 1;
    } catch (err) {
      // A fetch failure isn't itself a "change" — log and move on rather
      // than flagging a false positive or failing the whole run.
      console.error(`Ingestion check failed for source ${source.slug}:`, err);
    }
  }

  await db
    .update(ingestionRuns)
    .set({ completedAt: new Date(), status: "completed", sourcesFlaggedForReview: flagged })
    .where(eq(ingestionRuns.id, run.id));

  return { sourceType: "govuk_guidance" as const, scanned: guidanceSources.length, flagged };
}

/**
 * One ingestion pass: real GOV.UK Content API checks for `govuk_guidance`
 * sources, plus the existing illustrative mock scan for source types that
 * don't yet have a real check wired up.
 */
export async function runIngestion() {
  const [guidanceResult, mockResults] = await Promise.all([
    runGovukGuidanceScan(),
    runMockIngestion(),
  ]);

  return [guidanceResult, ...mockResults];
}

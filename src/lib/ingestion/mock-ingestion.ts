import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  citations,
  ingestionRuns,
  sourceChangeFlags,
  sources,
  topicSources,
} from "@/db/schema";

/**
 * Simulates one ingestion pipeline pass across the three source types we
 * currently track. This does NOT call legislation.gov.uk, GOV.UK, or any
 * tribunal decision feed — there is no live scanning connected yet. It
 * exists to exercise the IngestionRun / SourceChangeFlag / review pipeline
 * end-to-end against real seeded Sources, with every produced flag
 * prefixed "[Simulated]" so it's never mistaken for a real detected change.
 *
 * A production version would replace this function's body with real
 * fetch/diff logic against those external sources, run on a schedule
 * (Vercel Cron hitting an API route, or a Supabase Edge Function on cron)
 * instead of a manual trigger.
 */
const SCAN_PLAN: Array<{
  sourceType: "act" | "hmrc_manual" | "case_ftt";
  sourceSlug: string;
  changeSummary: string;
}> = [
  {
    sourceType: "act",
    sourceSlug: "ita-2007-s35",
    changeSummary:
      "[Simulated] Personal Allowance figures are typically confirmed for the next tax year around Budget/Autumn Statement time. Recommend re-verifying this section and its RateTable once the next tax year's rates are confirmed — no live change detected in this run.",
  },
  {
    sourceType: "hmrc_manual",
    sourceSlug: "hmrc-ptm057100",
    changeSummary:
      "[Simulated] HMRC internal manuals are sometimes revised outside the Finance Act cycle. Recommend re-verifying this page's text extract next quarter — no live change detected in this run.",
  },
  {
    sourceType: "case_ftt",
    sourceSlug: "russell-v-hmrc-2026-ukftt-367",
    changeSummary:
      "[Simulated] Citator check: no subsequent tribunal or appellate decisions referencing this case were found in this run.",
  },
];

export async function runMockIngestion() {
  const summaries: { sourceType: string; flagged: boolean }[] = [];

  for (const plan of SCAN_PLAN) {
    const source = await db.query.sources.findFirst({
      where: eq(sources.slug, plan.sourceSlug),
    });

    const [run] = await db
      .insert(ingestionRuns)
      .values({
        sourceTypeScanned: plan.sourceType,
        completedAt: new Date(),
        newSourcesFound: 0,
        sourcesFlaggedForReview: source ? 1 : 0,
        status: "completed",
      })
      .returning();

    if (!source) {
      summaries.push({ sourceType: plan.sourceType, flagged: false });
      continue;
    }

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
      changeSummary: plan.changeSummary,
      affectedTopics: topicLinks.map((t) => t.topicId),
      affectedContent: citationLinks,
      reviewStatus: "pending",
    });

    summaries.push({ sourceType: plan.sourceType, flagged: true });
  }

  return summaries;
}

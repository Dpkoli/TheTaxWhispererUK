import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { citations, sources, sourceSections, topics, topicSources } from "@/db/schema";

export async function listSources() {
  return db.query.sources.findMany({
    orderBy: [asc(sources.sourceType), asc(sources.title)],
  });
}

export async function getSourceBySlug(slug: string) {
  const source = await db.query.sources.findFirst({
    where: eq(sources.slug, slug),
  });
  if (!source) return null;

  const [sections, topicLinks, backlinks] = await Promise.all([
    db.query.sourceSections.findMany({
      where: eq(sourceSections.sourceId, source.id),
    }),
    db
      .select({ topic: topics, relevance: topicSources.relevance })
      .from(topicSources)
      .innerJoin(topics, eq(topicSources.topicId, topics.id))
      .where(eq(topicSources.sourceId, source.id)),
    db.query.citations.findMany({
      where: eq(citations.sourceId, source.id),
    }),
  ]);

  return { source, sections, topicLinks, backlinks };
}

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  advisoryAnswers,
  advisoryQuestions,
  citations,
  sourceSections,
  sources,
  topics,
} from "@/db/schema";

export async function listAllSourcesForContext() {
  const allSources = await db.query.sources.findMany({
    columns: {
      id: true,
      slug: true,
      sourceType: true,
      title: true,
      citationCode: true,
      summaryPlainEnglish: true,
      fullTextExtract: true,
      status: true,
    },
  });

  const allSections = await db.query.sourceSections.findMany({
    columns: { sourceId: true, sectionLabel: true, anchorSlug: true, text: true },
  });
  const sectionsBySourceId = new Map<string, typeof allSections>();
  for (const section of allSections) {
    const list = sectionsBySourceId.get(section.sourceId) ?? [];
    list.push(section);
    sectionsBySourceId.set(section.sourceId, list);
  }

  return allSources.map((source) => ({
    ...source,
    sections: sectionsBySourceId.get(source.id) ?? [],
  }));
}

export async function listAllTopicsForContext() {
  return db.query.topics.findMany({
    columns: { slug: true, name: true },
  });
}

export async function listAdvisoryQuestions() {
  return db
    .select({
      question: advisoryQuestions,
      answer: advisoryAnswers,
      topic: topics,
    })
    .from(advisoryQuestions)
    .innerJoin(advisoryAnswers, eq(advisoryAnswers.questionId, advisoryQuestions.id))
    .leftJoin(topics, eq(topics.id, advisoryQuestions.topicId))
    .orderBy(desc(advisoryQuestions.createdAt));
}

export async function getAdvisoryAnswer(questionId: string) {
  const row = await db
    .select({
      question: advisoryQuestions,
      answer: advisoryAnswers,
      topic: topics,
    })
    .from(advisoryQuestions)
    .innerJoin(advisoryAnswers, eq(advisoryAnswers.questionId, advisoryQuestions.id))
    .leftJoin(topics, eq(topics.id, advisoryQuestions.topicId))
    .where(eq(advisoryQuestions.id, questionId))
    .limit(1);

  if (row.length === 0) return null;

  const { question, answer, topic } = row[0];

  const answerCitations = await db
    .select({ citation: citations, source: sources, sourceSection: sourceSections })
    .from(citations)
    .innerJoin(sources, eq(sources.id, citations.sourceId))
    .leftJoin(sourceSections, eq(sourceSections.id, citations.sourceSectionId))
    .where(
      and(eq(citations.contentId, answer.id), eq(citations.contentType, "advisory_answer")),
    );

  return { question, answer, topic, citations: answerCitations };
}

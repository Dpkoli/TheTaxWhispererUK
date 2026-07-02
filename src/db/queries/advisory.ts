import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  advisoryAnswers,
  advisoryQuestions,
  citations,
  sources,
  topics,
} from "@/db/schema";

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
    .select({ citation: citations, source: sources })
    .from(citations)
    .innerJoin(sources, eq(sources.id, citations.sourceId))
    .where(
      and(eq(citations.contentId, answer.id), eq(citations.contentType, "advisory_answer")),
    );

  return { question, answer, topic, citations: answerCitations };
}

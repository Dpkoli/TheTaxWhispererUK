import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  citations,
  learningChapters,
  learningSections,
  sources,
  topics,
  userLearningProgress,
} from "@/db/schema";

export async function listChapters() {
  return db
    .select({ chapter: learningChapters, topic: topics })
    .from(learningChapters)
    .innerJoin(topics, eq(topics.id, learningChapters.topicId))
    .orderBy(asc(topics.difficultyLevel), asc(learningChapters.orderIndex));
}

export async function getChapterProgress(userId: string) {
  return db.query.userLearningProgress.findMany({
    where: eq(userLearningProgress.userId, userId),
  });
}

export async function getChapterById(chapterId: string) {
  const row = await db
    .select({ chapter: learningChapters, topic: topics })
    .from(learningChapters)
    .innerJoin(topics, eq(topics.id, learningChapters.topicId))
    .where(eq(learningChapters.id, chapterId))
    .limit(1);

  if (row.length === 0) return null;
  const { chapter, topic } = row[0];

  const sections = await db.query.learningSections.findMany({
    where: eq(learningSections.chapterId, chapterId),
    orderBy: [asc(learningSections.orderIndex)],
  });

  const sectionIds = sections.map((s) => s.id);

  const [questions, sectionCitations] = await Promise.all([
    db.query.practiceQuestions.findMany({
      where: (pq, { inArray }) => inArray(pq.learningSectionId, sectionIds),
    }),
    db
      .select({ citation: citations, source: sources, sectionId: citations.contentId })
      .from(citations)
      .innerJoin(sources, eq(sources.id, citations.sourceId))
      .where(eq(citations.contentType, "learning_section")),
  ]);

  const citationsBySection = new Map<string, typeof sectionCitations>();
  for (const row of sectionCitations) {
    if (!sectionIds.includes(row.sectionId)) continue;
    const list = citationsBySection.get(row.sectionId) ?? [];
    list.push(row);
    citationsBySection.set(row.sectionId, list);
  }

  const questionsBySection = new Map<string, typeof questions>();
  for (const question of questions) {
    const list = questionsBySection.get(question.learningSectionId) ?? [];
    list.push(question);
    questionsBySection.set(question.learningSectionId, list);
  }

  return {
    chapter,
    topic,
    sections: sections.map((section) => ({
      ...section,
      citations: citationsBySection.get(section.id) ?? [],
      questions: questionsBySection.get(section.id) ?? [],
    })),
  };
}

export async function getUserProgressForChapter(userId: string, chapterId: string) {
  return db.query.userLearningProgress.findFirst({
    where: and(
      eq(userLearningProgress.userId, userId),
      eq(userLearningProgress.chapterId, chapterId),
    ),
  });
}

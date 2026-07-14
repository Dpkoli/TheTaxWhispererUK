"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { advisoryAnswers, advisoryQuestions, citations, sourceSections, topics } from "@/db/schema";
import { auth } from "@/lib/auth";
import { generateAdvisoryAnswer } from "@/lib/advisory-llm";
import { listAllSourcesForContext, listAllTopicsForContext } from "@/db/queries/advisory";
import { recordContentVersion } from "@/db/queries/versioning";

export type AskAdvisoryResult =
  | { covered: true; questionId: string }
  | { covered: false; message: string };

export async function askAdvisoryQuestion(rawQuestion: string): Promise<AskAdvisoryResult> {
  const trimmed = rawQuestion.trim();
  if (!trimmed) {
    throw new Error("Question cannot be empty");
  }

  const [sourceContext, topicContext, session] = await Promise.all([
    listAllSourcesForContext(),
    listAllTopicsForContext(),
    auth(),
  ]);

  let llmOutput;
  try {
    llmOutput = await generateAdvisoryAnswer(trimmed, sourceContext, topicContext);
  } catch (error) {
    console.error("Advisory generation failed:", error);
    throw new Error(
      "Couldn't generate an answer just now — please try again in a moment.",
    );
  }

  if (!llmOutput.hasCoverage || llmOutput.citations.length === 0) {
    return {
      covered: false,
      message:
        "We don't have cited coverage for this yet — rather than guess, we're not generating an answer. Try Chat for a plain-English conversation instead, or check back as the Source Library grows.",
    };
  }

  const topicRow = llmOutput.topicSlug
    ? await db.query.topics.findFirst({ where: eq(topics.slug, llmOutput.topicSlug) })
    : null;

  const [question] = await db
    .insert(advisoryQuestions)
    .values({
      userId: session?.user?.id ?? null,
      topicId: topicRow?.id ?? null,
      rawQuestion: trimmed,
    })
    .returning();

  const [answer] = await db
    .insert(advisoryAnswers)
    .values({
      questionId: question.id,
      plainSummary: llmOutput.plainSummary,
      technicalAnalysis: llmOutput.technicalAnalysis,
      workedExample: llmOutput.workedExample,
      complianceNotes: llmOutput.complianceNotes,
      deadlines: llmOutput.deadlines,
      confidenceFlag: llmOutput.confidenceFlag,
    })
    .returning();

  const sourceRows = await db.query.sources.findMany({
    where: (s, { inArray }) =>
      inArray(
        s.slug,
        llmOutput.citations.map((c) => c.sourceSlug),
      ),
  });
  const sourceIdBySlug = new Map(sourceRows.map((s) => [s.slug, s.id]));

  const sectionRows = await db.query.sourceSections.findMany({
    where: (ss, { inArray }) => inArray(ss.sourceId, [...sourceIdBySlug.values()]),
  });
  const sectionIdByKey = new Map(
    sectionRows.map((ss) => [`${ss.sourceId}:${ss.anchorSlug}`, ss.id]),
  );

  await db.insert(citations).values(
    llmOutput.citations
      .filter((c) => sourceIdBySlug.has(c.sourceSlug))
      .map((c) => {
        const sourceId = sourceIdBySlug.get(c.sourceSlug)!;
        const sourceSectionId = c.sectionAnchorSlug
          ? sectionIdByKey.get(`${sourceId}:${c.sectionAnchorSlug}`) ?? null
          : null;
        return {
          contentType: "advisory_answer" as const,
          contentId: answer.id,
          sourceId,
          sourceSectionId,
          claimText: c.claimText,
          confidence: c.confidence,
        };
      }),
  );

  await recordContentVersion(
    "advisory_answer",
    answer.id,
    { question: trimmed, ...llmOutput },
    "Initial answer generated for a new Advisory question",
    "manual_edit",
  );

  revalidatePath("/advisory");
  revalidatePath(`/advisory/${question.id}`);

  return { covered: true, questionId: question.id };
}

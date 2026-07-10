"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { advisoryAnswers, advisoryQuestions, citations, topics } from "@/db/schema";
import { auth } from "@/lib/auth";
import { generateAdvisoryAnswer } from "@/lib/advisory-llm";
import { listAllSourcesForContext, listAllTopicsForContext } from "@/db/queries/advisory";

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

  await db.insert(citations).values(
    llmOutput.citations
      .filter((c) => sourceIdBySlug.has(c.sourceSlug))
      .map((c) => ({
        contentType: "advisory_answer" as const,
        contentId: answer.id,
        sourceId: sourceIdBySlug.get(c.sourceSlug)!,
        claimText: c.claimText,
        confidence: c.confidence,
      })),
  );

  revalidatePath("/advisory");
  revalidatePath(`/advisory/${question.id}`);

  return { covered: true, questionId: question.id };
}

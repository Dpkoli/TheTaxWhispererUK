import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { CitationChip } from "@/components/ui/citation-chip";
import { ConfidenceBadge, type ConfidenceLevel } from "@/components/ui/confidence-badge";
import { PracticeQuestion } from "@/components/learning/practice-question";
import { MarkCompleteButton } from "@/components/learning/mark-complete-button";
import { auth } from "@/lib/auth";
import { getChapterById, getUserProgressForChapter } from "@/db/queries/learning";

export const dynamic = "force-dynamic";

const SECTION_TITLES: Record<string, string> = {
  explanation: "Explanation",
  worked_example: "Worked example",
  practice_question: "Practice questions",
  key_takeaways: "Key takeaways",
};

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, session] = await Promise.all([getChapterById(id), auth()]);
  if (!result) notFound();

  const { chapter, topic, sections } = result;

  const progress = session?.user?.id
    ? await getUserProgressForChapter(session.user.id, chapter.id)
    : null;

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-16">
          <Link href="/learning" className="text-sm text-accent-dark hover:underline">
            ← Learning
          </Link>

          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-accent-dark">
            {topic.name}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-navy-950 sm:text-3xl">
            {chapter.title}
          </h1>
          <p className="mt-3 max-w-2xl text-ink/70">{chapter.summary}</p>

          <div className="mt-8 max-w-3xl space-y-6">
            {sections.map((section) => (
              <Card
                key={section.id}
                className={
                  section.sectionType === "key_takeaways"
                    ? "border-accent/30 bg-accent/5"
                    : undefined
                }
              >
                <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
                  {SECTION_TITLES[section.sectionType] ?? section.sectionType}
                </h2>

                {section.sectionType === "practice_question" ? (
                  <div className="mt-3 space-y-3">
                    {section.questions.map((q, i) => (
                      <PracticeQuestion
                        key={q.id}
                        index={i + 1}
                        questionText={q.questionText}
                        questionFormat={q.questionFormat}
                        options={q.options}
                        correctAnswer={q.correctAnswer}
                        explanation={q.explanation}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink/80">
                    {section.body}
                  </p>
                )}

                {section.citations.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-line pt-3">
                    {section.citations.map(({ citation, source }) => (
                      <div key={citation.id} className="flex flex-wrap items-center gap-2">
                        <CitationChip
                          href={`/sources/${source.slug}`}
                          code={source.citationCode}
                        />
                        <span className="text-xs text-ink/50">
                          {citation.claimText}
                        </span>
                        <ConfidenceBadge
                          level={citation.confidence as ConfidenceLevel}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
              <Link href="/advisory" className="text-sm font-medium text-accent-dark hover:underline">
                See the cited Advisory answer for this topic →
              </Link>
              {session?.user ? (
                <MarkCompleteButton
                  chapterId={chapter.id}
                  alreadyCompleted={progress?.status === "completed"}
                />
              ) : (
                <Link href="/sign-in" className="text-sm font-medium text-accent-dark hover:underline">
                  Sign in to track your progress →
                </Link>
              )}
            </div>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

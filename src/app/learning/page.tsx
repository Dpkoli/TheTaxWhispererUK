import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getChapterProgress, listChapters } from "@/db/queries/learning";

export const dynamic = "force-dynamic";

const DIFFICULTY_LABELS: Record<string, string> = {
  foundational: "Foundational",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export default async function LearningPage() {
  const [session, chapters] = await Promise.all([auth(), listChapters()]);

  const progress = session?.user?.id
    ? await getChapterProgress(session.user.id)
    : [];
  const progressByChapter = new Map(progress.map((p) => [p.chapterId, p.status]));

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-16">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">
            Learning
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-navy-950">
            A proper curriculum, not a listicle
          </h1>
          <p className="mt-3 max-w-2xl text-ink/70">
            Each chapter builds up the law, the manuals, and the case law
            inline, with worked examples and practice questions — start
            foundational and work up.
          </p>

          {!session?.user && (
            <Card className="mt-8 border-accent/30 bg-accent/5">
              <p className="text-sm text-ink/70">
                <Link href="/sign-in" className="font-semibold text-accent-dark hover:underline">
                  Sign in
                </Link>{" "}
                to track which chapters you&apos;ve completed.
              </p>
            </Card>
          )}

          {chapters.length === 0 ? (
            <Card className="mt-8">
              <p className="text-sm text-ink/60">No chapters published yet.</p>
            </Card>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {chapters.map(({ chapter, topic }) => {
                const status = progressByChapter.get(chapter.id);
                return (
                  <Link key={chapter.id} href={`/learning/${chapter.id}`}>
                    <Card className="h-full transition-shadow hover:shadow-md">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">
                          {DIFFICULTY_LABELS[topic.difficultyLevel] ?? topic.difficultyLevel}
                        </p>
                        {status === "completed" && (
                          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                            Completed
                          </span>
                        )}
                      </div>
                      <h2 className="mt-2 text-base font-semibold text-navy-950">
                        {chapter.title}
                      </h2>
                      <p className="mt-3 text-sm leading-relaxed text-ink/70">
                        {chapter.summary}
                      </p>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { askAdvisoryQuestion } from "@/app/advisory/actions";

export function AskQuestionForm() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [notCoveredMessage, setNotCoveredMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isPending) return;

    setError(null);
    setNotCoveredMessage(null);

    startTransition(async () => {
      try {
        const result = await askAdvisoryQuestion(trimmed);
        if (result.covered) {
          setQuestion("");
          router.push(`/advisory/${result.questionId}`);
        } else {
          setNotCoveredMessage(result.message);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <Card className="mt-8 border-accent/30 bg-accent/5">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[240px]">
          <label htmlFor="advisory-question" className="text-sm font-medium text-ink/80">
            Ask a question
          </label>
          <input
            id="advisory-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="e.g. Do I get the Personal Allowance if I earn £110,000?"
            className="mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <Button type="submit" variant="primary" disabled={isPending || !question.trim()}>
          {isPending ? "Checking sources…" : "Ask"}
        </Button>
      </form>

      <p className="mt-3 text-xs leading-relaxed text-ink/60">
        Answers are only generated from real, cited sources already in the
        Source Library — if nothing relevant is indexed yet, we&apos;ll say so
        rather than guess.
      </p>

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

      {notCoveredMessage && (
        <p className="mt-3 text-sm text-ink/70">
          {notCoveredMessage}{" "}
          <Link href="/chat" className="font-medium text-accent-dark hover:underline">
            Open Chat →
          </Link>
        </p>
      )}
    </Card>
  );
}

"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markChapterComplete } from "@/app/learning/actions";

export function MarkCompleteButton({
  chapterId,
  alreadyCompleted,
}: {
  chapterId: string;
  alreadyCompleted: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  if (alreadyCompleted) {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800">
        Chapter completed
      </span>
    );
  }

  return (
    <Button
      variant="primary"
      disabled={isPending}
      onClick={() => startTransition(() => markChapterComplete(chapterId))}
    >
      {isPending ? "Saving…" : "Mark chapter complete"}
    </Button>
  );
}

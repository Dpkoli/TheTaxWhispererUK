"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

type Props = {
  index: number;
  questionText: string;
  questionFormat: string;
  options: unknown;
  correctAnswer: string;
  explanation: string;
};

export function PracticeQuestion({
  index,
  questionText,
  questionFormat,
  options,
  correctAnswer,
  explanation,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const parsedOptions = Array.isArray(options) ? (options as string[]) : null;

  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <p className="text-sm font-semibold text-navy-950">
        {index}. {questionText}
      </p>

      {questionFormat === "mcq" && parsedOptions ? (
        <div className="mt-3 space-y-2">
          {parsedOptions.map((option) => {
            const isSelected = selected === option;
            const isCorrect = revealed && option === correctAnswer;
            const isWrongSelected = revealed && isSelected && option !== correctAnswer;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setSelected(option)}
                className={cn(
                  "block w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
                  isCorrect && "border-emerald-400 bg-emerald-50 text-emerald-900",
                  isWrongSelected && "border-red-300 bg-red-50 text-red-800",
                  !revealed && isSelected && "border-accent bg-accent/10",
                  !revealed && !isSelected && "border-line hover:bg-paper-muted",
                  revealed && !isCorrect && !isWrongSelected && "border-line text-ink/50",
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
      ) : (
        <textarea
          value={selected ?? ""}
          onChange={(event) => setSelected(event.target.value)}
          placeholder="Type your answer…"
          rows={2}
          className="mt-3 w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      )}

      <button
        type="button"
        onClick={() => setRevealed(true)}
        disabled={!selected || revealed}
        className="mt-3 text-xs font-semibold text-accent-dark hover:underline disabled:cursor-not-allowed disabled:opacity-40"
      >
        Check answer
      </button>

      {revealed && (
        <div className="mt-3 rounded-md bg-paper-muted p-3 text-xs leading-relaxed text-ink/70">
          <p className="font-semibold text-navy-950">Answer: {correctAnswer}</p>
          <p className="mt-1">{explanation}</p>
        </div>
      )}
    </div>
  );
}

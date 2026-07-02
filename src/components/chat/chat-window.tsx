"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { GuestUpgradeBanner } from "@/components/guest-upgrade-banner";
import { sendChatMessage } from "@/app/chat/actions";
import { cn } from "@/lib/cn";

type Message = {
  id: string;
  role: "user" | "assistant";
  body: string;
};

const ESCALATION_MARKER = "Open in Advisory →";

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const hasEscalation = message.body.includes(ESCALATION_MARKER);
  const text = hasEscalation
    ? message.body.replace(ESCALATION_MARKER, "").trim()
    : message.body;

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[70%]",
          isUser
            ? "bg-navy-950 text-paper"
            : "border border-line bg-white text-ink",
        )}
      >
        <p>{text}</p>
        {hasEscalation && (
          <Link
            href="/advisory"
            className="mt-2 inline-block text-xs font-semibold text-accent-dark hover:underline"
          >
            Open in Advisory →
          </Link>
        )}
      </div>
    </div>
  );
}

export function ChatWindow({
  isGuest,
  initialMessages,
}: {
  isGuest: boolean;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isPending) return;

    const optimisticUserMessage: Message = {
      id: `optimistic-${Date.now()}`,
      role: "user",
      body: trimmed,
    };
    setMessages((prev) => [...prev, optimisticUserMessage]);
    setInput("");

    startTransition(async () => {
      const result = await sendChatMessage(trimmed);
      const userMessageId = result.persisted
        ? result.userMessage.id
        : optimisticUserMessage.id;
      const assistantMessageId = result.persisted
        ? result.assistantMessage.id
        : `assistant-${Date.now()}`;

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticUserMessage.id),
        { id: userMessageId, role: "user", body: result.userMessage.body },
        { id: assistantMessageId, role: "assistant", body: result.assistantMessage.body },
      ]);
    });
  }

  return (
    <div className="flex flex-1 flex-col">
      <Container className="flex flex-1 flex-col py-6">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">
            Chat
          </p>
          <h1 className="mt-1 text-xl font-semibold text-navy-950">
            Talk it through, in plain English
          </h1>
        </div>

        {isGuest && (
          <div className="mb-4">
            <GuestUpgradeBanner />
          </div>
        )}

        <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-line bg-paper-muted/50 p-4">
          {messages.length === 0 ? (
            <p className="text-sm text-ink/50">
              Describe your situation and I&apos;ll help you think it through — no
              jargon required to get started.
            </p>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
          {isPending && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink/40">
                Thinking…
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="sticky bottom-0 mt-4 flex gap-2 border-t border-line bg-paper pt-4"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about a UK tax or pension situation…"
            className="flex-1 rounded-md border border-line bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <Button type="submit" variant="primary" disabled={isPending || !input.trim()}>
            Send
          </Button>
        </form>

        {!isGuest && (
          <p className="mt-2 text-xs text-ink/40">
            Signed in — this conversation is saved to your account.
          </p>
        )}
      </Container>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2, MessageCircle, RotateCcw, Send, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/cn";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "aida-assistant";
export const OPEN_ASSISTANT_EVENT = "aida:open-assistant";

const SUGGESTIONS = [
  "What programmes does AIDA offer?",
  "How do I register my interest?",
  "Is registering interest the same as applying?",
  "How can I contact AIDA?",
];

const GREETING: Message = {
  role: "assistant",
  content:
    "Hello! I'm Ask AIDA. I can answer questions about the Artificial Intelligence Digital Academy using its published information. What would you like to know?",
};

function loadSaved(): { conversationId: string | null; messages: Message[] } | null {
  if (typeof window === "undefined") return null;
  try {
    const data = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null") as {
      conversationId: string | null;
      messages: Message[];
    } | null;
    return data && Array.isArray(data.messages) && data.messages.length ? data : null;
  } catch {
    return null;
  }
}

/** Turns site paths like /programmes in a reply into links, without rendering any HTML. */
function linkify(text: string): ReactNode[] {
  const parts = text.split(/(\/(?:programmes(?:\/[a-z0-9-]+)?|register-interest|contact|about|privacy|faq)\b)/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <Link key={i} href={part} className="font-semibold text-brand-700 underline underline-offset-2">
        {part}
      </Link>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  // Restore this browser tab's conversation (convenience only). The panel is closed on
  // first render, so restored messages never affect server-rendered markup.
  const [saved] = useState(loadSaved);
  const [messages, setMessages] = useState<Message[]>(saved?.messages ?? [GREETING]);
  const [conversationId, setConversationId] = useState<string | null>(saved?.conversationId ?? null);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  /** Latest `send`, so the open-assistant event can ask a question straight away. */
  const sendRef = useRef<(text: string) => void>(() => {});

  useEffect(() => {
    const openHandler = (e: Event) => {
      setOpen(true);
      const question = (e as CustomEvent<{ question?: string }>).detail?.question;
      if (question) setTimeout(() => sendRef.current(question), 0);
    };
    window.addEventListener(OPEN_ASSISTANT_EVENT, openHandler);
    return () => window.removeEventListener(OPEN_ASSISTANT_EVENT, openHandler);
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ conversationId, messages }));
    } catch {
      /* storage unavailable */
    }
  }, [conversationId, messages]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        launcherRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || pending) return;
      setError(null);
      setInput("");
      setMessages((m) => [...m, { role: "user", content: message }]);
      setPending(true);
      try {
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, message }),
        });
        const data = (await res.json().catch(() => ({}))) as { reply?: string; conversationId?: string; error?: string };
        if (!res.ok || !data.reply) throw new Error(data.error || "The assistant is temporarily unavailable.");
        setConversationId(data.conversationId ?? null);
        setMessages((m) => [...m, { role: "assistant", content: data.reply! }]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      } finally {
        setPending(false);
        inputRef.current?.focus();
      }
    },
    [conversationId, pending],
  );

  useEffect(() => {
    sendRef.current = (text: string) => void send(text);
  }, [send]);

  const reset = () => {
    setMessages([GREETING]);
    setConversationId(null);
    setError(null);
    inputRef.current?.focus();
  };

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="aida-assistant"
        className={cn(
          "fixed right-4 bottom-4 z-[70] flex items-center gap-2 rounded-full bg-brand-600 px-5 py-3.5 font-semibold text-white shadow-(--shadow-glow) transition-transform hover:scale-105 hover:bg-brand-700 sm:right-6 sm:bottom-6",
          open && "hidden sm:flex",
        )}
      >
        {open ? <X className="size-5" aria-hidden /> : <Sparkles className="size-5" aria-hidden />}
        <span>{open ? "Close" : "Ask AIDA"}</span>
      </button>

      {open && (
        <section
          id="aida-assistant"
          role="dialog"
          aria-label="Ask AIDA assistant"
          className="fixed inset-0 z-[80] flex flex-col bg-surface sm:inset-auto sm:right-6 sm:bottom-24 sm:h-[min(640px,calc(100vh-8rem))] sm:w-[400px] sm:rounded-(--radius-card) sm:border sm:border-border sm:shadow-2xl"
        >
          <header className="flex items-center justify-between gap-3 bg-ink-950 px-4 py-3.5 text-white sm:rounded-t-(--radius-card)">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500">
                <MessageCircle className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-display font-bold">Ask AIDA</p>
                <p className="text-xs text-ink-300">Answers from AIDA&apos;s published information</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={reset}
                className="rounded-lg p-2 text-ink-300 hover:bg-white/10 hover:text-white"
                aria-label="Start a new conversation"
                title="New conversation"
              >
                <RotateCcw className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  launcherRef.current?.focus();
                }}
                className="rounded-lg p-2 text-ink-300 hover:bg-white/10 hover:text-white"
                aria-label="Close assistant"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-ink-50 p-4" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <p
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line",
                    m.role === "user"
                      ? "rounded-br-md bg-brand-600 text-white"
                      : "rounded-bl-md border border-border bg-surface text-ink-800",
                  )}
                >
                  <span className="sr-only">{m.role === "user" ? "You: " : "Assistant: "}</span>
                  {m.role === "assistant" ? linkify(m.content) : m.content}
                </p>
              </div>
            ))}
            {pending && (
              <div className="flex justify-start" role="status">
                <span className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-border bg-surface px-3.5 py-2.5 text-sm text-ink-600">
                  <Loader2 className="size-4 animate-spin" aria-hidden /> Thinking…
                </span>
              </div>
            )}
            {messages.length === 1 && !pending && (
              <div className="pt-2">
                <p className="mb-2 text-xs font-semibold tracking-wide text-ink-500 uppercase">Try asking</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border border-brand-200 bg-surface px-3 py-1.5 text-left text-xs font-medium text-brand-800 hover:bg-brand-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="border-t border-border bg-surface p-3"
          >
            {error && (
              <p role="alert" className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {error}
              </p>
            )}
            <div className="flex items-end gap-2">
              <label htmlFor="aida-assistant-input" className="sr-only">
                Your question
              </label>
              <textarea
                id="aida-assistant-input"
                ref={inputRef}
                rows={1}
                maxLength={1000}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                placeholder="Type your question…"
                className="max-h-32 min-h-11 flex-1 resize-none rounded-(--radius-control) border border-ink-300 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-100 focus:outline-none"
              />
              <button
                type="submit"
                disabled={pending || !input.trim()}
                className="flex size-11 shrink-0 items-center justify-center rounded-(--radius-control) bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
                aria-label="Send question"
              >
                <Send className="size-4" aria-hidden />
              </button>
            </div>
            <p className="mt-2 text-[0.7rem] leading-snug text-ink-500">
              Please don&apos;t share personal details. Chats are kept for 30 days to improve answers (see{" "}
              <Link href="/privacy" className="underline">
                privacy
              </Link>
              ). Answers may be incomplete; this is not an admission application.
            </p>
          </form>
        </section>
      )}
    </>
  );
}

/** A button anywhere on the site that opens the assistant, optionally asking a question straight away. */
export function OpenAssistantButton({
  className,
  children,
  question,
}: {
  className?: string;
  children: ReactNode;
  question?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_ASSISTANT_EVENT, { detail: { question } }))}
    >
      {children}
    </button>
  );
}

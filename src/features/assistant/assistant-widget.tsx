"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { RotateCcw, Send, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { WELCOME } from "./offline";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "aida-assistant";
export const OPEN_ASSISTANT_EVENT = "aida:open-assistant";
export const ASSISTANT_AVATAR = "/images/ask-aida-avatar.webp";
export const ASSISTANT_IMAGE = "/images/ask-aida-full.webp";

const SUGGESTIONS = ["What is the course fee?", "Class timings kya hain?", "Do I need a laptop?", "Refund policy kya hai?"];

const GREETING: Message = { role: "assistant", content: WELCOME };

function Avatar({ size, className }: { size: number; className?: string }) {
  return (
    <Image
      src={ASSISTANT_AVATAR}
      alt=""
      width={size}
      height={size}
      unoptimized
      className={cn("shrink-0 rounded-full", className)}
    />
  );
}

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

/** Turns site paths like /fees-admission in a reply into links, without rendering any HTML. */
function linkify(text: string): ReactNode[] {
  const parts = text.split(
    /(\/(?:programmes(?:\/[a-z0-9-]+)?|programme|curriculum|fees-admission|admission|founder|register-interest|contact|about|privacy|faq)\b)/g,
  );
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
  // Restore this browser tab's conversation, so it continues across pages. The panel is
  // closed on first render, so restored messages never affect server-rendered markup.
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
  }, [messages, pending, open]);

  // Keep the launcher just below the site header (which moves when the preview banner scrolls away).
  useEffect(() => {
    const place = () => {
      const bottom = document.querySelector("header")?.getBoundingClientRect().bottom ?? 64;
      document.documentElement.style.setProperty("--aida-top", `${Math.max(bottom, 0) + 12}px`);
    };
    place();
    window.addEventListener("scroll", place, { passive: true });
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place);
      window.removeEventListener("resize", place);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setTimeout(() => launcherRef.current?.focus(), 0);
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

  const close = () => {
    setOpen(false);
    setTimeout(() => launcherRef.current?.focus(), 0);
  };

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="aida-assistant"
        aria-label={open ? "Close Ask AIDA assistant" : "Open Ask AIDA assistant"}
        className={cn(
          "scale-original fixed top-(--aida-top,6.5rem) right-4 z-[70] flex items-center gap-3 rounded-full bg-ink-950 p-1.5 text-white shadow-(--shadow-glow) ring-1 ring-white/15 transition-transform hover:scale-[1.03] focus-visible:ring-4 focus-visible:ring-brand-300 focus-visible:outline-none sm:right-6 sm:pr-5",
          open && "hidden",
        )}
      >
        <span className="relative">
          <Avatar size={52} className="ring-2 ring-white/80" />
          <span className="absolute right-0 bottom-0.5 size-3.5 rounded-full border-2 border-ink-950 bg-emerald-400" aria-hidden />
        </span>
        <span className="hidden text-left leading-tight sm:block" aria-hidden>
          <span className="block font-display font-bold">Ask AIDA</span>
          <span className="block text-xs text-ink-300">Questions? I can help</span>
        </span>
      </button>

      {open && (
        <section
          id="aida-assistant"
          role="dialog"
          aria-label="Ask AIDA assistant"
          className="fixed inset-0 z-[80] flex flex-col bg-surface sm:inset-auto sm:top-(--aida-top,6.5rem) sm:right-6 sm:h-[min(680px,calc(100dvh-var(--aida-top,6.5rem)-1.5rem))] sm:w-[400px] sm:overflow-hidden sm:rounded-(--radius-card) sm:border sm:border-border sm:shadow-2xl"
        >
          <header className="scale-original flex items-center justify-between gap-3 bg-gradient-to-r from-ink-950 to-brand-950 px-4 py-3 text-white">
            <div>
              <p className="font-display font-bold">Ask AIDA</p>
              <p className="flex items-center gap-1.5 text-xs text-ink-300">
                <span className="size-2 rounded-full bg-emerald-400" aria-hidden /> AIDA&apos;s virtual assistant · Online
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={reset}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-ink-200 hover:bg-white/10 hover:text-white"
                aria-label="Start a new chat"
                title="New chat"
              >
                <RotateCcw className="size-4" aria-hidden />
                <span className="hidden sm:inline">New chat</span>
              </button>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-2 text-ink-200 hover:bg-white/10 hover:text-white"
                aria-label="Close assistant"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-ink-50 p-4" aria-live="polite">
            <figure className="overflow-hidden rounded-2xl ring-1 ring-border">
              <Image
                src={ASSISTANT_IMAGE}
                alt="Ask AIDA, the academy's virtual assistant"
                width={447}
                height={420}
                unoptimized
                className="h-auto w-full"
              />
            </figure>
            {messages.map((m, i) => (
              <div key={i} className={cn("flex items-end gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                <p
                  dir="auto"
                  className={cn(
                    "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line shadow-sm",
                    m.role === "user"
                      ? "rounded-br-md bg-brand-600 text-on-brand"
                      : "rounded-bl-md border border-border bg-surface text-ink-800",
                  )}
                >
                  <span className="sr-only">{m.role === "user" ? "You: " : "Ask AIDA: "}</span>
                  {m.role === "assistant" ? linkify(m.content) : m.content}
                </p>
              </div>
            ))}
            {pending && (
              <div className="flex items-end gap-2" role="status">
                <span className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-border bg-surface px-4 py-3.5">
                  <span className="sr-only">Ask AIDA is typing…</span>
                  {[0, 150, 300].map((d) => (
                    <span
                      key={d}
                      className="size-2 animate-bounce rounded-full bg-brand-400"
                      style={{ animationDelay: `${d}ms` }}
                      aria-hidden
                    />
                  ))}
                </span>
              </div>
            )}
            {messages.length === 1 && !pending && (
              <div className="pt-1">
                <p className="mb-2 text-xs font-semibold tracking-wide text-ink-500 uppercase">Popular questions</p>
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
                className="flex size-11 shrink-0 items-center justify-center rounded-(--radius-control) bg-brand-600 text-on-brand hover:bg-brand-700 disabled:opacity-50"
                aria-label="Send question"
              >
                <Send className="size-4" aria-hidden />
              </button>
            </div>
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

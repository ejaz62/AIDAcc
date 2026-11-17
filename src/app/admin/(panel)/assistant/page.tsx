import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangle, CheckCircle2, MessageCircle } from "lucide-react";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { ASSISTANT_MODEL, isAiConfigured } from "@/features/assistant/claude";
import { getAssistantStats } from "@/features/assistant/stats";
import { requireAdmin } from "@/features/admin/session";
import { AdminPageHeader, formatDateTime, LoadingPanel, Pagination, Panel } from "@/features/admin/ui";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Assistant" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const PAGE_SIZE = 20;

async function Conversations({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = z.coerce.number().int().min(1).catch(1).parse(Array.isArray(sp.page) ? sp.page[0] : sp.page);
  const selected = typeof sp.c === "string" && /^[a-z0-9]{20,40}$/i.test(sp.c) ? sp.c : null;
  const db = getDb();
  const [{ total, questions30: last30, aiAnswers30: aiAnswers }, conversations, open] = await Promise.all([
    getAssistantStats(db),
    db.assistantConversation.findMany({
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        _count: { select: { messages: true } },
        messages: { where: { role: "user" }, orderBy: { createdAt: "asc" }, take: 1, select: { content: true } },
      },
    }),
    selected
      ? db.assistantConversation.findUnique({
          where: { id: selected },
          include: { messages: { orderBy: { createdAt: "asc" } } },
        })
      : null,
  ]);
  const ai = isAiConfigured();

  return (
    <div className="space-y-6">
      <Panel title="Status">
        {ai ? (
          <p className="flex gap-2 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              AI answers are on (Claude, <code>{ASSISTANT_MODEL}</code>). Answers use only published programmes, site details and FAQ.
            </span>
          </p>
        ) : (
          <div className="flex gap-2 rounded-(--radius-control) border border-warning-200 bg-warning-50 p-3.5 text-sm text-warning-900">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>
              <strong>FAQ mode.</strong> No AI key is configured, so the assistant answers from published FAQ entries and gives
              guidance otherwise. Add <code>ANTHROPIC_API_KEY</code> to enable full AI answers (see DEPLOYMENT.md).
            </p>
          </div>
        )}
        <dl className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            ["Conversations (all time)", total],
            ["Questions, last 30 days", last30],
            ["AI answers, last 30 days", aiAnswers],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-(--radius-control) bg-ink-50 p-4">
              <dt className="text-sm text-ink-500">{label}</dt>
              <dd className="mt-1 font-display text-3xl font-extrabold text-ink-950">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm text-muted">
          Switch the assistant on or off under <Link href="/admin/site" className="text-brand-700 underline underline-offset-2">Site details</Link>.
          Improve its answers by publishing questions under <Link href="/admin/faq" className="text-brand-700 underline underline-offset-2">FAQ</Link>.
          Conversations are deleted automatically after 30 days.
        </p>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-5">
        <Panel title="Recent conversations" className="xl:col-span-2">
          {conversations.length === 0 ? (
            <p className="text-sm text-muted">No conversations yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {conversations.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/admin/assistant?c=${c.id}${page > 1 ? `&page=${page}` : ""}`}
                    className={cn("block px-2 py-3 hover:bg-ink-50", c.id === selected && "bg-brand-50")}
                  >
                    <p className="truncate text-sm font-semibold text-ink-900">{c.messages[0]?.content ?? "(no question)"}</p>
                    <p className="text-xs text-ink-500">
                      {formatDateTime(c.updatedAt)} · {c._count.messages} messages
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Pagination
            page={page}
            pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))}
            hrefFor={(p) => `/admin/assistant?page=${p}`}
          />
        </Panel>
        <Panel title="Conversation" className="xl:col-span-3">
          {!open ? (
            <p className="flex items-center gap-2 text-sm text-muted">
              <MessageCircle className="size-4" aria-hidden /> Select a conversation to read it.
            </p>
          ) : (
            <ol className="space-y-3">
              {open.messages.map((m) => (
                <li key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-line",
                      m.role === "user" ? "bg-brand-600 text-white" : "border border-border bg-ink-50 text-ink-800",
                    )}
                  >
                    {m.content}
                    <p className={cn("mt-1 text-[0.7rem]", m.role === "user" ? "text-brand-100" : "text-ink-500")}>
                      {formatDateTime(m.createdAt)}
                      {m.role === "assistant" && ` · ${m.source === "ai" ? "AI answer" : "FAQ answer"}`}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </div>
  );
}

export default function AssistantAdminPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <AdminPageHeader title="Ask AIDA assistant" lead="What visitors ask, and how the assistant answers." />
      <Suspense fallback={<LoadingPanel rows={8} />}>
        <Conversations searchParams={searchParams} />
      </Suspense>
    </>
  );
}

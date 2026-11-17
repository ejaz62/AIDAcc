import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getDb } from "@/lib/db";
import { getSectionWithHistory } from "@/features/knowledge/knowledge";
import { KnowledgeEditor, RestoreButton } from "@/features/knowledge/knowledge-forms";
import { requireAdmin } from "@/features/admin/session";
import { formatDateTime, LoadingPanel, Panel } from "@/features/admin/ui";

export const metadata: Metadata = { title: "Edit knowledge" };

async function Editor({ params }: { params: Promise<{ key: string }> }) {
  await requireAdmin();
  const { key } = await params;
  if (!/^[a-z0-9-]{2,40}$/.test(key)) notFound();
  const s = await getSectionWithHistory(getDb(), key);
  if (!s) notFound();
  return (
    <>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-ink-950 sm:text-3xl">{s.title}</h1>
        <a href={s.page} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 underline underline-offset-2">
          View page {s.page} <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <KnowledgeEditor key={s.updatedAt.toISOString()} sectionKey={s.key} initial={{ title: s.title, summary: s.summary, summaryRoman: s.summaryRoman ?? "", summaryUrdu: s.summaryUrdu ?? "", body: s.body }} />
        </Panel>
        <Panel title="Version history">
          <ol className="space-y-4">
            {s.revisions.map((r, i) => (
              <li key={r.id} className="border-b border-border pb-3 last:border-0">
                <p className="text-sm font-semibold text-ink-900">
                  {formatDateTime(r.createdAt)} {i === 0 && <span className="text-xs font-medium text-emerald-700">(current)</span>}
                </p>
                <p className="text-xs text-ink-500">
                  {r.authorEmail}
                  {r.note ? ` · ${r.note}` : ""}
                </p>
                {i > 0 && (
                  <div className="mt-2">
                    <RestoreButton revisionId={r.id} label={`version from ${formatDateTime(r.createdAt)}`} />
                  </div>
                )}
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </>
  );
}

export default function EditKnowledgePage({ params }: { params: Promise<{ key: string }> }) {
  return (
    <>
      <Link href="/admin/knowledge" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-950">
        <ArrowLeft className="size-4" aria-hidden /> Knowledge base
      </Link>
      <Suspense fallback={<LoadingPanel rows={10} />}>
        <Editor params={params} />
      </Suspense>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { getDb } from "@/lib/db";
import { idSchema } from "@/features/admin/registrations";
import { requireAdmin } from "@/features/admin/session";
import { formatDateTime, LoadingPanel, Panel, StatusBadge } from "@/features/admin/ui";
import { KIND_LABELS, STATUS_LABELS } from "@/features/email/labels";

export const metadata: Metadata = { title: "Email" };

async function EmailDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();
  const m = await getDb().emailMessage.findUnique({ where: { id } });
  if (!m) notFound();
  const s = STATUS_LABELS[m.status];

  return (
    <>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-ink-950">{m.subject}</h1>
          <p className="mt-1 text-sm text-muted">
            {KIND_LABELS[m.kind] ?? m.kind} · to {m.to} · {formatDateTime(m.createdAt)}
            {m.sentAt && ` · sent ${formatDateTime(m.sentAt)}`}
          </p>
        </div>
        <StatusBadge status={s.tone} label={s.label} />
      </div>
      {m.lastError && <p className="mb-6 rounded-(--radius-control) border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">{m.lastError}</p>}
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="As the recipient sees it" className="xl:col-span-2">
          {/* Sandboxed: the stored HTML cannot run scripts or navigate this page. */}
          <iframe
            title="Email preview"
            sandbox=""
            srcDoc={m.html}
            className="h-[640px] w-full rounded-(--radius-control) border border-border bg-ink-50"
          />
        </Panel>
        <Panel title="Plain-text version">
          <pre className="text-sm leading-relaxed whitespace-pre-wrap text-ink-800">{m.text}</pre>
        </Panel>
      </div>
    </>
  );
}

export default function EmailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <Link href="/admin/emails" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-950">
        <ArrowLeft className="size-4" aria-hidden /> All emails
      </Link>
      <Suspense fallback={<LoadingPanel rows={8} />}>
        <EmailDetail params={params} />
      </Suspense>
    </>
  );
}

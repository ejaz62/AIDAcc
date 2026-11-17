import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangle, CheckCircle2, Eye } from "lucide-react";
import { getDb } from "@/lib/db";
import { EmailToolbar } from "@/features/email/email-controls";
import { KIND_LABELS, STATUS_LABELS } from "@/features/email/labels";
import { MAX_ATTEMPTS } from "@/features/email/outbox";
import { resolveTransport } from "@/features/email/transport";
import { requireAdmin } from "@/features/admin/session";
import { AdminPageHeader, formatDateTime, LoadingPanel, Panel, StatusBadge } from "@/features/admin/ui";

export const metadata: Metadata = { title: "Emails" };

async function Emails() {
  await requireAdmin();
  const { status } = resolveTransport();
  const db = getDb();
  const [messages, failedCount] = await Promise.all([
    db.emailMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, kind: true, to: true, subject: true, status: true, attempts: true, lastError: true, createdAt: true, sentAt: true },
    }),
    db.emailMessage.count({ where: { status: "FAILED" } }),
  ]);
  const sending = status.provider === "resend";

  return (
    <div className="space-y-6">
      <Panel title="Delivery">
        {sending ? (
          <p className="flex gap-2 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              Emails are being <strong>sent</strong> through Resend from <strong>{status.from}</strong>.
            </span>
          </p>
        ) : (
          <div className="flex gap-2 rounded-(--radius-control) border border-warning-200 bg-warning-50 p-3.5 text-sm text-warning-900">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <div>
              <p>
                <strong>Preview mode — emails are not being sent.</strong> They are recorded here so you can check them.
                To send real email, configure an email provider (see DEPLOYMENT.md, “Email”).
              </p>
              {status.problem && <p className="mt-1 font-medium">{status.problem}</p>}
            </div>
          </div>
        )}
        <div className="mt-5">
          <EmailToolbar hasFailed={failedCount > 0} />
        </div>
      </Panel>

      <Panel title="Recent emails">
        {messages.length === 0 ? (
          <p className="text-sm text-muted">No emails yet. They appear here when people register interest.</p>
        ) : (
          <ul className="divide-y divide-border">
            {messages.map((m) => {
              const s = STATUS_LABELS[m.status];
              return (
                <li key={m.id} className="flex flex-col gap-2 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink-900">
                      {KIND_LABELS[m.kind] ?? m.kind}
                      <StatusBadge status={s.tone} label={s.label} />
                    </p>
                    <p className="truncate text-sm text-ink-600">To {m.to} · {m.subject}</p>
                    <p className="text-xs text-ink-500">
                      {formatDateTime(m.createdAt)}
                      {m.status === "FAILED" && ` · attempt ${m.attempts} of ${MAX_ATTEMPTS}`}
                    </p>
                    {m.lastError && <p className="mt-1 text-xs break-words text-red-700">{m.lastError}</p>}
                  </div>
                  <Link
                    href={`/admin/emails/${m.id}`}
                    className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-brand-700 underline underline-offset-2"
                  >
                    <Eye className="size-4" aria-hidden /> View
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}

export default function EmailsPage() {
  return (
    <>
      <AdminPageHeader title="Emails" lead="Confirmation emails to registrants and notifications to staff. Records are kept for 30 days." />
      <Suspense fallback={<LoadingPanel rows={6} />}>
        <Emails />
      </Suspense>
    </>
  );
}

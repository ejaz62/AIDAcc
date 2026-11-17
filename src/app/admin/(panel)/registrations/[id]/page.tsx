import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { getDb } from "@/lib/db";
import { DeleteForm, NoteForm, StatusForm } from "@/features/admin/registration-forms";
import { getRegistration, idSchema, learnerLabel, statusLabel } from "@/features/admin/registrations";
import { requireAdmin } from "@/features/admin/session";
import { formatDateTime, LoadingPanel, Panel, StatusBadge } from "@/features/admin/ui";
import { KIND_LABELS, STATUS_LABELS } from "@/features/email/labels";

export const metadata: Metadata = { title: "Registration" };

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-ink-500">{label}</dt>
      <dd className="mt-1 text-sm break-words text-ink-900 sm:col-span-2 sm:mt-0">{children}</dd>
    </div>
  );
}

async function RegistrationDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();
  const r = await getRegistration(getDb(), id);
  if (!r) notFound();

  return (
    <>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold text-ink-950 sm:text-3xl">{r.fullName}</h1>
          <p className="mt-1 truncate text-muted">{r.email}</p>
        </div>
        <StatusBadge status={r.status} label={statusLabel(r.status)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Panel title="Details">
            <dl className="divide-y divide-border">
              <Detail label="Email">
                <a href={`mailto:${r.email}`} className="text-brand-700 hover:underline">
                  {r.email}
                </a>
              </Detail>
              <Detail label="Describes themselves as">{learnerLabel(r.learnerType)}</Detail>
              <Detail label="Programme of interest">
                {r.programme ? (
                  <Link href={`/admin/programmes/${r.programme.id}`} className="text-brand-700 hover:underline">
                    {r.programme.title}
                  </Link>
                ) : (
                  <span className="text-ink-500">None selected</span>
                )}
              </Detail>
              <Detail label="Message">
                {r.message ? <span className="whitespace-pre-wrap">{r.message}</span> : <span className="text-ink-500">None</span>}
              </Detail>
              <Detail label="First registered">{formatDateTime(r.createdAt)}</Detail>
              <Detail label="Last submitted">
                {formatDateTime(r.lastSubmittedAt)}
                {r.submissionCount > 1 && <span className="text-ink-500"> · submitted {r.submissionCount} times</span>}
              </Detail>
              <Detail label="Privacy consent">{formatDateTime(r.consentAt)}</Detail>
            </dl>
          </Panel>

          <Panel title={`Internal notes (${r.notes.length})`}>
            <NoteForm id={r.id} />
            {r.notes.length > 0 && (
              <ul className="mt-6 space-y-4 border-t border-border pt-5">
                {r.notes.map((n) => (
                  <li key={n.id}>
                    <p className="text-xs text-ink-500">
                      <span className="font-semibold text-ink-700">{n.author?.name ?? "Former staff member"}</span> ·{" "}
                      {formatDateTime(n.createdAt)}
                    </p>
                    <p className="mt-1 text-sm whitespace-pre-wrap text-ink-900">{n.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Emails">
            {r.emails.length === 0 ? (
              <p className="text-sm text-muted">No emails for this registration.</p>
            ) : (
              <ul className="space-y-2.5">
                {r.emails.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 text-sm">
                    <Link href={`/admin/emails/${e.id}`} className="min-w-0 truncate text-brand-700 underline underline-offset-2">
                      {KIND_LABELS[e.kind] ?? e.kind}
                    </Link>
                    <StatusBadge status={STATUS_LABELS[e.status].tone} label={STATUS_LABELS[e.status].label} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Follow-up">
            <StatusForm id={r.id} status={r.status} />
          </Panel>
          <Panel title="Delete">
            <p className="mb-4 text-sm text-muted">
              Use this when someone asks for their data to be deleted, or to remove spam.
            </p>
            <DeleteForm id={r.id} />
          </Panel>
        </div>
      </div>
    </>
  );
}

export default function RegistrationPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <Link
        href="/admin/registrations"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-950"
      >
        <ArrowLeft className="size-4" aria-hidden /> All registrations
      </Link>
      <Suspense fallback={<LoadingPanel rows={7} />}>
        <RegistrationDetail params={params} />
      </Suspense>
    </>
  );
}

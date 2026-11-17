import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/features/admin/session";
import { formatDateTime, LoadingPanel, Panel, StatusBadge } from "@/features/admin/ui";
import { admissionIdSchema, openAdmission, whatsappLink } from "@/features/admission/admin";
import { AdmissionDeleteForm, AdmissionNoteForm, AdmissionStatusForm } from "@/features/admission/admin-forms";
import { ADMISSION_STATUSES, AI_EXPERIENCE, BATCHES, COMPUTER_KNOWLEDGE, labelOf } from "@/features/admission/schema";

export const metadata: Metadata = { title: "Admission application" };

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-ink-500">{label}</dt>
      <dd className="mt-1 text-sm break-words text-ink-900 sm:col-span-2 sm:mt-0">{children}</dd>
    </div>
  );
}

async function ApplicationDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!admissionIdSchema.safeParse(id).success) notFound();
  const a = await openAdmission(getDb(), id);
  if (!a) notFound();
  const wa = whatsappLink(a.whatsapp);

  return (
    <>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold text-ink-950 sm:text-3xl">{a.fullName}</h1>
          <p className="mt-1 text-muted">
            Applied {formatDateTime(a.createdAt)} · {a.location}
          </p>
        </div>
        <StatusBadge status={a.status} label={labelOf(ADMISSION_STATUSES, a.status)} />
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-(--radius-control) bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
          <MessageCircle className="size-4" aria-hidden /> WhatsApp {a.whatsapp}
        </a>
        <a href={`tel:${a.whatsapp.replace(/[^+\d]/g, "")}`} className="inline-flex items-center gap-2 rounded-(--radius-control) border border-ink-300 bg-surface px-4 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-50">
          <Phone className="size-4" aria-hidden /> Call
        </a>
        {a.email && (
          <a href={`mailto:${a.email}`} className="inline-flex items-center gap-2 rounded-(--radius-control) border border-ink-300 bg-surface px-4 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-50">
            <Mail className="size-4" aria-hidden /> Email
          </a>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Panel title="Application">
            <dl className="divide-y divide-border">
              <Detail label="Full name">{a.fullName}</Detail>
              <Detail label="WhatsApp">{a.whatsapp}</Detail>
              <Detail label="Email">{a.email ?? <span className="text-ink-400">Not given</span>}</Detail>
              <Detail label="City and country">{a.location}</Detail>
              <Detail label="Course">{a.course}</Detail>
              <Detail label="Preferred batch">{labelOf(BATCHES, a.batch)}</Detail>
              <Detail label="Basic computer knowledge">{labelOf(COMPUTER_KNOWLEDGE, a.computerKnowledge)}</Detail>
              <Detail label="Experience with AI tools">{labelOf(AI_EXPERIENCE, a.aiExperience)}</Detail>
              <Detail label="Questions / information">
                {a.message ? <span className="whitespace-pre-line">{a.message}</span> : <span className="text-ink-400">None</span>}
              </Detail>
            </dl>
          </Panel>

          <Panel title="Notes">
            <AdmissionNoteForm id={a.id} />
            {a.notes.length > 0 && (
              <ul className="mt-6 space-y-4">
                {a.notes.map((n) => (
                  <li key={n.id} className="rounded-(--radius-control) bg-ink-50 p-4">
                    <p className="text-sm whitespace-pre-line text-ink-800">{n.body}</p>
                    <p className="mt-2 text-xs text-ink-500">
                      {n.authorEmail} · {formatDateTime(n.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Progress">
            <AdmissionStatusForm id={a.id} status={a.status} />
          </Panel>
          <Panel title="Delete">
            <AdmissionDeleteForm id={a.id} />
          </Panel>
        </div>
      </div>
    </>
  );
}

export default function AdmissionPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <Link href="/admin/admissions" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-950">
        <ArrowLeft className="size-4" aria-hidden /> All applications
      </Link>
      <Suspense fallback={<LoadingPanel rows={8} />}>
        <ApplicationDetail params={params} />
      </Suspense>
    </>
  );
}

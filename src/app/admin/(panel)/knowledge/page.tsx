import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight } from "lucide-react";
import { getDb } from "@/lib/db";
import { listSections } from "@/features/knowledge/knowledge";
import { requireAdmin } from "@/features/admin/session";
import { AdminPageHeader, formatDateTime, LoadingPanel, Panel } from "@/features/admin/ui";

export const metadata: Metadata = { title: "Knowledge base" };

async function Sections() {
  await requireAdmin();
  const sections = await listSections(getDb());
  return (
    <div className="space-y-6">
      <Panel>
        <p className="text-sm leading-relaxed text-ink-700">
          This is AIDA&apos;s official information. Each section&apos;s <strong>short answer</strong> is what Ask AIDA replies, and its{" "}
          <strong>full content</strong> appears on the website page shown. Every save is kept as a version you can restore. The
          original files are in the project folder <code>knowledge/aida/</code>.
        </p>
      </Panel>
      <ul className="divide-y divide-border rounded-(--radius-card) border border-border bg-surface">
        {sections.map((s) => (
          <li key={s.key}>
            <Link href={`/admin/knowledge/${s.key}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-ink-50">
              <div className="min-w-0">
                <p className="font-semibold text-ink-950">
                  {s.sortOrder}. {s.title}
                </p>
                <p className="line-clamp-2 text-sm text-ink-600">{s.summary}</p>
                <p className="mt-0.5 text-xs text-ink-500">
                  Page {s.page} · updated {formatDateTime(s.updatedAt)}
                  {s.updatedBy ? ` by ${s.updatedBy}` : ""}
                </p>
              </div>
              <ChevronRight className="size-5 shrink-0 text-ink-400" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function KnowledgeAdminPage() {
  return (
    <>
      <AdminPageHeader title="Knowledge base" lead="The single source of AIDA's information for the website and the Ask AIDA assistant." />
      <Suspense fallback={<LoadingPanel rows={8} />}>
        <Sections />
      </Suspense>
    </>
  );
}

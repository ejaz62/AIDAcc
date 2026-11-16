import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CheckCircle2, ExternalLink, Plus } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { getDb } from "@/lib/db";
import { listProgrammesAdmin } from "@/features/content/programmes";
import { requireAdmin } from "@/features/admin/session";
import { AdminPageHeader, formatDate, LoadingPanel, StatusBadge } from "@/features/admin/ui";

export const metadata: Metadata = { title: "Programmes" };

async function ProgrammeList({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const [items, sp] = await Promise.all([listProgrammesAdmin(getDb()), searchParams]);

  return (
    <>
      {sp.deleted === "1" && (
        <p role="status" className="mb-5 flex items-center gap-2 rounded-(--radius-control) border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="size-4" aria-hidden /> The programme was deleted.
        </p>
      )}
      {items.length === 0 ? (
        <div className="rounded-(--radius-card) border border-dashed border-ink-300 bg-surface px-6 py-14 text-center">
          <p className="font-semibold text-ink-800">No programmes yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Add a programme once its details have been officially confirmed. It stays a private draft until you publish it.
          </p>
          <Link href="/admin/programmes/new" className={buttonClasses({ className: "mt-5" })}>
            <Plus className="size-4" aria-hidden /> Add programme
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-(--radius-card) border border-border bg-surface">
          {items.map((p) => (
            <li key={p.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <Link href={`/admin/programmes/${p.id}`} className="font-semibold text-ink-950 hover:text-brand-700">
                  {p.title}
                </Link>
                <p className="truncate text-sm text-ink-500">
                  /programmes/{p.slug} · updated {formatDate(p.updatedAt)}
                  {p._count.registrations > 0 && ` · ${p._count.registrations} interested`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <StatusBadge status={p.status === "PUBLISHED" ? "CONTACTED" : "ARCHIVED"} label={p.status === "PUBLISHED" ? "Published" : "Draft"} />
                {p.status === "PUBLISHED" && (
                  <a href={`/programmes/${p.slug}`} target="_blank" rel="noreferrer" className="text-ink-500 hover:text-brand-700" aria-label={`View ${p.title} on the website`}>
                    <ExternalLink className="size-4" aria-hidden />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function ProgrammesAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <>
      <AdminPageHeader
        title="Programmes"
        lead="Only published programmes appear on the website."
        actions={
          <Link href="/admin/programmes/new" className={buttonClasses({})}>
            <Plus className="size-4" aria-hidden /> Add programme
          </Link>
        }
      />
      <Suspense fallback={<LoadingPanel rows={4} />}>
        <ProgrammeList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CheckCircle2, MessageSquare, Search } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { inputClasses } from "@/components/ui/form";
import { getDb } from "@/lib/db";
import { cn } from "@/lib/cn";
import { requireAdmin } from "@/features/admin/session";
import { AdminPageHeader, formatDateTime, LoadingPanel, Pagination, StatusBadge } from "@/features/admin/ui";
import { admissionFiltersSchema, listAdmissions, type AdmissionFilters } from "@/features/admission/admin";
import { ADMISSION_STATUSES, BATCHES, labelOf } from "@/features/admission/schema";

export const metadata: Metadata = { title: "Admissions" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function query(f: AdmissionFilters, extra: Record<string, string | number> = {}) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.status) p.set("status", f.status);
  for (const [k, v] of Object.entries(extra)) p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
}

function NewDot() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[0.65rem] font-bold tracking-wide text-white uppercase">
      New
    </span>
  );
}

async function Results({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const raw = await searchParams;
  const filters = admissionFiltersSchema.parse(raw);
  const { items, total, page, pageCount } = await listAdmissions(getDb(), filters);
  const filtered = Boolean(filters.q || filters.status);

  return (
    <>
      {raw.deleted === "1" && (
        <p role="status" className="mb-5 flex items-center gap-2 rounded-(--radius-control) border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="size-4" aria-hidden /> The application was permanently deleted.
        </p>
      )}

      <form method="get" role="search" className="mb-5 grid gap-3 rounded-(--radius-card) border border-border bg-surface p-4 md:grid-cols-[minmax(14rem,1fr)_minmax(0,14rem)_auto]">
        <label className="relative">
          <span className="sr-only">Search by name, WhatsApp, email or city</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
          <input name="q" defaultValue={filters.q} placeholder="Search name, WhatsApp, email or city" className={cn(inputClasses(), "py-2.5 pl-10")} />
        </label>
        <label>
          <span className="sr-only">Status</span>
          <select name="status" defaultValue={filters.status ?? ""} className={cn(inputClasses(), "py-2.5")}>
            <option value="">All statuses</option>
            {ADMISSION_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <button type="submit" className={buttonClasses({ size: "md", className: "flex-1" })}>
            Apply
          </button>
          {filtered && (
            <Link href="/admin/admissions" className={buttonClasses({ variant: "ghost", size: "md" })}>
              Clear
            </Link>
          )}
        </div>
      </form>

      <p className="mb-3 text-sm text-muted">
        {total} {total === 1 ? "application" : "applications"}
        {filtered && (total === 1 ? " matches these filters" : " match these filters")}
      </p>

      {items.length === 0 ? (
        <div className="rounded-(--radius-card) border border-dashed border-ink-300 bg-surface px-6 py-14 text-center">
          <p className="font-semibold text-ink-800">{filtered ? "No applications match these filters." : "No applications yet."}</p>
          <p className="mt-1 text-sm text-muted">Applications from the website&apos;s Admission form appear here.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-(--radius-card) border border-border bg-surface">
          {items.map((a) => (
            <li key={a.id}>
              <Link href={`/admin/admissions/${a.id}`} className={cn("flex flex-col gap-2 p-4 transition-colors hover:bg-ink-50 sm:flex-row sm:items-center sm:justify-between sm:px-5", !a.seenAt && "bg-brand-50/50")}>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-semibold text-ink-950">
                    <span className="truncate">{a.fullName}</span>
                    {!a.seenAt && <NewDot />}
                  </p>
                  <p className="truncate text-sm text-ink-500">
                    {a.whatsapp} · {a.location} · Batch: {labelOf(BATCHES, a.batch)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-sm text-ink-500">
                  {a._count.notes > 0 && (
                    <span className="flex items-center gap-1" title={`${a._count.notes} notes`}>
                      <MessageSquare className="size-3.5" aria-hidden /> {a._count.notes}
                    </span>
                  )}
                  <span className="whitespace-nowrap">{formatDateTime(a.createdAt)}</span>
                  <StatusBadge status={a.status} label={labelOf(ADMISSION_STATUSES, a.status)} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} pageCount={pageCount} hrefFor={(p) => `/admin/admissions${query(filters, { page: p })}`} />
    </>
  );
}

export default function AdmissionsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <AdminPageHeader title="Admissions" lead="Applications from the website's Admission form. Confirm a place only after verifying payment." />
      <Suspense fallback={<LoadingPanel rows={8} />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </>
  );
}

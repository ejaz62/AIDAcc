import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CheckCircle2, Download, MessageSquare, Search } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { inputClasses } from "@/components/ui/form";
import { learnerTypes } from "@/features/interest/schema";
import { getDb } from "@/lib/db";
import { listProgrammesAdmin } from "@/features/content/programmes";
import {
  filtersSchema,
  learnerLabel,
  listRegistrations,
  STATUSES,
  statusLabel,
  type RegistrationFilters,
} from "@/features/admin/registrations";
import { requireAdmin } from "@/features/admin/session";
import { AdminPageHeader, formatDate, LoadingPanel, Pagination, StatusBadge } from "@/features/admin/ui";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Registrations" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function query(f: RegistrationFilters, extra: Record<string, string | number> = {}) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.status) p.set("status", f.status);
  if (f.type) p.set("type", f.type);
  if (f.programme) p.set("programme", f.programme);
  for (const [k, v] of Object.entries(extra)) p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
}

async function Results({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const raw = await searchParams;
  const filters = filtersSchema.parse(raw);
  const [{ items, total, page, pageCount }, programmeOptions] = await Promise.all([
    listRegistrations(getDb(), filters),
    listProgrammesAdmin(getDb()),
  ]);
  const filtered = Boolean(filters.q || filters.status || filters.type || filters.programme);

  return (
    <>
      {raw.deleted === "1" && (
        <p role="status" className="mb-5 flex items-center gap-2 rounded-(--radius-control) border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="size-4" aria-hidden /> The registration was permanently deleted.
        </p>
      )}

      <form method="get" role="search" className="mb-5 grid gap-3 rounded-(--radius-card) border border-border bg-surface p-4 md:grid-cols-2 xl:grid-cols-[minmax(14rem,1fr)_minmax(0,10rem)_minmax(0,13rem)_minmax(0,14rem)_auto]">
        <label className="relative">
          <span className="sr-only">Search by name or email</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
          <input name="q" defaultValue={filters.q} placeholder="Search name or email" className={cn(inputClasses(), "py-2.5 pl-10")} />
        </label>
        <label>
          <span className="sr-only">Status</span>
          <select name="status" defaultValue={filters.status ?? ""} className={cn(inputClasses(), "py-2.5")}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Describes themselves as</span>
          <select name="type" defaultValue={filters.type ?? ""} className={cn(inputClasses(), "py-2.5")}>
            <option value="">All types</option>
            {learnerTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        {programmeOptions.length > 0 && (
          <label>
            <span className="sr-only">Programme</span>
            <select name="programme" defaultValue={filters.programme ?? ""} className={cn(inputClasses(), "py-2.5")}>
              <option value="">All programmes</option>
              {programmeOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="flex gap-2">
          <button type="submit" className={buttonClasses({ size: "md", className: "flex-1" })}>
            Apply
          </button>
          {filtered && (
            <Link href="/admin/registrations" className={buttonClasses({ variant: "ghost", size: "md" })}>
              Clear
            </Link>
          )}
        </div>
      </form>

      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {total} {total === 1 ? "registration" : "registrations"}
          {filtered && (total === 1 ? " matches these filters" : " match these filters")}
        </p>
        <a
          href={`/admin/registrations/export${query(filters)}`}
          className={buttonClasses({ variant: "secondary", size: "sm" })}
          download
        >
          <Download className="size-4" aria-hidden /> Export CSV
        </a>
      </div>

      {items.length === 0 ? (
        <div className="rounded-(--radius-card) border border-dashed border-ink-300 bg-surface px-6 py-14 text-center">
          <p className="font-semibold text-ink-800">{filtered ? "No registrations match these filters." : "No registrations yet."}</p>
          <p className="mt-1 text-sm text-muted">
            {filtered ? "Try a different search or clear the filters." : "Submissions from the Register Interest form will appear here."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-(--radius-card) border border-border bg-surface md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-ink-50 text-xs tracking-wide text-ink-500 uppercase">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Name</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Describes themselves as</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-ink-50">
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/registrations/${r.id}`} className="font-semibold text-ink-950 hover:text-brand-700">
                        {r.fullName}
                      </Link>
                      <p className="text-ink-500">{r.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-ink-700">
                      {learnerLabel(r.learnerType)}
                      {r.programme && <p className="text-xs text-ink-500">{r.programme.title}</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={r.status} label={statusLabel(r.status)} />
                        {r._count.notes > 0 && (
                          <span className="flex items-center gap-1 text-xs text-ink-500" title={`${r._count.notes} notes`}>
                            <MessageSquare className="size-3.5" aria-hidden />
                            <span className="sr-only">Notes:</span>
                            {r._count.notes}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-ink-600">{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {items.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/admin/registrations/${r.id}`}
                  className="block rounded-(--radius-card) border border-border bg-surface p-4 active:bg-ink-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink-950">{r.fullName}</p>
                      <p className="truncate text-sm text-ink-500">{r.email}</p>
                    </div>
                    <StatusBadge status={r.status} label={statusLabel(r.status)} />
                  </div>
                  <p className="mt-2 text-xs text-ink-500">
                    {learnerLabel(r.learnerType)} · {formatDate(r.createdAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <Pagination page={page} pageCount={pageCount} hrefFor={(p) => `/admin/registrations${query(filters, { page: p })}`} />
    </>
  );
}

export default function RegistrationsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <AdminPageHeader title="Registrations" lead="People who have registered interest. These are not admission applications." />
      <Suspense fallback={<LoadingPanel rows={8} />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </>
  );
}

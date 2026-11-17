import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export function AdminPageHeader({ title, lead, actions }: { title: string; lead?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-ink-950 sm:text-3xl">{title}</h1>
        {lead && <p className="mt-1.5 text-muted">{lead}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-(--radius-card) border border-border bg-surface p-5 sm:p-6", className)}>
      {title && <h2 className="mb-4 text-base font-bold text-ink-950">{title}</h2>}
      {children}
    </section>
  );
}

const statusTones: Record<string, string> = {
  NEW: "bg-brand-50 text-brand-700 ring-brand-200",
  CONTACTED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ARCHIVED: "bg-ink-100 text-ink-600 ring-ink-200",
  PAYMENT_PENDING: "bg-amber-50 text-amber-800 ring-amber-200",
  CONFIRMED: "bg-emerald-600 text-white ring-emerald-600",
  NOT_PROCEEDING: "bg-ink-100 text-ink-600 ring-ink-200",
  FAILED: "bg-red-50 text-red-700 ring-red-200",
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        statusTones[status] ?? statusTones.ARCHIVED,
      )}
    >
      {label}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-ink-200/70", className)} aria-hidden />;
}

export function LoadingPanel({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 rounded-(--radius-card) border border-border bg-surface p-6" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-10" />
      ))}
    </div>
  );
}

export function Pagination({
  page,
  pageCount,
  hrefFor,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
}) {
  if (pageCount <= 1) return null;
  const link = "inline-flex h-9 items-center gap-1 rounded-(--radius-control) px-3 text-sm font-medium ring-1 ring-inset";
  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={cn(link, "bg-surface text-ink-800 ring-ink-200 hover:bg-ink-100")}>
          <ChevronLeft className="size-4" aria-hidden /> Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-muted">
        Page {page} of {pageCount}
      </span>
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} className={cn(link, "bg-surface text-ink-800 ring-ink-200 hover:bg-ink-100")}>
          Next <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

const dateFmt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" });
const dateTimeFmt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
export const formatDate = (d: Date) => dateFmt.format(d);
export const formatDateTime = (d: Date) => `${dateTimeFmt.format(d)} UTC`;

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { AUDIT_LABELS, listAuditLog, type AuditAction } from "@/features/admin/audit";
import { requireAdmin } from "@/features/admin/session";
import { AdminPageHeader, formatDateTime, LoadingPanel, Pagination } from "@/features/admin/ui";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Audit log" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const pageSchema = z.coerce.number().int().min(1).max(100_000).catch(1);

function describe(details: unknown): string {
  if (!details || typeof details !== "object") return "";
  const d = details as Record<string, unknown>;
  if (d.from && d.to) return `${String(d.from).toLowerCase()} → ${String(d.to).toLowerCase()}`;
  if (typeof d.rows === "number") return `${d.rows} rows`;
  if (typeof d.reason === "string") return d.reason.replace(/_/g, " ");
  if (typeof d.title === "string") return d.title;
  return "";
}

async function Entries({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const raw = await searchParams;
  const page = pageSchema.parse(Array.isArray(raw.page) ? raw.page[0] : raw.page);
  const { items, pageCount } = await listAuditLog(getDb(), { page });

  if (items.length === 0) {
    return <p className="rounded-(--radius-card) border border-dashed border-ink-300 bg-surface p-10 text-center text-muted">No activity recorded yet.</p>;
  }

  return (
    <>
      <ol className="divide-y divide-border rounded-(--radius-card) border border-border bg-surface">
        {items.map((e) => {
          const failed = e.action === "auth.sign_in_failed";
          const isRegistration = e.targetType === "registration" && e.action !== "registration.deleted";
          const isProgramme = e.targetType === "programme" && e.action !== "programme.deleted";
          return (
            <li key={e.id} className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-center sm:gap-6">
              <time className="shrink-0 text-xs text-ink-500 tabular-nums sm:w-52" dateTime={e.createdAt.toISOString()}>
                {formatDateTime(e.createdAt)}
              </time>
              <div className="min-w-0 flex-1 text-sm">
                <span className={cn("font-semibold", failed ? "text-red-700" : "text-ink-900")}>
                  {AUDIT_LABELS[e.action as AuditAction] ?? e.action}
                </span>
                {describe(e.details) && <span className="text-ink-500"> · {describe(e.details)}</span>}
                {isProgramme && e.targetId && (
                  <>
                    {" "}
                    <Link href={`/admin/programmes/${e.targetId}`} className="text-brand-700 hover:underline">
                      view
                    </Link>
                  </>
                )}
                {isRegistration && e.targetId && (
                  <>
                    {" "}
                    <Link href={`/admin/registrations/${e.targetId}`} className="text-brand-700 hover:underline">
                      view
                    </Link>
                  </>
                )}
              </div>
              <span className="truncate text-xs text-ink-500 sm:max-w-64">{e.actorEmail}</span>
            </li>
          );
        })}
      </ol>
      <Pagination page={page} pageCount={pageCount} hrefFor={(p) => `/admin/audit?page=${p}`} />
    </>
  );
}

export default function AuditPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <AdminPageHeader title="Audit log" lead="Every staff action is recorded here. Entries cannot be edited or removed." />
      <Suspense fallback={<LoadingPanel rows={10} />}>
        <Entries searchParams={searchParams} />
      </Suspense>
    </>
  );
}

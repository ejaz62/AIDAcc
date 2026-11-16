import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { getDb } from "@/lib/db";
import { DailyChart } from "@/features/admin/daily-chart";
import { getDashboardStats, STATUSES } from "@/features/admin/registrations";
import { requireAdmin } from "@/features/admin/session";
import { AdminPageHeader, LoadingPanel, Panel } from "@/features/admin/ui";

export const metadata: Metadata = { title: "Dashboard" };

const tileHelp: Record<string, string> = {
  NEW: "Not yet followed up",
  CONTACTED: "Followed up by staff",
  ARCHIVED: "No further action",
};

async function Dashboard() {
  await requireAdmin();
  const stats = await getDashboardStats(getDb(), new Date());
  const maxType = Math.max(1, ...stats.types.map((t) => t.count));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-(--radius-card) bg-ink-950 p-5 text-white">
          <p className="text-sm text-ink-300">Total registrations</p>
          <p className="mt-2 font-display text-4xl font-extrabold">{stats.total}</p>
          <p className="mt-1 text-xs text-ink-400">{stats.last30} in the last 30 days</p>
        </div>
        {STATUSES.map((s) => (
          <Link
            key={s.value}
            href={`/admin/registrations?status=${s.value}`}
            className="group rounded-(--radius-card) border border-border bg-surface p-5 transition-colors hover:border-brand-300"
          >
            <p className="text-sm text-muted">{s.label}</p>
            <p className="mt-2 font-display text-4xl font-extrabold text-ink-950">{stats.statusCounts[s.value]}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-ink-500">
              {tileHelp[s.value]}
              <ArrowRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Registrations per day — last 30 days" className="xl:col-span-2">
          <DailyChart data={stats.daily} />
        </Panel>
        <Panel title="How registrants describe themselves">
          {stats.total === 0 ? (
            <p className="text-sm text-muted">No registrations yet.</p>
          ) : (
            <ul className="space-y-3.5">
              {stats.types.map((t) => (
                <li key={t.value}>
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-700">{t.label}</span>
                    <span className="font-semibold text-ink-900 tabular-nums">{t.count}</span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-ink-100" aria-hidden>
                    <div className="h-2 rounded-full bg-brand-500" style={{ width: `${(t.count / maxType) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <>
      <AdminPageHeader title="Dashboard" lead="Overview of Register Interest submissions." />
      <Suspense fallback={<LoadingPanel rows={6} />}>
        <Dashboard />
      </Suspense>
    </>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { getDb } from "@/lib/db";
import { StaffRowActions, AddStaffForm } from "@/features/admin/staff-forms";
import { requireAdmin } from "@/features/admin/session";
import { listStaff } from "@/features/admin/users";
import { AdminPageHeader, formatDateTime, LoadingPanel, Panel, StatusBadge } from "@/features/admin/ui";

export const metadata: Metadata = { title: "Staff" };

async function StaffList() {
  const me = await requireAdmin();
  const staff = await listStaff(getDb());
  return (
    <div className="space-y-6">
      <Panel title="Add a staff member">
        <p className="mb-4 text-sm text-muted">
          A temporary password is generated and shown once. Staff can change it under &ldquo;My account&rdquo;.
        </p>
        <AddStaffForm />
      </Panel>
      <Panel title={`Staff accounts (${staff.length})`}>
        <ul className="divide-y divide-border">
          {staff.map((s) => (
            <li key={s.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-semibold text-ink-950">
                  {s.name}
                  {s.id === me.id && <span className="text-xs font-medium text-ink-500">(you)</span>}
                  <StatusBadge status={s.disabled ? "ARCHIVED" : "CONTACTED"} label={s.disabled ? "Disabled" : "Active"} />
                </p>
                <p className="truncate text-sm text-ink-500">{s.email}</p>
                <p className="mt-0.5 text-xs text-ink-500">
                  Added {formatDateTime(s.createdAt)}
                  {s.sessions[0] && ` · last active ${formatDateTime(s.sessions[0].updatedAt)}`}
                </p>
              </div>
              <div className="lg:max-w-md">
                <StaffRowActions userId={s.id} email={s.email} disabled={s.disabled} isSelf={s.id === me.id} />
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

export default function StaffPage() {
  return (
    <>
      <AdminPageHeader title="Staff" lead="People who can sign in to this admin area." />
      <Suspense fallback={<LoadingPanel rows={5} />}>
        <StaffList />
      </Suspense>
    </>
  );
}

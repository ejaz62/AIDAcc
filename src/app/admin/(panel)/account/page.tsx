import type { Metadata } from "next";
import { Suspense } from "react";
import { ChangePasswordForm } from "@/features/admin/staff-forms";
import { NotificationPreference } from "@/features/email/email-controls";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/features/admin/session";
import { AdminPageHeader, LoadingPanel, Panel } from "@/features/admin/ui";

export const metadata: Metadata = { title: "My account" };

async function Account() {
  const me = await requireAdmin();
  const prefs = await getDb().user.findUnique({ where: { id: me.id }, select: { notificationMode: true } });
  return (
    <div className="space-y-6">
      <Panel title="Your details">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink-500">Name</dt>
            <dd className="font-medium text-ink-900">{me.name}</dd>
          </div>
          <div>
            <dt className="text-ink-500">Email</dt>
            <dd className="font-medium break-all text-ink-900">{me.email}</dd>
          </div>
        </dl>
      </Panel>
      <Panel title="Email notifications">
        <NotificationPreference current={prefs?.notificationMode ?? "NONE"} />
      </Panel>
      <Panel title="Change password">
        <ChangePasswordForm />
      </Panel>
    </div>
  );
}

export default function AccountPage() {
  return (
    <>
      <AdminPageHeader title="My account" />
      <Suspense fallback={<LoadingPanel rows={4} />}>
        <Account />
      </Suspense>
    </>
  );
}

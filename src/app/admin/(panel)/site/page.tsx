import type { Metadata } from "next";
import { Suspense } from "react";
import { getDb } from "@/lib/db";
import { SiteDetailsForm } from "@/features/content/site-form";
import { getSiteContentAdmin } from "@/features/content/site-content";
import { requireAdmin } from "@/features/admin/session";
import { AdminPageHeader, formatDateTime, LoadingPanel, Panel } from "@/features/admin/ui";

export const metadata: Metadata = { title: "Site details" };

async function Editor() {
  await requireAdmin();
  const { draft, publishedAt, hasUnpublishedChanges } = await getSiteContentAdmin(getDb());
  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <Panel className="xl:col-span-2">
        <SiteDetailsForm draft={draft} />
      </Panel>
      <Panel title="Publishing">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-ink-500">Last published</dt>
            <dd className="font-medium text-ink-900">{publishedAt ? formatDateTime(publishedAt) : "Never"}</dd>
          </div>
          <div>
            <dt className="text-ink-500">Draft</dt>
            <dd className={hasUnpublishedChanges ? "font-medium text-warning-700" : "font-medium text-emerald-700"}>
              {hasUnpublishedChanges ? "Has changes not yet on the website" : "Matches the website"}
            </dd>
          </div>
        </dl>
        <p className="mt-5 border-t border-border pt-4 text-sm text-muted">
          Empty fields keep their &ldquo;to be published&rdquo; placeholder on the website. Enter only officially verified
          information.
        </p>
      </Panel>
    </div>
  );
}

export default function SiteDetailsPage() {
  return (
    <>
      <AdminPageHeader
        title="Site details"
        lead="Official contact details and About page content. Changes go live only when you publish."
      />
      <Suspense fallback={<LoadingPanel rows={8} />}>
        <Editor />
      </Suspense>
    </>
  );
}

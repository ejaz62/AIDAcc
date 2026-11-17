import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckCircle2 } from "lucide-react";
import { getDb } from "@/lib/db";
import { listFaqAdmin } from "@/features/faq/faq";
import { FaqForm, FaqRow } from "@/features/faq/faq-forms";
import { requireAdmin } from "@/features/admin/session";
import { AdminPageHeader, LoadingPanel, Panel } from "@/features/admin/ui";

export const metadata: Metadata = { title: "FAQ" };

async function FaqManager({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const [items, sp] = await Promise.all([listFaqAdmin(getDb()), searchParams]);
  const published = items.filter((i) => i.status === "PUBLISHED").length;
  return (
    <div className="space-y-6">
      {sp.created === "1" && (
        <p role="status" className="flex items-center gap-2 rounded-(--radius-control) border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="size-4" aria-hidden /> Question added as a draft. Publish it to show it on the website and to the assistant.
        </p>
      )}
      <Panel title="Add a question">
        <FaqForm id={null} initial={{ question: "", answer: "", sortOrder: 0 }} />
      </Panel>
      <Panel title={`Questions (${published} published of ${items.length})`}>
        {items.length === 0 ? (
          <p className="text-sm text-muted">No questions yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((e) => (
              <FaqRow key={e.id} entry={e} />
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

export default function FaqAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <>
      <AdminPageHeader
        title="FAQ"
        lead="Published questions appear on the website's FAQ page and are what the Ask AIDA assistant knows, alongside programmes and site details."
      />
      <Suspense fallback={<LoadingPanel rows={6} />}>
        <FaqManager searchParams={searchParams} />
      </Suspense>
    </>
  );
}

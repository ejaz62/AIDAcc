import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, CheckCircle2, ExternalLink } from "lucide-react";
import { getDb } from "@/lib/db";
import { DeleteProgramme, ProgrammeForm, PublishControls } from "@/features/content/programme-form";
import { getProgramme, publishBlockers } from "@/features/content/programmes";
import { idSchema } from "@/features/admin/registrations";
import { requireAdmin } from "@/features/admin/session";
import { formatDateTime, LoadingPanel, Panel, StatusBadge } from "@/features/admin/ui";

export const metadata: Metadata = { title: "Edit programme" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

async function Editor({ params, searchParams }: Props) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!idSchema.safeParse(id).success) notFound();
  const p = await getProgramme(getDb(), id);
  if (!p) notFound();
  const published = p.status === "PUBLISHED";

  return (
    <>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-ink-950 sm:text-3xl">{p.title}</h1>
          <p className="mt-1 text-sm text-muted">Last updated {formatDateTime(p.updatedAt)}</p>
        </div>
        <StatusBadge status={published ? "CONTACTED" : "ARCHIVED"} label={published ? "Published" : "Draft"} />
      </div>
      {sp.created === "1" && (
        <p role="status" className="mb-5 flex items-center gap-2 rounded-(--radius-control) border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="size-4" aria-hidden /> Draft created. It is not visible on the website until you publish it.
        </p>
      )}
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <ProgrammeForm
            key={p.updatedAt.toISOString()}
            id={p.id}
            published={published}
            initial={{
              title: p.title,
              slug: p.slug,
              summary: p.summary ?? "",
              overview: p.overview ?? "",
              audience: p.audience ?? "",
              duration: p.duration ?? "",
              studyFormat: p.studyFormat ?? "",
              entryRequirements: p.entryRequirements ?? "",
              fees: p.fees ?? "",
              sortOrder: p.sortOrder,
            }}
          />
        </Panel>
        <div className="space-y-6">
          <Panel title="Visibility">
            <PublishControls id={p.id} status={p.status} blockers={publishBlockers(p)} />
            {published && (
              <a
                href={`/programmes/${p.slug}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
              >
                View on website <ExternalLink className="size-3.5" aria-hidden />
              </a>
            )}
          </Panel>
          <Panel title="Delete">
            <DeleteProgramme id={p.id} registrations={p._count.registrations} />
          </Panel>
        </div>
      </div>
    </>
  );
}

export default function EditProgrammePage(props: Props) {
  return (
    <>
      <Link href="/admin/programmes" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-950">
        <ArrowLeft className="size-4" aria-hidden /> All programmes
      </Link>
      <Suspense fallback={<LoadingPanel rows={8} />}>
        <Editor {...props} />
      </Suspense>
    </>
  );
}

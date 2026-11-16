import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { ProgrammeForm } from "@/features/content/programme-form";
import { requireAdmin } from "@/features/admin/session";
import { AdminPageHeader, LoadingPanel, Panel } from "@/features/admin/ui";

export const metadata: Metadata = { title: "Add programme" };

const empty = {
  title: "",
  slug: "",
  summary: "",
  overview: "",
  audience: "",
  duration: "",
  studyFormat: "",
  entryRequirements: "",
  fees: "",
  sortOrder: 0,
};

async function Guarded() {
  await requireAdmin();
  return (
    <Panel className="max-w-3xl">
      <ProgrammeForm id={null} initial={empty} />
    </Panel>
  );
}

export default function NewProgrammePage() {
  return (
    <>
      <Link href="/admin/programmes" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-950">
        <ArrowLeft className="size-4" aria-hidden /> All programmes
      </Link>
      <AdminPageHeader title="Add programme" lead="New programmes are saved as private drafts. Enter only verified information." />
      <Suspense fallback={<LoadingPanel rows={8} />}>
        <Guarded />
      </Suspense>
    </>
  );
}

import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { KnowledgeHelp, KnowledgeSections } from "@/features/knowledge/knowledge-content";

export const metadata: Metadata = {
  title: "Fees & Admission",
  description: "AIDA course fees, payment, admission steps, requirements and refund policy.",
};

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="Fees & Admission" title="Fees, admission and requirements" lead="Everything you need to join the AIDA AI Training Programme." />
      <div className="px-4 pt-12 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-col items-start justify-between gap-4 rounded-(--radius-card) border border-cyan-400/30 bg-cyan-400/5 p-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-lg font-bold text-ink-950">Ready to join?</p>
            <p className="text-sm text-ink-600">Fill in the Student Admission Form — it takes about two minutes.</p>
          </div>
          <ButtonLink href="/admission">Apply now</ButtonLink>
        </div>
      </div>
      <KnowledgeSections keys={["fees", "admission", "requirements", "refund"]} />
      <KnowledgeHelp />
    </>
  );
}

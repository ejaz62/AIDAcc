import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { KnowledgeHelp, KnowledgeSections } from "@/features/knowledge/knowledge-content";

export const metadata: Metadata = {
  title: "Fees & Admission",
  description: "AIDA course fees, payment, admission steps, requirements and refund policy.",
};

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="Fees & Admission" title="Fees, admission and requirements" lead="Everything you need to join the AIDA AI Training Programme." />
      <KnowledgeSections keys={["fees", "admission", "requirements", "refund"]} />
      <KnowledgeHelp />
    </>
  );
}

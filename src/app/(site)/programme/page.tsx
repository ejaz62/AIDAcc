import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { KnowledgeHelp, KnowledgeSections, PageBanner } from "@/features/knowledge/knowledge-content";

export const metadata: Metadata = {
  title: "AI Training Programme",
  description: "AIDA AI Training Programme: a 10-day, live, instructor-led online course for beginners.",
};

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="AI Training Programme" title="AIDA AI Training Programme" lead="A 10-day, live, instructor-led online programme for complete beginners — no coding experience needed." />
      <PageBanner src="/images/learning-workspace.webp" alt="Students learning to build with AI on their laptops (illustrative)" />
      <KnowledgeSections keys={["programme", "schedule", "support", "certificates"]} />
      <KnowledgeHelp />
    </>
  );
}

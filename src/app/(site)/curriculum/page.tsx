import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { KnowledgeHelp, KnowledgeSections, PageBanner } from "@/features/knowledge/knowledge-content";

export const metadata: Metadata = {
  title: "Curriculum",
  description: "What you will learn on the AIDA AI Training Programme.",
};

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="Curriculum" title="What you will learn" lead="Practical, hands-on AI skills — from Claude and AI tools to building and publishing websites and AI agents." />
      <PageBanner src="/images/ai-agents.webp" alt="Illustration of AI agents, code generation and automation workflows" />
      <KnowledgeSections keys={["curriculum"]} />
      <KnowledgeHelp />
    </>
  );
}

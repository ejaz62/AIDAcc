import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { KnowledgeHelp, KnowledgeSections } from "@/features/knowledge/knowledge-content";

export const metadata: Metadata = {
  title: "Founder Profile",
  description: "About the founder of AIDA, the Artificial Intelligence Digital Academy.",
};

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="Founder Profile" title="The founder of AIDA" lead="The person behind the Artificial Intelligence Digital Academy." />
      <KnowledgeSections keys={["founder"]} />
      <KnowledgeHelp />
    </>
  );
}

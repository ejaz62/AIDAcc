import type { Metadata } from "next";
import { ContactCta } from "@/components/home/contact-cta";
import { Programmes } from "@/components/home/programmes";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Programmes",
  description: "AIDA programme information will be published here once confirmed.",
};

export default function ProgrammesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Programmes"
        title="AIDA programmes"
        lead="Programme details have not been published yet. Register your interest to be told as soon as they are."
      />
      <Programmes />
      <ContactCta />
    </>
  );
}

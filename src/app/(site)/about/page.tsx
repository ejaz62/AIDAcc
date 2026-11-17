import type { Metadata } from "next";
import { Clock } from "lucide-react";
import { About } from "@/components/home/about";
import { ContactCta } from "@/components/home/contact-cta";
import { PageHeader } from "@/components/layout/page-header";
import { Container, SectionHeading } from "@/components/ui/primitives";
import { site } from "@/content/site";
import { ABOUT_SECTIONS } from "@/features/content/site-content";
import { getSiteDetails } from "@/features/content/queries";
import { KnowledgeHelp, KnowledgeSections } from "@/features/knowledge/knowledge-content";

export const metadata: Metadata = {
  title: "About AIDA",
  description: `About ${site.name}, the ${site.fullName}.`,
};

export default async function AboutPage() {
  const details = await getSiteDetails();
  const published = ABOUT_SECTIONS.filter((s) => details[s.key]);
  const pending = ABOUT_SECTIONS.filter((s) => !details[s.key]);

  return (
    <>
      <PageHeader
        eyebrow="About AIDA"
        title={site.fullName}
        lead={`${site.name} stands for ${site.fullName} — a digital academy focused on artificial intelligence education.`}
      />
      <KnowledgeSections keys={["about"]} showTitles={false} />
      {published.length > 0 && (
        <section className="py-20 sm:py-24">
          <Container className="max-w-4xl space-y-14">
            {published.map((s) => (
              <div key={s.key}>
                <h2 className="text-2xl font-bold text-ink-950 sm:text-3xl">{s.label}</h2>
                <p className="mt-4 text-lg leading-relaxed whitespace-pre-line text-ink-700">{details[s.key]}</p>
              </div>
            ))}
          </Container>
        </section>
      )}
      <div className="border-t border-border">
        <About />
      </div>
      {pending.length > 0 && (
        <section className="border-y border-border bg-surface py-20 sm:py-24">
          <Container>
            <SectionHeading
              eyebrow="More to come"
              title="Further information about AIDA"
              lead="The following information will be added once it has been verified and approved for publication."
            />
            <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pending.map((item) => (
                <li
                  key={item.key}
                  className="flex items-center justify-between gap-4 rounded-(--radius-control) border border-dashed border-ink-300 px-5 py-4"
                >
                  <span className="font-semibold text-ink-800">{item.label}</span>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
                    <Clock className="size-3.5" aria-hidden />
                    To be published
                  </span>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}
      <KnowledgeHelp />
      <ContactCta />
    </>
  );
}

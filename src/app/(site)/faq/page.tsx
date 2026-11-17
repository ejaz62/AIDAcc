import type { Metadata } from "next";
import { ChevronDown, Sparkles } from "lucide-react";
import { ContactCta } from "@/components/home/contact-cta";
import { PageHeader } from "@/components/layout/page-header";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { OpenAssistantButton } from "@/features/assistant/assistant-widget";
import { getPublishedFaq } from "@/features/content/queries";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about AIDA and this website.",
};

export default async function FaqPage() {
  const faq = await getPublishedFaq();
  return (
    <>
      <PageHeader eyebrow="Help" title="Frequently asked questions" lead="Quick answers about AIDA and how this website works." />
      <Container className="py-14 sm:py-20">
        <div className="mx-auto max-w-3xl">
          {faq.length === 0 ? (
            <p className="rounded-(--radius-card) border border-dashed border-ink-300 p-10 text-center text-muted">
              Questions and answers will appear here soon.
            </p>
          ) : (
            <div className="divide-y divide-border rounded-(--radius-card) border border-border bg-surface">
              {faq.map((f) => (
                <details key={f.id} className="group px-5 py-4 sm:px-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink-950 [&::-webkit-details-marker]:hidden">
                    {f.question}
                    <ChevronDown className="size-5 shrink-0 text-ink-500 transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <p className="mt-3 leading-relaxed whitespace-pre-line text-ink-700">{f.answer}</p>
                </details>
              ))}
            </div>
          )}
          <div className="mt-10 flex flex-col items-center gap-4 rounded-(--radius-card) bg-brand-50 p-8 text-center ring-1 ring-brand-100">
            <p className="font-display text-lg font-bold text-ink-950">Can&apos;t find your answer?</p>
            <p className="max-w-md text-sm text-ink-700">Ask AIDA, the website assistant, answers questions using AIDA&apos;s published information.</p>
            <OpenAssistantButton className={buttonClasses({})}>
              <Sparkles className="size-4" aria-hidden /> Ask AIDA
            </OpenAssistantButton>
          </div>
        </div>
      </Container>
      <ContactCta />
    </>
  );
}

import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Container, SectionHeading } from "@/components/ui/primitives";
import { getPublishedFaq } from "@/features/content/queries";

/** Up to four published FAQ entries on the homepage. Hidden when none are published. */
export async function FaqPreview() {
  const faq = (await getPublishedFaq()).slice(0, 4);
  if (faq.length === 0) return null;
  return (
    <section className="border-t border-border bg-surface py-20 sm:py-28" aria-labelledby="faq-heading">
      <Container className="grid gap-10 lg:grid-cols-3 lg:gap-16">
        <div>
          <SectionHeading eyebrow="FAQ" title={<span id="faq-heading">Common questions</span>} lead="Quick answers about AIDA and this website." />
          <Link href="/faq" className="mt-6 inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:text-brand-800">
            All questions <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="divide-y divide-border rounded-(--radius-card) border border-border lg:col-span-2">
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
      </Container>
    </section>
  );
}

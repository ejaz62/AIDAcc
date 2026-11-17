import type { Metadata } from "next";
import Image from "next/image";
import { Award, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Container } from "@/components/ui/primitives";
import { KnowledgeHelp, KnowledgeSections } from "@/features/knowledge/knowledge-content";

export const metadata: Metadata = {
  title: "Founder Profile",
  description: "Muhammad Ejaz, founder of AIDA, the Artificial Intelligence Digital Academy, Lahore, Pakistan.",
};

const PHONE = "+92 322 7204898";
const EMAIL = "mentorsvalley@gmail.com";

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="Founder Profile" title="Muhammad Ejaz" lead="Founder of AIDA — Artificial Intelligence Digital Academy, Lahore, Pakistan." />

      <section className="pt-16 sm:pt-20">
        <Container className="max-w-4xl">
          <div className="grid overflow-hidden rounded-(--radius-card) border border-border bg-surface shadow-sm md:grid-cols-[18rem_1fr]">
            <div className="relative aspect-[4/5] md:aspect-auto">
              <Image
                src="/images/founder-muhammad-ejaz.webp"
                alt="Muhammad Ejaz, founder of AIDA"
                fill
                priority
                sizes="(min-width: 768px) 288px, 100vw"
                className="object-cover object-top"
              />
            </div>
            <div className="p-6 sm:p-10">
              <p className="text-sm font-semibold tracking-wide text-brand-600 uppercase">Founder</p>
              <h2 className="mt-1 text-3xl font-bold text-ink-950">Muhammad Ejaz</h2>
              <p className="mt-2 flex items-center gap-1.5 text-ink-600">
                <MapPin className="size-4 text-brand-600" aria-hidden /> Lahore, Pakistan
              </p>
              <p className="mt-6 flex items-start gap-3 rounded-xl bg-brand-50 p-4 text-ink-800 ring-1 ring-brand-100">
                <Award className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
                <span>
                  <strong className="text-ink-950">Verified learning credentials:</strong> completed all 10 Anthropic
                  Claude Academy certifications.
                </span>
              </p>
              <h3 className="mt-8 text-sm font-semibold tracking-wide text-ink-500 uppercase">Connect with Muhammad Ejaz</h3>
              <div className="mt-3 flex flex-wrap gap-3">
                <a
                  href={`https://wa.me/${PHONE.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-(--radius-control) bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <MessageCircle className="size-4" aria-hidden /> WhatsApp
                </a>
                <a
                  href={`tel:${PHONE.replace(/[^+\d]/g, "")}`}
                  className="inline-flex items-center gap-2 rounded-(--radius-control) border border-ink-300 px-4 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-50"
                >
                  <Phone className="size-4" aria-hidden /> {PHONE}
                </a>
                <a
                  href={`mailto:${EMAIL}`}
                  className="inline-flex items-center gap-2 rounded-(--radius-control) border border-ink-300 px-4 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-50"
                >
                  <Mail className="size-4" aria-hidden /> {EMAIL}
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <KnowledgeSections keys={["founder"]} showTitles={false} />
      <KnowledgeHelp />
    </>
  );
}

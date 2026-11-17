import type { Metadata } from "next";
import { CalendarDays, CheckCircle2, Clock, MessageCircle, Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Container } from "@/components/ui/primitives";
import { AdmissionForm } from "@/features/admission/admission-form";
import { COURSE_DEFAULT } from "@/features/admission/schema";
import { getPublishedProgrammes } from "@/features/content/queries";

export const metadata: Metadata = {
  title: "Student Admission Form",
  description: "Apply for the AIDA AI Training Programme: a 10-day, live, online course for beginners.",
};

const RECEPTION_WHATSAPP = "https://wa.me/923227204898";

const STEPS = [
  "Submit this form.",
  "AIDA Reception contacts you on WhatsApp to confirm your batch.",
  "Pay the course fee (Easypaisa in Pakistan; Reception explains other countries).",
  "AIDA verifies your payment and confirms your place.",
];

export default async function AdmissionPage() {
  const programmes = await getPublishedProgrammes();
  const courses = programmes.length ? programmes.map((p) => p.title) : [COURSE_DEFAULT];

  return (
    <>
      <PageHeader
        eyebrow="Official enrolment"
        title="Student Admission Form"
        lead="Begin your 10-day, hands-on journey in AI agents, website development with AI and WhatsApp AI employees. Suitable for complete beginners."
      />
      <Container className="grid gap-8 py-14 sm:py-20 lg:grid-cols-[1fr_22rem]">
        <div className="rounded-(--radius-card) border border-border bg-surface p-6 sm:p-10">
          <h2 className="text-xl font-bold text-ink-950">Your application</h2>
          <p className="mt-1 text-sm text-ink-500">Questions marked * are required.</p>
          <div className="mt-8">
            <AdmissionForm courses={courses} whatsappHref={RECEPTION_WHATSAPP} />
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-(--radius-card) border border-border bg-surface p-6">
            <h2 className="font-bold text-ink-950">How admission works</h2>
            <ol className="mt-4 space-y-3">
              {STEPS.map((s, i) => (
                <li key={s} className="flex gap-3 text-sm text-ink-700">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-on-brand">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-(--radius-card) border border-border bg-surface p-6">
            <h2 className="font-bold text-ink-950">At a glance</h2>
            <ul className="mt-4 space-y-3 text-sm text-ink-700">
              <li className="flex gap-3"><CalendarDays className="size-4 shrink-0 text-cyan-400" aria-hidden /> 10 days · batches 1st–10th, 11th–20th, 21st–30th</li>
              <li className="flex gap-3"><Clock className="size-4 shrink-0 text-cyan-400" aria-hidden /> 9:00–10:00 PM Pakistan time, live online</li>
              <li className="flex gap-3"><Wallet className="size-4 shrink-0 text-cyan-400" aria-hidden /> PKR 15,000 · SAR 200 · USD 55</li>
              <li className="flex gap-3"><CheckCircle2 className="size-4 shrink-0 text-cyan-400" aria-hidden /> Laptop required · no coding needed</li>
            </ul>
          </div>
          <a
            href={RECEPTION_WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-(--radius-card) bg-emerald-500 px-5 py-4 font-semibold text-slate-950 hover:bg-emerald-400"
          >
            <MessageCircle className="size-5" aria-hidden /> Questions? WhatsApp Reception
          </a>
        </aside>
      </Container>
    </>
  );
}

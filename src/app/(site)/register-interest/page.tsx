import type { Metadata } from "next";
import { BellRing, Lock, MailCheck } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { NotAnApplication } from "@/components/shared/not-an-application";
import { Container } from "@/components/ui/primitives";
import { RegisterInterestForm } from "@/features/interest/register-interest-form";
import { getPublishedProgrammes } from "@/features/content/queries";

export const metadata: Metadata = {
  title: "Register interest",
  description: "Register your interest in AIDA to hear when programme information is published.",
};

const nextSteps = [
  { icon: MailCheck, text: "Your details are stored securely and used only to contact you about AIDA." },
  { icon: BellRing, text: "We will email you when programme or admissions information is published." },
  { icon: Lock, text: "You can ask us to delete your details at any time." },
];

export default async function RegisterInterestPage() {
  const programmes = (await getPublishedProgrammes()).map(({ id, slug, title }) => ({ id, slug, title }));
  return (
    <>
      <PageHeader
        eyebrow="Register interest"
        title="Hear from AIDA first"
        lead="Leave your details and we will let you know when programme and admissions information is published."
      />
      <Container className="py-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-5 lg:gap-14">
          <div className="lg:col-span-3">
            <NotAnApplication className="mb-8" />
            <div className="rounded-(--radius-card) border border-border bg-surface p-6 shadow-(--shadow-card) sm:p-10">
              <h2 className="text-2xl font-bold text-ink-950">Your details</h2>
              <p className="mt-2 mb-8 text-muted">All fields are required unless marked optional.</p>
              <RegisterInterestForm programmes={programmes} />
            </div>
          </div>

          <aside className="lg:col-span-2">
            <div className="rounded-(--radius-card) border border-border bg-surface p-6 sm:p-8 lg:sticky lg:top-24">
              <h2 className="text-lg font-bold text-ink-950">What happens next</h2>
              <ul className="mt-5 space-y-5">
                {nextSteps.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <Icon className="size-4.5" aria-hidden />
                    </span>
                    <p className="text-sm leading-relaxed text-ink-700">{text}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-t border-border pt-5 text-sm text-muted">
                Read our{" "}
                <Link href="/privacy" className="font-semibold text-brand-700 underline underline-offset-2">
                  privacy notice
                </Link>{" "}
                to see how your information is handled.
              </p>
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}

import type { Metadata } from "next";
import { ArrowRight, Clock, Mail, MapPin, MessageSquareText, Phone } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card, Container } from "@/components/ui/primitives";
import { registerCta } from "@/content/site";
import { getSiteDetails } from "@/features/content/queries";
import { KnowledgeSections } from "@/features/knowledge/knowledge-content";

export const metadata: Metadata = {
  title: "Contact",
  description: "How to get in touch with AIDA.",
};

export default async function ContactPage() {
  const details = await getSiteDetails();
  const hasOfficial = Boolean(details.contactEmail || details.contactPhone || details.contactAddress);

  return (
    <>
      <PageHeader eyebrow="Contact" title="Get in touch" lead="Contact AIDA Reception for admission, payment and any other questions." />
      <KnowledgeSections keys={["contact"]} />
      <Container className="max-w-4xl pb-16 sm:pb-20">
        <div className="grid gap-6 md:grid-cols-2">
          {hasOfficial ? (
            <Card>
              <h2 className="text-xl font-bold text-ink-950">Official contact details</h2>
              <ul className="mt-6 space-y-5">
                {details.contactEmail && (
                  <li className="flex gap-3">
                    <Mail className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
                    <div>
                      <p className="text-sm text-ink-500">Email</p>
                      <a href={`mailto:${details.contactEmail}`} className="font-semibold break-all text-brand-700 hover:underline">
                        {details.contactEmail}
                      </a>
                    </div>
                  </li>
                )}
                {details.contactPhone && (
                  <li className="flex gap-3">
                    <Phone className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
                    <div>
                      <p className="text-sm text-ink-500">Telephone</p>
                      <a href={`tel:${details.contactPhone.replace(/[^+\d]/g, "")}`} className="font-semibold text-brand-700 hover:underline">
                        {details.contactPhone}
                      </a>
                    </div>
                  </li>
                )}
                {details.contactAddress && (
                  <li className="flex gap-3">
                    <MapPin className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
                    <div>
                      <p className="text-sm text-ink-500">Address</p>
                      <address className="font-semibold whitespace-pre-line text-ink-900 not-italic">{details.contactAddress}</address>
                    </div>
                  </li>
                )}
              </ul>
            </Card>
          ) : (
            <Card className="border-dashed bg-ink-50 shadow-none">
              <span className="flex size-12 items-center justify-center rounded-xl bg-ink-100 text-ink-600 ring-1 ring-ink-200">
                <Clock className="size-6" aria-hidden />
              </span>
              <h2 className="mt-6 text-xl font-bold text-ink-950">Official contact details</h2>
              <p className="mt-2 leading-relaxed text-muted">
                Further official details, such as a postal address, will appear here once confirmed. Please contact
                AIDA Reception using the details above.
              </p>
            </Card>
          )}
          <Card>
            <span className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
              <MessageSquareText className="size-6" aria-hidden />
            </span>
            <h2 className="mt-6 text-xl font-bold text-ink-950">Questions or interest</h2>
            <p className="mt-2 leading-relaxed text-muted">
              Use the Register Interest form and add your question in the message box. We will reply by email.
            </p>
            <ButtonLink href={registerCta.href} className="mt-6">
              {registerCta.label}
              <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </Card>
        </div>
      </Container>
    </>
  );
}

import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Container, DemoBadge } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: "How AIDA handles personal information submitted through this website.",
};

const sections: Array<{ heading: string; body: React.ReactNode }> = [
  {
    heading: "Who we are",
    body: (
      <p>
        This website is operated by AIDA (Artificial Intelligence Digital Academy). The legal entity responsible for your
        data (the data controller) and its contact details <strong>are to be confirmed</strong> and will be added here
        before launch.
      </p>
    ),
  },
  {
    heading: "What we collect",
    body: (
      <>
        <p>When you register your interest, we collect:</p>
        <ul>
          <li>your full name and email address;</li>
          <li>the option you choose to describe yourself (for example, student or professional);</li>
          <li>any message you choose to include;</li>
          <li>the date and time you gave consent and submitted the form.</li>
        </ul>
        <p>
          To protect the form from abuse, we also store a one-way, salted hash of your IP address together with the time
          of submission. We do not store your IP address itself.
        </p>
      </>
    ),
  },
  {
    heading: "Admission applications",
    body: (
      <>
        <p>When you apply through the Student Admission Form, we collect:</p>
        <ul>
          <li>your full name, WhatsApp number, and (optionally) your email address;</li>
          <li>your city and country, chosen course and preferred batch;</li>
          <li>your answers about computer knowledge and experience with AI tools, and any message you include.</li>
        </ul>
        <p>
          We use these details only to process your application and contact you about it (usually on WhatsApp). They are
          seen only by AIDA staff, kept while your application and enrolment are active, and deleted on request. As with the
          other forms, we store a salted hash of your IP address to prevent abuse.
        </p>
      </>
    ),
  },
  {
    heading: "Ask AIDA assistant",
    body: (
      <p>
        If you use the Ask AIDA assistant, the questions you type and the answers given are stored for 30 days so staff can
        improve the information on this website, together with a salted hash of your IP address for abuse prevention. When AI
        answers are enabled, your questions are sent to our AI provider, Anthropic, to generate a reply. Please do not enter
        personal information in the chat.
      </p>
    ),
  },
  {
    heading: "Why we use it",
    body: (
      <p>
        We use these details only to contact you about AIDA, its programmes and admissions, and to prevent spam and
        duplicate submissions. Registering interest is not an application for admission.
      </p>
    ),
  },
  {
    heading: "Legal basis",
    body: <p>We rely on your consent, which you give by ticking the box on the form. You can withdraw it at any time.</p>,
  },
  {
    heading: "Where it is stored and for how long",
    body: (
      <p>
        Data is stored in a secured PostgreSQL database. The hosting location and retention period are{" "}
        <strong>to be confirmed</strong>.
      </p>
    ),
  },
  {
    heading: "Your rights",
    body: (
      <p>
        You may ask to access, correct or delete your information, or withdraw your consent. The contact address for
        such requests will be published here once confirmed.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy notice" lead="How we handle the information you share with us." />
      <Container className="py-14 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-(--radius-control) border border-warning-200 bg-warning-50 p-5 text-sm text-warning-900">
            <DemoBadge label="Draft — requires legal review" />
            <p className="mt-3 leading-relaxed">
              This notice accurately describes what the website currently collects, but it is a draft. It must be
              reviewed and completed (data controller, contact details, hosting location and retention period) before
              the site goes live.
            </p>
          </div>
          <div className="mt-10 space-y-10">
            {sections.map((s) => (
              <section key={s.heading}>
                <h2 className="text-xl font-bold text-ink-950">{s.heading}</h2>
                <div className="mt-3 space-y-3 leading-relaxed text-ink-700 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">
                  {s.body}
                </div>
              </section>
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}

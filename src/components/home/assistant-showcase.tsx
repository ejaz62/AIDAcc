import { MessageCircle, Sparkles } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { OpenAssistantButton } from "@/features/assistant/assistant-widget";

const QUESTIONS = [
  "What programmes does AIDA offer?",
  "How do I register my interest?",
  "Is registering interest the same as applying?",
];

/** Homepage section introducing the Ask AIDA assistant; every question opens the real assistant. */
export function AssistantShowcase() {
  return (
    <section className="py-20 sm:py-28" aria-labelledby="ask-aida-heading">
      <Container>
        <div className="relative isolate grid items-center gap-10 overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-brand-700 via-brand-800 to-ink-950 px-6 py-14 text-white sm:px-12 lg:grid-cols-2 lg:gap-16 lg:py-16">
          <div className="bg-grid absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(ellipse_at_left,black_20%,transparent_70%)]" />
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold tracking-wide text-accent-300 uppercase">
              <Sparkles className="size-4" aria-hidden /> Ask AIDA
            </p>
            <h2 id="ask-aida-heading" className="mt-3 text-3xl font-bold sm:text-4xl">
              Questions? Ask our AI assistant.
            </h2>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-brand-100">
              Ask AIDA answers instantly, day or night, using AIDA&apos;s published information, and tells you honestly
              when something hasn&apos;t been announced yet.
            </p>
            <OpenAssistantButton className={buttonClasses({ variant: "inverse", size: "lg", className: "mt-8" })}>
              <MessageCircle className="size-5" aria-hidden /> Start a conversation
            </OpenAssistantButton>
          </div>
          <div className="rounded-(--radius-card) border border-white/15 bg-white/[0.06] p-5 backdrop-blur-sm sm:p-6">
            <p className="text-sm font-semibold text-brand-100">Try a question</p>
            <ul className="mt-4 space-y-3">
              {QUESTIONS.map((q) => (
                <li key={q}>
                  <OpenAssistantButton
                    question={q}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-left text-sm font-medium text-ink-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    {q}
                    <span aria-hidden className="text-brand-600">→</span>
                  </OpenAssistantButton>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}

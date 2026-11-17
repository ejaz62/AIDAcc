import { MessageCircle, Sparkles } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { OpenAssistantButton } from "@/features/assistant/assistant-widget";

const QUESTIONS = ["What is the course fee?", "Class timings kya hain?", "Do I need a laptop?", "کیا سرٹیفکیٹ ملے گا؟"];

/** Compact homepage band introducing Ask AIDA; every question opens the real assistant. */
export function AssistantShowcase() {
  return (
    <section className="py-16 sm:py-20" aria-labelledby="ask-aida-heading">
      <Container>
        <div className="rounded-[1.75rem] border border-border bg-surface px-6 py-10 text-center sm:px-12">
          <p className="flex items-center justify-center gap-2 text-sm font-semibold tracking-wide text-cyan-300 uppercase">
            <Sparkles className="size-4" aria-hidden /> Ask AIDA
          </p>
          <h2 id="ask-aida-heading" className="mt-3 text-2xl font-bold text-ink-950 sm:text-3xl">
            Questions? Ask in English, Urdu or Roman Urdu.
          </h2>
          <ul className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2.5">
            {QUESTIONS.map((q) => (
              <li key={q}>
                <OpenAssistantButton
                  question={q}
                  className="rounded-full border border-border bg-ink-100 px-4 py-2 text-sm font-medium text-ink-800 transition-colors hover:border-cyan-400/50 hover:text-ink-950"
                >
                  <span dir="auto">{q}</span>
                </OpenAssistantButton>
              </li>
            ))}
          </ul>
          <OpenAssistantButton className={buttonClasses({ size: "lg", className: "mt-7" })}>
            <MessageCircle className="size-5" aria-hidden /> Start a conversation
          </OpenAssistantButton>
        </div>
      </Container>
    </section>
  );
}

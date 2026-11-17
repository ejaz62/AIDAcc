import Image from "next/image";
import { MessageCircle, Sparkles } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { OpenAssistantButton } from "@/features/assistant/assistant-widget";

const QUESTIONS = ["What is the course fee?", "Class timings kya hain?", "Do I need a laptop?", "کیا سرٹیفکیٹ ملے گا؟"];

/** Homepage section introducing the Ask AIDA assistant; every question opens the real assistant. */
export function AssistantShowcase() {
  return (
    <section className="py-20 sm:py-28" aria-labelledby="ask-aida-heading">
      <Container>
        <div className="relative isolate grid items-center overflow-hidden rounded-[1.75rem] bg-ink-950 text-white lg:grid-cols-2">
          <div className="bg-grid absolute inset-0 -z-10 opacity-50 [mask-image:radial-gradient(ellipse_at_left,black_20%,transparent_70%)]" />
          <div className="px-6 py-14 sm:px-12 lg:py-16">
            <p className="flex items-center gap-2 text-sm font-semibold tracking-wide text-accent-300 uppercase">
              <Sparkles className="size-4" aria-hidden /> Meet Ask AIDA
            </p>
            <h2 id="ask-aida-heading" className="mt-3 text-3xl font-bold sm:text-4xl">
              Your AI student assistant, day or night.
            </h2>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-ink-300">
              Ask about fees, timings, admission or requirements in English, Urdu or Roman Urdu. Answers come from
              AIDA&apos;s verified information.
            </p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {QUESTIONS.map((q) => (
                <li key={q}>
                  <OpenAssistantButton
                    question={q}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white/10 px-4 py-3 text-left text-sm font-medium text-white ring-1 ring-white/15 transition hover:-translate-y-0.5 hover:bg-white/15"
                  >
                    <span dir="auto">{q}</span>
                    <span aria-hidden className="text-accent-300">→</span>
                  </OpenAssistantButton>
                </li>
              ))}
            </ul>
            <OpenAssistantButton className={buttonClasses({ variant: "inverse", size: "lg", className: "mt-8" })}>
              <MessageCircle className="size-5" aria-hidden /> Start a conversation
            </OpenAssistantButton>
          </div>
          <div className="relative h-72 sm:h-96 lg:h-full lg:min-h-[520px]">
            <Image
              src="/images/ask-aida-robot.webp"
              alt="Ask AIDA, the academy's AI student assistant"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-[45%_20%]"
            />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent lg:bg-gradient-to-r" />
          </div>
        </div>
      </Container>
    </section>
  );
}

import Image from "next/image";
import { MessageCircle, Sparkles } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { AskAidaInline, ASSISTANT_IMAGE, OpenAssistantButton } from "@/features/assistant/assistant-widget";

const QUESTIONS = ["What is the course fee?", "Class timings kya hain?", "Is the fee refundable?", "کیا سرٹیفکیٹ ملے گا؟"];

/** Homepage Ask AIDA section: large assistant illustration beside the conversation starter. */
export function AssistantShowcase() {
  return (
    <section className="py-16 sm:py-20" aria-labelledby="ask-aida-heading">
      <Container>
        <div className="grid items-center gap-8 overflow-hidden rounded-[1.75rem] border border-border bg-surface p-6 sm:p-10 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-14">
          {/* The illustration is 447×420; it is never shown larger than that, so it stays sharp. */}
          <div className="scale-original relative mx-auto w-full max-w-[26rem]">
            <div aria-hidden className="absolute -inset-4 rounded-[2rem] bg-cyan-400/15 blur-2xl" />
            <Image
              src={ASSISTANT_IMAGE}
              alt="Ask AIDA, the academy's virtual assistant"
              width={447}
              height={420}
              unoptimized
              className="relative h-auto w-full rounded-3xl ring-1 ring-white/10"
            />
            <span className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-ink-950/80 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/15 backdrop-blur">
              <span className="size-2 rounded-full bg-emerald-400" aria-hidden /> Online now
            </span>
          </div>

          <div>
            <p className="flex items-center gap-2 text-sm font-semibold tracking-wide text-cyan-300 uppercase">
              <Sparkles className="size-4" aria-hidden /> Ask AIDA
            </p>
            <h2 id="ask-aida-heading" className="mt-3 text-3xl font-bold text-ink-950 sm:text-4xl">
              Questions? Ask in English, اردو or Roman Urdu.
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-600">
              Ask about fees, timings, refunds, admission or what you will learn. Ask AIDA replies in your language, using
              AIDA&apos;s verified information.
            </p>

            <div className="mt-7 max-w-xl">
              <AskAidaInline placeholder="e.g. Course ki fee kitni hai?" />
            </div>

            <p className="mt-6 text-xs font-semibold tracking-wide text-ink-500 uppercase">Popular questions</p>
            <ul className="mt-3 flex flex-wrap gap-2.5">
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

            <OpenAssistantButton className={buttonClasses({ variant: "secondary", className: "mt-7" })}>
              <MessageCircle className="size-4" aria-hidden /> Open the chat
            </OpenAssistantButton>
          </div>
        </div>
      </Container>
    </section>
  );
}

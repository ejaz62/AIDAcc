import { ArrowRight, MessageCircle } from "lucide-react";
import { OpenAssistantButton } from "@/features/assistant/assistant-widget";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { HeroShowcase } from "./hero-showcase";

const FOCUS = ["Hands-on practice", "Beginner-friendly", "WhatsApp AI Employees", "Marketable client skills"];

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="bg-grid absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_65%)]" />
      <div aria-hidden className="absolute -top-40 left-1/2 -z-10 h-[28rem] w-[60rem] -translate-x-1/2 rounded-full bg-cyan-500/15 blur-3xl" />

      <Container className="pt-24 pb-16 text-center sm:pt-20 sm:pb-24">
        <p className="mx-auto inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full border border-cyan-400/25 bg-cyan-400/5 px-4 py-1.5 text-[0.7rem] font-bold tracking-widest uppercase sm:text-xs">
          <span className="text-cyan-300">Artificial Intelligence Digital Academy</span>
          <span className="text-ink-500" aria-hidden>·</span>
          <span className="text-ink-800">Founded by Muhammad Ejaz</span>
          <span className="text-ink-500" aria-hidden>·</span>
          <span className="text-cyan-300">Lahore, Pakistan</span>
        </p>

        <h1 className="mx-auto mt-8 text-4xl font-extrabold tracking-tight text-ink-950 sm:text-6xl lg:text-7xl">
          AIDA Digital Academy
        </h1>
        <p className="mx-auto mt-5 max-w-3xl font-display text-2xl leading-snug font-bold text-ink-950 sm:text-4xl">
          Learn AI. <span className="text-cyan-300">Build Intelligent Solutions.</span> Shape Your Future.
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink-600 sm:text-lg">
          A practical academy for modern AI skills. In 10 days of live, online classes, beginners and professionals learn
          AI coding tools, intelligent agents and WhatsApp AI employees that deliver real business results — no coding
          experience needed.
        </p>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/programme" size="lg" className="uppercase tracking-wide">
            Explore the programme <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
          <OpenAssistantButton className={buttonClasses({ variant: "secondary", size: "lg" })}>
            <MessageCircle className="size-4" aria-hidden /> Ask AIDA
          </OpenAssistantButton>
          <ButtonLink href="/admission" variant="secondary" size="lg">
            Apply now
          </ButtonLink>
        </div>

        <ul className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-ink-500">
          <li className="font-semibold text-ink-800">Core focus:</li>
          {FOCUS.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-cyan-400" aria-hidden /> {f}
            </li>
          ))}
        </ul>

        <div className="mt-14 text-left">
          <HeroShowcase />
        </div>
      </Container>
    </section>
  );
}

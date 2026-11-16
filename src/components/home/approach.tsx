import { approach } from "@/content/site";
import { Container, DemoBadge, SectionHeading } from "@/components/ui/primitives";

export function Approach() {
  return (
    <section id="approach" className="border-y border-border bg-surface py-20 sm:py-28">
      <Container>
        <div className="flex flex-col items-center gap-4">
          <SectionHeading align="center" eyebrow={approach.eyebrow} title={approach.title} lead={approach.lead} />
          {approach.placeholder && <DemoBadge label="Draft copy — awaiting approval" />}
        </div>

        <ol className="relative mt-16 grid gap-10 md:grid-cols-4 md:gap-6">
          <div
            aria-hidden
            className="absolute top-6 right-[12.5%] left-[12.5%] hidden h-px bg-gradient-to-r from-brand-200 via-brand-400 to-accent-400 md:block"
          />
          {approach.steps.map((step, i) => (
            <li key={step.title} className="relative flex flex-col items-center text-center">
              <span className="relative z-10 flex size-12 items-center justify-center rounded-full bg-ink-950 font-display text-base font-bold text-white ring-8 ring-surface">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 text-lg font-bold text-ink-950">{step.title}</h3>
              <p className="mt-2 max-w-60 leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

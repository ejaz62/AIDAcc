import { Brain, Globe, ShieldCheck, Wrench, type LucideIcon } from "lucide-react";
import { about, pillars } from "@/content/site";
import { Card, Container, DemoBadge, SectionHeading } from "@/components/ui/primitives";

const icons: Record<(typeof pillars)[number]["icon"], LucideIcon> = {
  brain: Brain,
  wrench: Wrench,
  shield: ShieldCheck,
  globe: Globe,
};

export function About() {
  return (
    <section id="about" className="py-20 sm:py-28">
      <Container>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading eyebrow={about.eyebrow} title={about.title} lead={about.lead} />
          {about.placeholder && <DemoBadge label="Draft copy — awaiting approval" className="self-start lg:self-end" />}
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p) => {
            const Icon = icons[p.icon];
            return (
              <Card key={p.title} interactive className="group">
                <div className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                  <Icon className="size-6" aria-hidden />
                </div>
                <h3 className="mt-6 text-lg font-bold text-ink-950">{p.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{p.body}</p>
              </Card>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

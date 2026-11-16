import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Card, Container, DemoBadge, SectionHeading } from "@/components/ui/primitives";
import { Logo, LogoMark } from "@/components/ui/logo";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

const scales = [
  { name: "brand", steps: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] },
  { name: "accent", steps: [100, 200, 300, 400, 500, 600, 700] },
  { name: "ink", steps: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] },
];

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border py-12">
      <h2 className="text-sm font-semibold tracking-wide text-ink-500 uppercase">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** Internal reference page for the AIDA design system (not linked publicly). */
export default function DesignSystemPage() {
  return (
    <Container className="py-16">
      <SectionHeading
        eyebrow="Internal reference"
        title="AIDA design system"
        lead="Tokens and components that every AIDA page is built from. Defined in src/app/globals.css and src/components/ui."
      />

      <Block title="Logo">
        <div className="flex flex-wrap items-center gap-8">
          <Logo />
          <div className="rounded-xl bg-ink-950 p-4">
            <Logo inverse />
          </div>
          <LogoMark className="size-14" />
        </div>
      </Block>

      <Block title="Colour">
        <div className="space-y-6">
          {scales.map((s) => (
            <div key={s.name}>
              <p className="mb-2 font-mono text-sm text-ink-700">{s.name}</p>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-11">
                {s.steps.map((step) => (
                  <div key={step}>
                    <div
                      className="h-14 rounded-lg ring-1 ring-black/5"
                      style={{ background: `var(--color-${s.name}-${step})` }}
                    />
                    <p className="mt-1 font-mono text-xs text-ink-500">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Block>

      <Block title="Typography">
        <div className="space-y-4">
          <p className="font-display text-5xl font-extrabold tracking-tight text-ink-950">Display — Plus Jakarta Sans</p>
          <p className="font-display text-3xl font-bold text-ink-950">Heading level two</p>
          <p className="font-display text-xl font-bold text-ink-950">Heading level three</p>
          <p className="max-w-2xl text-lg leading-relaxed text-muted">
            Lead paragraph — Inter. Used for introductions beneath section headings.
          </p>
          <p className="max-w-2xl leading-relaxed text-ink-700">Body text — Inter, 16px, relaxed line height.</p>
        </div>
      </Block>

      <Block title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>
            Primary <ArrowRight className="size-4" aria-hidden />
          </Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 rounded-xl bg-ink-950 p-5">
          <Button variant="inverse">Inverse</Button>
          <Button variant="outline-inverse">Outline inverse</Button>
        </div>
      </Block>

      <Block title="Badges">
        <div className="flex flex-wrap gap-3">
          <Badge>Brand</Badge>
          <Badge tone="accent">Accent</Badge>
          <Badge tone="neutral">Neutral</Badge>
          <Badge tone="warning">Warning</Badge>
          <DemoBadge />
        </div>
      </Block>

      <Block title="Cards">
        <div className="grid gap-5 md:grid-cols-2">
          <Card>
            <h3 className="text-lg font-bold">Static card</h3>
            <p className="mt-2 text-muted">Surface, border and soft shadow.</p>
          </Card>
          <Card interactive>
            <h3 className="text-lg font-bold">Interactive card</h3>
            <p className="mt-2 text-muted">Lifts on hover.</p>
          </Card>
        </div>
      </Block>
    </Container>
  );
}

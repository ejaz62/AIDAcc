import { ArrowRight, Sparkles } from "lucide-react";
import { hero } from "@/content/site";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Container } from "@/components/ui/primitives";
import { HeroVisual } from "./hero-visual";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-ink-950 text-white">
      <div className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <div className="absolute -top-40 left-1/2 -z-10 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-brand-600/30 blur-3xl" />

      <Container className="grid items-center gap-14 py-20 sm:py-24 lg:grid-cols-2 lg:gap-10 lg:py-32">
        <div>
          <Badge tone="inverse">
            <Sparkles className="size-3.5 text-accent-300" aria-hidden />
            {hero.eyebrow}
          </Badge>
          <h1 className="mt-6 text-4xl leading-[1.08] font-extrabold sm:text-5xl lg:text-6xl">
            {hero.title} <span className="text-gradient">{hero.highlight}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-300">{hero.lead}</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={hero.primaryCta.href} variant="inverse" size="lg">
              {hero.primaryCta.label}
              <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href={hero.secondaryCta.href} variant="outline-inverse" size="lg">
              {hero.secondaryCta.label}
            </ButtonLink>
          </div>
        </div>
        <HeroVisual />
      </Container>
    </section>
  );
}

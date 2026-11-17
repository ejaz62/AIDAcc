import type { ReactNode } from "react";
import { Container } from "@/components/ui/primitives";

export function PageHeader({ eyebrow, title, lead }: { eyebrow: string; title: string; lead?: ReactNode }) {
  return (
    <section className="scale-original relative isolate overflow-hidden border-b border-white/5 bg-ink-950 text-white">
      <div className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black_25%,transparent_70%)]" />
      <div className="absolute -top-32 left-1/2 -z-10 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-brand-600/30 blur-3xl" />
      <Container className="py-16 sm:py-20">
        <p className="text-sm font-semibold tracking-wide text-accent-300 uppercase">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold sm:text-5xl">{title}</h1>
        {lead && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-300">{lead}</p>}
      </Container>
    </section>
  );
}

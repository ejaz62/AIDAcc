import { ArrowRight, Mail } from "lucide-react";
import { contact, registerCta } from "@/content/site";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";

/** Closing call-to-action band, reused across pages. */
export function ContactCta() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <div className="scale-original relative isolate overflow-hidden rounded-[1.75rem] border border-white/10 bg-ink-950 px-6 py-16 text-center sm:px-16 sm:py-20">
          <div className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
          <div className="absolute -bottom-32 left-1/2 -z-10 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-accent-500/25 blur-3xl" />
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white/10 text-accent-300 ring-1 ring-white/15">
            <Mail className="size-7" aria-hidden />
          </span>
          <p className="mt-6 text-sm font-semibold tracking-wide text-accent-300 uppercase">{contact.eyebrow}</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold text-white sm:text-4xl">{contact.title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink-300">{contact.lead}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/contact" variant="inverse" size="lg">
              Contact Reception
              <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href={registerCta.href} variant="outline-inverse" size="lg">
              {registerCta.label}
            </ButtonLink>
          </div>
          <p className="mx-auto mt-4 max-w-md text-sm text-ink-400">
            Registering interest is not an application for admission.
          </p>
        </div>
      </Container>
    </section>
  );
}

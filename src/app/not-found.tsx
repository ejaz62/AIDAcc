import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { SiteShell } from "@/components/layout/site-shell";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <SiteShell>
    <Container className="flex flex-col items-center py-28 text-center sm:py-36">
      <p className="font-display text-7xl font-extrabold text-brand-600">404</p>
      <h1 className="mt-4 text-3xl font-bold text-ink-950">Page not found</h1>
      <p className="mt-3 max-w-md text-muted">The page you are looking for does not exist or may have moved.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/">Go to homepage</ButtonLink>
        <ButtonLink href="/contact" variant="secondary">
          Contact
        </ButtonLink>
      </div>
    </Container>
    </SiteShell>
  );
}

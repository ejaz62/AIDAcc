import Link from "next/link";
import { Suspense } from "react";
import { Menu } from "lucide-react";
import { registerCta, site } from "@/content/site";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { Logo } from "@/components/ui/logo";
import { DesktopNavLinks } from "./nav-links";
import { MobileNav } from "./mobile-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70">
      {/* Blur lives on a sibling layer: backdrop-filter on the header itself would trap the
          fixed-position mobile menu inside the header's box. */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-background/85 backdrop-blur-xl" />
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link href="/" aria-label={`${site.name} home`} className="shrink-0 rounded-md">
          <Logo />
        </Link>

        <DesktopNavLinks />

        <div className="flex items-center gap-2">
          <ButtonLink href={registerCta.href} size="sm" className="hidden sm:inline-flex">
            {registerCta.label}
          </ButtonLink>
          <Suspense
            fallback={
              <span className="inline-flex size-10 items-center justify-center text-ink-700 xl:hidden" aria-hidden>
                <Menu className="size-5" />
              </span>
            }
          >
            <MobileNav />
          </Suspense>
        </div>
      </Container>
    </header>
  );
}

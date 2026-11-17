import Link from "next/link";
import { Lock } from "lucide-react";
import { footerNavigation, site } from "@/content/site";
import { Container } from "@/components/ui/primitives";
import { Logo } from "@/components/ui/logo";

export function SiteFooter() {
  return (
    <footer className="scale-original border-t border-white/10 bg-ink-950 text-ink-400">
      <Container className="py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo inverse />
            <p className="mt-4 text-sm leading-relaxed">{site.fullName}</p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm sm:grid-cols-3">
            {footerNavigation.map((item) => (
              <Link key={item.href} href={item.href} className="transition-colors hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs sm:flex-row sm:justify-between">
          <p>
            &copy; {site.fullName}. All rights reserved.
          </p>
          <Link href="/admin/sign-in" rel="nofollow" className="flex items-center gap-1.5 transition-colors hover:text-white">
            <Lock className="size-3.5" aria-hidden /> Staff login
          </Link>
        </div>
      </Container>
    </footer>
  );
}

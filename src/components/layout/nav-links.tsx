"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { navigation } from "@/content/site";
import { cn } from "@/lib/cn";

export function useIsActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
}

function NavList({ isActive }: { isActive: (href: string) => boolean }) {
  return (
    <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
      {navigation.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
              active ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-100 hover:text-ink-950",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function ActiveNavList() {
  return <NavList isActive={useIsActive()} />;
}

/** On dynamic routes the pathname streams in, so the plain links render first. */
export function DesktopNavLinks() {
  return (
    <Suspense fallback={<NavList isActive={() => false} />}>
      <ActiveNavList />
    </Suspense>
  );
}

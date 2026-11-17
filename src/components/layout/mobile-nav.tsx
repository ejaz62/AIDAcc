"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { navigation, registerCta } from "@/content/site";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useIsActive } from "./nav-links";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const [top, setTop] = useState(64);
  const pathname = usePathname();
  const isActive = useIsActive();

  // Close automatically when the route changes (e.g. browser back button).
  if (open && openedAt !== pathname) {
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Open the panel directly beneath the header, wherever it currently sits.
    setTop(e.currentTarget.closest("header")?.getBoundingClientRect().bottom ?? 64);
    setOpenedAt(pathname);
    setOpen((v) => !v);
  };

  return (
    <div className="xl:hidden">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="inline-flex size-10 items-center justify-center rounded-(--radius-control) text-ink-700 hover:bg-ink-100"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {open && (
        <div
          id="mobile-menu"
          style={{ top }}
          className="fixed inset-x-0 bottom-0 z-40 overflow-y-auto border-t border-border bg-surface px-4 py-6"
        >
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-(--radius-control) px-3 py-3 text-base font-medium",
                    active ? "bg-brand-50 text-brand-700" : "text-ink-800 hover:bg-ink-100",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Link
            href={registerCta.href}
            onClick={() => setOpen(false)}
            className={buttonClasses({ size: "lg", className: "mt-6 w-full" })}
          >
            {registerCta.label}
          </Link>
        </div>
      )}
    </div>
  );
}

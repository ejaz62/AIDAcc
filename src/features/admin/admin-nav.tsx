"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { BookOpen, Building2, HelpCircle, Library, Sparkles, ClipboardList, LayoutDashboard, Mail, Menu, ScrollText, UserCog, Users, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

const items: Array<{ label: string; href: string; icon: LucideIcon }> = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Registrations", href: "/admin/registrations", icon: ClipboardList },
  { label: "Programmes", href: "/admin/programmes", icon: BookOpen },
  { label: "Knowledge base", href: "/admin/knowledge", icon: Library },
  { label: "FAQ", href: "/admin/faq", icon: HelpCircle },
  { label: "Assistant", href: "/admin/assistant", icon: Sparkles },
  { label: "Site details", href: "/admin/site", icon: Building2 },
  { label: "Staff", href: "/admin/staff", icon: Users },
  { label: "Emails", href: "/admin/emails", icon: Mail },
  { label: "Audit log", href: "/admin/audit", icon: ScrollText },
];

function useActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
}

function ActiveLinks({ onNavigate }: { onNavigate?: () => void }) {
  return <LinkList isActive={useActive()} onNavigate={onNavigate} />;
}

/** The pathname is request data, so the highlighted state streams in; the plain links render instantly. */
function Links({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Suspense fallback={<LinkList isActive={() => false} onNavigate={onNavigate} />}>
      <ActiveLinks onNavigate={onNavigate} />
    </Suspense>
  );
}

function LinkList({ isActive, onNavigate }: { isActive: (href: string) => boolean; onNavigate?: () => void }) {
  return (
    <>
      {items.map(({ label, href, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-(--radius-control) px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-white/10 text-white" : "text-ink-300 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className="size-4.5" aria-hidden />
            {label}
          </Link>
        );
      })}
    </>
  );
}

export function AdminSidebarNav() {
  return (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      <Links />
    </nav>
  );
}

export function AdminMobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="admin-mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        className="inline-flex size-10 items-center justify-center rounded-(--radius-control) text-ink-200 hover:bg-white/10"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
      {open && (
        <nav
          id="admin-mobile-nav"
          aria-label="Admin"
          className="absolute inset-x-0 top-full z-40 flex flex-col gap-1 border-t border-white/10 bg-ink-950 p-3 shadow-xl"
        >
          <Links onNavigate={() => setOpen(false)} />
          <Link
            href="/admin/account"
            onClick={() => setOpen(false)}
            className="mt-1 flex items-center gap-3 rounded-(--radius-control) border-t border-white/10 px-3 pt-3 pb-2.5 text-sm font-medium text-ink-300 hover:text-white"
          >
            <UserCog className="size-4.5" aria-hidden />
            My account
          </Link>
        </nav>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { AdminMobileNav, AdminSidebarNav } from "@/features/admin/admin-nav";
import { signOut } from "@/features/admin/auth-actions";
import { requireAdmin } from "@/features/admin/session";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · AIDA Admin" },
  robots: { index: false, follow: false },
};

async function CurrentUser({ compact = false }: { compact?: boolean }) {
  const user = await requireAdmin();
  return (
    <div className={compact ? "flex items-center gap-2" : "border-t border-white/10 pt-4"}>
      {!compact && (
        <Link href="/admin/account" className="mb-3 block min-w-0 rounded-(--radius-control) px-1 py-1 hover:bg-white/5">
          <p className="truncate text-sm font-semibold text-white">{user.name}</p>
          <p className="truncate text-xs text-ink-400">{user.email}</p>
          <p className="mt-0.5 text-xs text-accent-300">My account</p>
        </Link>
      )}
      <form action={signOut}>
        <button
          type="submit"
          className="flex w-full items-center gap-2 rounded-(--radius-control) px-3 py-2 text-sm font-medium text-ink-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="size-4" aria-hidden />
          Sign out
        </button>
      </form>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-ink-50 lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-ink-950 p-5 lg:sticky lg:top-0 lg:flex lg:h-screen">
        <Link href="/admin" className="mb-8 rounded-md px-1">
          <Logo inverse />
          <span className="mt-2 block text-xs font-semibold tracking-wider text-accent-300 uppercase">Staff admin</span>
        </Link>
        <AdminSidebarNav />
        <div className="mt-auto">
          <Suspense fallback={null}>
            <CurrentUser />
          </Suspense>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="relative flex h-16 items-center justify-between bg-ink-950 px-4 lg:hidden">
        <Link href="/admin" className="rounded-md" aria-label="Admin dashboard">
          <Logo inverse />
        </Link>
        <div className="flex items-center gap-1">
          <Suspense fallback={null}>
            <CurrentUser compact />
          </Suspense>
          <AdminMobileNav />
        </div>
      </header>

      <main id="main" className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
        {children}
      </main>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { SignInForm } from "@/features/admin/sign-in-form";

export const metadata: Metadata = {
  title: "Staff sign-in",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <main className="relative isolate flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-ink-950 px-4 py-12">
      <div className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      <div className="absolute top-1/4 left-1/2 -z-10 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-brand-600/25 blur-3xl" />
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo inverse />
        </div>
        <div className="rounded-(--radius-card) bg-surface p-6 shadow-2xl sm:p-10">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Lock className="size-5" aria-hidden />
            </span>
            <div>
              <h1 className="text-xl font-bold text-ink-950">Staff sign-in</h1>
              <p className="text-sm text-muted">For authorised AIDA staff only.</p>
            </div>
          </div>
          <SignInForm />
        </div>
        <p className="mt-6 text-center text-sm text-ink-400">
          <Link href="/" className="hover:text-white">
            ← Back to the AIDA website
          </Link>
        </p>
      </div>
    </main>
  );
}

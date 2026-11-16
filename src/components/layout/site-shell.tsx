import type { ReactNode } from "react";
import { PreviewNotice } from "./preview-notice";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

/** Public website chrome: skip link, preview notice, header and footer. */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-[60] rounded-md bg-brand-600 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <PreviewNotice />
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}

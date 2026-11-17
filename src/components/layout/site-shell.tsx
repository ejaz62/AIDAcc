import type { ReactNode } from "react";
import { AssistantWidget } from "@/features/assistant/assistant-widget";
import { getSiteDetails } from "@/features/content/queries";
import { PreviewNotice } from "./preview-notice";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

async function AssistantIfEnabled() {
  const { assistantEnabled } = await getSiteDetails();
  return assistantEnabled ? <AssistantWidget /> : null;
}

/** Public website chrome: skip link, preview notice, header, footer and the Ask AIDA assistant. */
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
      <AssistantIfEnabled />
    </>
  );
}

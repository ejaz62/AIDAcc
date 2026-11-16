import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { site } from "@/content/site";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${site.name} — ${site.fullName}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  // Keep the site out of search engines until launch (see content/site.ts).
  robots: site.blockSearchEngines ? { index: false, follow: false } : undefined,
};

export const viewport: Viewport = {
  themeColor: "#0b0e19",
};

/** Root document shell shared by the public site and the admin area. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  );
}

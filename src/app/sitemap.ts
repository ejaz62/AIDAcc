import type { MetadataRoute } from "next";
import { getPublishedProgrammes } from "@/features/content/queries";
import { getSiteUrl } from "@/lib/site-config";

/** Public pages plus every published programme. Admin pages are never listed. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const url = (path: string) => new URL(path, base).toString();
  const staticPages = ["/", "/about", "/programmes", "/register-interest", "/faq", "/contact", "/privacy"];
  const programmes = await getPublishedProgrammes();
  return [
    ...staticPages.map((path) => ({ url: url(path), changeFrequency: "weekly" as const, priority: path === "/" ? 1 : 0.7 })),
    ...programmes.map((p) => ({ url: url(`/programmes/${p.slug}`), changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}

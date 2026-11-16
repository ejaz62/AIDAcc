/**
 * Deployment-level site settings, read from environment variables.
 *
 * SITE_URL               Public origin, e.g. https://aida.example.org (falls back to BETTER_AUTH_URL, then localhost).
 * ALLOW_SEARCH_INDEXING  "true" only on the live production site. Anything else keeps search engines out,
 *                        so local, preview and staging deployments are never indexed.
 */
export function getSiteUrl(): URL {
  const raw = process.env.SITE_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";
  try {
    return new URL(raw);
  } catch {
    return new URL("http://localhost:3000");
  }
}

export function isIndexingAllowed(): boolean {
  return process.env.ALLOW_SEARCH_INDEXING === "true";
}

/**
 * Deployment-level site settings, read from environment variables.
 *
 * BETTER_AUTH_URL        The site's main address (also where staff sign in). Used first, so links in
 *                        emails always open on the address where admin sign-in works.
 * SITE_URL               Fallback public origin when BETTER_AUTH_URL is not set (then localhost).
 * ALLOW_SEARCH_INDEXING  "true" only on the live production site. Anything else keeps search engines out,
 *                        so local, preview and staging deployments are never indexed.
 */
export function getSiteUrl(): URL {
  const raw = process.env.BETTER_AUTH_URL || process.env.SITE_URL || "http://localhost:3000";
  try {
    return new URL(raw);
  } catch {
    return new URL("http://localhost:3000");
  }
}

export function isIndexingAllowed(): boolean {
  return process.env.ALLOW_SEARCH_INDEXING === "true";
}

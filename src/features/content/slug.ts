/** URL slug helpers, safe to use in client components. */
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const COMBINING_MARKS = /\p{M}/gu;

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

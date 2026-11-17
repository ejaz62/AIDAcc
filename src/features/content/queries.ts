import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getDb } from "@/lib/db";
import { getPublishedProgrammeBySlug, listPublishedProgrammes } from "./programmes";
import { getPublishedSiteContent } from "./site-content";
import { listPublishedFaq } from "@/features/faq/faq";
import { CONTENT_TAGS } from "./tags";

/*
 * Cached reads of PUBLISHED content for the public site. Drafts are never
 * returned. Admin actions expire these with `updateTag`, so changes appear
 * immediately; `cacheLife` is only a safety net.
 */

export async function getPublishedProgrammes() {
  "use cache";
  cacheTag(CONTENT_TAGS.programmes);
  cacheLife("hours");
  return listPublishedProgrammes(getDb());
}

export async function getPublishedProgramme(slug: string) {
  "use cache";
  cacheTag(CONTENT_TAGS.programmes);
  cacheLife("hours");
  return getPublishedProgrammeBySlug(getDb(), slug);
}

export async function getSiteDetails() {
  "use cache";
  cacheTag(CONTENT_TAGS.site);
  cacheLife("hours");
  return getPublishedSiteContent(getDb());
}

export async function getPublishedFaq() {
  "use cache";
  cacheTag(CONTENT_TAGS.faq);
  cacheLife("hours");
  return listPublishedFaq(getDb());
}

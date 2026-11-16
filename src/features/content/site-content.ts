import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { AUDIT_ACTIONS, writeAudit } from "@/features/admin/audit";
import type { AdminUser } from "@/features/admin/authorize";

export const SITE_KEY = "site";

const text = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, { error: `${label} must be ${max} characters or fewer.` })
    .catch("")
    .default("");

/** Official site details. Every field is optional; empty fields keep their public placeholder. */
export const siteContentSchema = z.object({
  contactEmail: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .refine((v) => v === "" || z.email().safeParse(v).success, { error: "Enter a valid email address." })
    .default(""),
  contactPhone: z
    .string()
    .trim()
    .max(40)
    .refine((v) => v === "" || /^[+()\d\s.-]{5,40}$/.test(v), { error: "Enter a valid telephone number." })
    .default(""),
  contactAddress: text(500, "Address"),
  mission: text(3000, "Mission and vision"),
  leadership: text(3000, "Leadership and team"),
  history: text(3000, "History"),
  accreditation: text(3000, "Accreditation and recognition"),
  location: text(500, "Location"),
  /** Shows the "development preview" strip across the public site. */
  showPreviewNotice: z.boolean().default(true),
});

export type SiteContent = z.infer<typeof siteContentSchema>;

export const EMPTY_SITE_CONTENT: SiteContent = siteContentSchema.parse({});

/** Lenient read of stored JSON — unknown or invalid values fall back to defaults. */
export function readSiteContent(json: unknown): SiteContent {
  const parsed = siteContentSchema.safeParse(json ?? {});
  return parsed.success ? parsed.data : EMPTY_SITE_CONTENT;
}

export const ABOUT_SECTIONS = [
  { key: "mission", label: "Mission and vision" },
  { key: "leadership", label: "Leadership and team" },
  { key: "history", label: "History" },
  { key: "accreditation", label: "Accreditation and recognition" },
  { key: "location", label: "Location" },
] as const;

export async function getSiteContentAdmin(db: PrismaClient) {
  const row = await db.siteContent.findUnique({ where: { key: SITE_KEY } });
  const draft = readSiteContent(row?.draft);
  const published = row?.published ? readSiteContent(row.published) : null;
  return {
    draft,
    published,
    publishedAt: row?.publishedAt ?? null,
    hasUnpublishedChanges: !published || JSON.stringify(draft) !== JSON.stringify(published),
  };
}

export async function saveSiteDraft(db: PrismaClient, actor: AdminUser, content: SiteContent) {
  await db.$transaction(async (tx) => {
    await tx.siteContent.upsert({
      where: { key: SITE_KEY },
      create: { key: SITE_KEY, draft: content },
      update: { draft: content },
    });
    await writeAudit(tx, actor, AUDIT_ACTIONS.siteDraftSaved, { type: "site", id: SITE_KEY });
  });
}

export async function publishSiteContent(db: PrismaClient, actor: AdminUser) {
  return db.$transaction(async (tx) => {
    const row = await tx.siteContent.findUnique({ where: { key: SITE_KEY } });
    if (!row) return false;
    await tx.siteContent.update({ where: { key: SITE_KEY }, data: { published: row.draft ?? {}, publishedAt: new Date() } });
    await writeAudit(tx, actor, AUDIT_ACTIONS.sitePublished, { type: "site", id: SITE_KEY });
    return true;
  });
}

/** What the public site shows: the published copy, or empty placeholders if nothing is published. */
export async function getPublishedSiteContent(db: PrismaClient): Promise<SiteContent> {
  const row = await db.siteContent.findUnique({ where: { key: SITE_KEY }, select: { published: true } });
  return row?.published ? readSiteContent(row.published) : EMPTY_SITE_CONTENT;
}

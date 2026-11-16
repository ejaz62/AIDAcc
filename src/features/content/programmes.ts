import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { AUDIT_ACTIONS, writeAudit } from "@/features/admin/audit";
import type { AdminUser } from "@/features/admin/authorize";

import { SLUG_RE, slugify } from "./slug";

export { SLUG_RE, slugify };

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, { error: `${label} must be ${max} characters or fewer.` })
    .optional()
    .transform((v) => (v ? v : null));

/** Fields staff can edit on a programme. Empty optional fields are stored as null. */
export const programmeInputSchema = z
  .object({
    title: z
      .string({ error: "Please enter a title." })
      .trim()
      .min(3, { error: "Title must be at least 3 characters." })
      .max(150, { error: "Title must be 150 characters or fewer." }),
    slug: z.string().trim().toLowerCase().max(80).optional(),
    summary: optionalText(300, "Summary"),
    overview: optionalText(5000, "Overview"),
    audience: optionalText(3000, "Who it is for"),
    duration: optionalText(200, "Duration"),
    studyFormat: optionalText(200, "Study format"),
    entryRequirements: optionalText(3000, "Entry requirements"),
    fees: optionalText(3000, "Fees"),
    sortOrder: z.coerce.number().int().min(0).max(9999).catch(0).default(0),
  })
  .transform((v) => ({ ...v, slug: v.slug ? v.slug : slugify(v.title) }))
  .refine((v) => SLUG_RE.test(v.slug), {
    path: ["slug"],
    error: "Use lower-case letters, numbers and single hyphens only (e.g. ai-foundations).",
  });

export type ProgrammeInput = z.output<typeof programmeInputSchema>;

/** The details shown on the public site, in display order. */
export const PROGRAMME_DETAIL_FIELDS = [
  { key: "overview", label: "Overview" },
  { key: "audience", label: "Who it is for" },
  { key: "duration", label: "Duration" },
  { key: "studyFormat", label: "Study format" },
  { key: "entryRequirements", label: "Entry requirements" },
  { key: "fees", label: "Fees" },
] as const;

/** A programme can only be published once it has the text the catalogue needs. */
export function publishBlockers(p: { title: string; summary: string | null; overview: string | null }): string[] {
  const missing: string[] = [];
  if (!p.summary) missing.push("Summary");
  if (!p.overview) missing.push("Overview");
  return missing;
}

export class SlugTakenError extends Error {
  constructor() {
    super("Another programme already uses this web address.");
  }
}

const isUniqueSlug = (err: unknown) =>
  typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002";

// --- Admin -----------------------------------------------------------------

export function listProgrammesAdmin(db: PrismaClient) {
  return db.programme.findMany({
    orderBy: [{ status: "desc" }, { sortOrder: "asc" }, { title: "asc" }],
    include: { _count: { select: { registrations: true } } },
  });
}

export function getProgramme(db: PrismaClient, id: string) {
  return db.programme.findUnique({ where: { id }, include: { _count: { select: { registrations: true } } } });
}

export async function createProgramme(db: PrismaClient, actor: AdminUser, input: ProgrammeInput) {
  try {
    return await db.$transaction(async (tx) => {
      const p = await tx.programme.create({ data: input });
      await writeAudit(tx, actor, AUDIT_ACTIONS.programmeCreated, { type: "programme", id: p.id }, { title: p.title });
      return p;
    });
  } catch (err) {
    if (isUniqueSlug(err)) throw new SlugTakenError();
    throw err;
  }
}

export async function updateProgramme(db: PrismaClient, actor: AdminUser, id: string, input: ProgrammeInput) {
  try {
    return await db.$transaction(async (tx) => {
      const current = await tx.programme.findUnique({ where: { id } });
      if (!current) return null;
      if (current.status === "PUBLISHED" && publishBlockers(input).length > 0) {
        throw new Error(`A published programme needs: ${publishBlockers(input).join(", ")}. Unpublish it first to remove these.`);
      }
      const p = await tx.programme.update({ where: { id }, data: input });
      await writeAudit(tx, actor, AUDIT_ACTIONS.programmeUpdated, { type: "programme", id }, { title: p.title });
      return p;
    });
  } catch (err) {
    if (isUniqueSlug(err)) throw new SlugTakenError();
    throw err;
  }
}

export async function setProgrammeStatus(
  db: PrismaClient,
  actor: AdminUser,
  id: string,
  status: "DRAFT" | "PUBLISHED",
): Promise<{ ok: true } | { ok: false; error: string }> {
  return db.$transaction(async (tx) => {
    const p = await tx.programme.findUnique({ where: { id } });
    if (!p) return { ok: false, error: "This programme no longer exists." };
    if (status === "PUBLISHED") {
      const missing = publishBlockers(p);
      if (missing.length) return { ok: false, error: `Add the following before publishing: ${missing.join(", ")}.` };
    }
    if (p.status === status) return { ok: true };
    await tx.programme.update({
      where: { id },
      data: { status, publishedAt: status === "PUBLISHED" ? new Date() : p.publishedAt },
    });
    await writeAudit(
      tx,
      actor,
      status === "PUBLISHED" ? AUDIT_ACTIONS.programmePublished : AUDIT_ACTIONS.programmeUnpublished,
      { type: "programme", id },
      { title: p.title },
    );
    return { ok: true };
  });
}

export async function deleteProgramme(db: PrismaClient, actor: AdminUser, id: string) {
  return db.$transaction(async (tx) => {
    const p = await tx.programme.findUnique({ where: { id } });
    if (!p) return false;
    await tx.programme.delete({ where: { id } });
    await writeAudit(tx, actor, AUDIT_ACTIONS.programmeDeleted, { type: "programme", id }, { title: p.title });
    return true;
  });
}

// --- Public ----------------------------------------------------------------

const publicSelect = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  overview: true,
  audience: true,
  duration: true,
  studyFormat: true,
  entryRequirements: true,
  fees: true,
} as const;

export function listPublishedProgrammes(db: PrismaClient) {
  return db.programme.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: publicSelect,
  });
}

export function getPublishedProgrammeBySlug(db: PrismaClient, slug: string) {
  if (!SLUG_RE.test(slug)) return Promise.resolve(null);
  return db.programme.findFirst({ where: { slug, status: "PUBLISHED" }, select: publicSelect });
}

export type PublicProgramme = Awaited<ReturnType<typeof listPublishedProgrammes>>[number];

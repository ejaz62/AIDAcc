import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { AUDIT_ACTIONS, writeAudit } from "@/features/admin/audit";
import type { AdminUser } from "@/features/admin/authorize";

/** A knowledge section as stored in a Markdown file under knowledge/aida/. */
export interface KnowledgeFileSection {
  key: string;
  title: string;
  summary: string;
  body: string;
  order: number;
  page: string;
}

/** Parses a knowledge file: a `---` front-matter block of `name: value` lines, then Markdown. */
export function parseKnowledgeFile(text: string): KnowledgeFileSection {
  const m = text.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error("Knowledge file is missing its --- header block.");
  const meta: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  for (const k of ["key", "title", "summary", "page"]) if (!meta[k]) throw new Error(`Knowledge file is missing "${k}".`);
  return { key: meta.key, title: meta.title, summary: meta.summary, page: meta.page, order: Number(meta.order) || 0, body: m[2].trim() };
}

/** Extracts "Q: … / A: …" pairs from a section body (used for the FAQ section). */
export function parseFaqPairs(body: string): Array<{ question: string; answer: string }> {
  const pairs: Array<{ question: string; answer: string }> = [];
  const re = /^Q:\s*(.+)\n+A:\s*([\s\S]+?)(?=\n\s*\nQ:|\s*$)/gm;
  for (const match of body.replace(/\r\n/g, "\n").matchAll(re)) {
    pairs.push({ question: match[1].trim(), answer: match[2].trim().replace(/\n+/g, " ") });
  }
  return pairs;
}

export const sectionInputSchema = z.object({
  title: z.string().trim().min(2, { error: "Please enter a title." }).max(120),
  summary: z
    .string()
    .trim()
    .min(10, { error: "Please write a short answer (at least 10 characters)." })
    .max(1500, { error: "Keep the short answer under 1500 characters." }),
  body: z.string().trim().min(2, { error: "Please enter the page content." }).max(20000),
  note: z.string().trim().max(200).optional(),
});
export type SectionInput = z.infer<typeof sectionInputSchema>;

export function listSections(db: PrismaClient) {
  return db.knowledgeSection.findMany({ orderBy: { sortOrder: "asc" } });
}

export function getSectionWithHistory(db: PrismaClient, key: string) {
  return db.knowledgeSection.findUnique({
    where: { key },
    include: { revisions: { orderBy: { createdAt: "desc" }, take: 30 } },
  });
}

/** Saves a new version of a section; the previous content stays in the revision history. */
export async function saveSection(db: PrismaClient, actor: AdminUser, key: string, input: SectionInput) {
  return db.$transaction(async (tx) => {
    const current = await tx.knowledgeSection.findUnique({ where: { key } });
    if (!current) return false;
    await tx.knowledgeSection.update({
      where: { key },
      data: { title: input.title, summary: input.summary, body: input.body, updatedBy: actor.email },
    });
    await tx.knowledgeRevision.create({
      data: { sectionKey: key, title: input.title, summary: input.summary, body: input.body, authorEmail: actor.email, note: input.note || null },
    });
    await writeAudit(tx, actor, AUDIT_ACTIONS.knowledgeUpdated, { type: "knowledge", id: key }, { title: input.title });
    return true;
  });
}

/** Restores an earlier version (recorded as a new revision, so nothing is lost). */
export async function restoreRevision(db: PrismaClient, actor: AdminUser, revisionId: string) {
  const rev = await db.knowledgeRevision.findUnique({ where: { id: revisionId } });
  if (!rev) return null;
  await saveSection(db, actor, rev.sectionKey, {
    title: rev.title,
    summary: rev.summary,
    body: rev.body,
    note: `Restored version from ${rev.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC`,
  });
  return rev.sectionKey;
}

/**
 * Adds any section from the files that is not yet in the database. Existing
 * sections are never overwritten — staff edits always win.
 */
export async function seedSectionsFromFiles(db: PrismaClient, files: KnowledgeFileSection[]) {
  const added: string[] = [];
  for (const f of files) {
    if (await db.knowledgeSection.findUnique({ where: { key: f.key }, select: { key: true } })) continue;
    await db.knowledgeSection.create({
      data: { key: f.key, title: f.title, summary: f.summary, body: f.body, sortOrder: f.order, page: f.page, updatedBy: "knowledge files" },
    });
    await db.knowledgeRevision.create({
      data: { sectionKey: f.key, title: f.title, summary: f.summary, body: f.body, authorEmail: "knowledge files", note: "Initial import from knowledge/aida" },
    });
    added.push(f.key);
  }
  return added;
}

export type PublicKnowledgeSection = Awaited<ReturnType<typeof listSections>>[number];

import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { AUDIT_ACTIONS, writeAudit } from "@/features/admin/audit";
import type { AdminUser } from "@/features/admin/authorize";

export const faqInputSchema = z.object({
  question: z
    .string({ error: "Please enter the question." })
    .trim()
    .min(5, { error: "The question must be at least 5 characters." })
    .max(300, { error: "The question must be 300 characters or fewer." }),
  answer: z
    .string({ error: "Please enter the answer." })
    .trim()
    .min(2, { error: "Please enter the answer." })
    .max(4000, { error: "The answer must be 4000 characters or fewer." }),
  sortOrder: z.coerce.number().int().min(0).max(9999).catch(0).default(0),
});
export type FaqInput = z.output<typeof faqInputSchema>;

export function listFaqAdmin(db: PrismaClient) {
  return db.faqEntry.findMany({ orderBy: [{ status: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }] });
}

export function getFaq(db: PrismaClient, id: string) {
  return db.faqEntry.findUnique({ where: { id } });
}

export async function createFaq(db: PrismaClient, actor: AdminUser, input: FaqInput) {
  return db.$transaction(async (tx) => {
    const f = await tx.faqEntry.create({ data: input });
    await writeAudit(tx, actor, AUDIT_ACTIONS.faqCreated, { type: "faq", id: f.id }, { title: f.question.slice(0, 80) });
    return f;
  });
}

export async function updateFaq(db: PrismaClient, actor: AdminUser, id: string, input: FaqInput) {
  return db.$transaction(async (tx) => {
    if (!(await tx.faqEntry.count({ where: { id } }))) return null;
    const f = await tx.faqEntry.update({ where: { id }, data: input });
    await writeAudit(tx, actor, AUDIT_ACTIONS.faqUpdated, { type: "faq", id }, { title: f.question.slice(0, 80) });
    return f;
  });
}

export async function setFaqStatus(db: PrismaClient, actor: AdminUser, id: string, status: "DRAFT" | "PUBLISHED") {
  return db.$transaction(async (tx) => {
    const f = await tx.faqEntry.findUnique({ where: { id } });
    if (!f) return false;
    if (f.status !== status) {
      await tx.faqEntry.update({ where: { id }, data: { status } });
      await writeAudit(
        tx,
        actor,
        status === "PUBLISHED" ? AUDIT_ACTIONS.faqPublished : AUDIT_ACTIONS.faqUnpublished,
        { type: "faq", id },
        { title: f.question.slice(0, 80) },
      );
    }
    return true;
  });
}

export async function deleteFaq(db: PrismaClient, actor: AdminUser, id: string) {
  return db.$transaction(async (tx) => {
    const f = await tx.faqEntry.findUnique({ where: { id } });
    if (!f) return false;
    await tx.faqEntry.delete({ where: { id } });
    await writeAudit(tx, actor, AUDIT_ACTIONS.faqDeleted, { type: "faq", id }, { title: f.question.slice(0, 80) });
    return true;
  });
}

export function listPublishedFaq(db: PrismaClient) {
  return db.faqEntry.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, question: true, answer: true },
  });
}

export type PublicFaq = Awaited<ReturnType<typeof listPublishedFaq>>[number];

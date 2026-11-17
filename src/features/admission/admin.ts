import { z } from "zod";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { AUDIT_ACTIONS, writeAudit } from "@/features/admin/audit";
import type { AdminUser } from "@/features/admin/authorize";
import { ADMISSION_STATUSES, type AdmissionStatusValue } from "./schema";

export const ADMISSION_PAGE_SIZE = 20;
export const ADMISSION_NOTE_MAX = 2000;

const statusValues = ADMISSION_STATUSES.map((s) => s.value) as [AdmissionStatusValue, ...AdmissionStatusValue[]];
export const admissionStatusSchema = z.enum(statusValues);
export const admissionIdSchema = z.string().regex(/^[a-z0-9]{20,40}$/i, "Invalid id");
export const admissionNoteSchema = z
  .string()
  .trim()
  .min(1, { error: "Please write a note." })
  .max(ADMISSION_NOTE_MAX, { error: `Notes must be ${ADMISSION_NOTE_MAX} characters or fewer.` });

const first = (v: unknown) => (Array.isArray(v) ? v[0] : v);
export const admissionFiltersSchema = z.object({
  q: z.preprocess(first, z.string().trim().max(100).optional().catch(undefined)),
  status: z.preprocess(first, admissionStatusSchema.optional().catch(undefined)),
  page: z.preprocess(first, z.coerce.number().int().min(1).max(10_000).catch(1)).default(1),
});
export type AdmissionFilters = z.infer<typeof admissionFiltersSchema>;

function buildWhere(f: AdmissionFilters): Prisma.AdmissionApplicationWhereInput {
  const where: Prisma.AdmissionApplicationWhereInput = {};
  if (f.status) where.status = f.status;
  if (f.q) {
    where.OR = [
      { fullName: { contains: f.q, mode: "insensitive" } },
      { whatsapp: { contains: f.q.replace(/[\s()-]/g, "") } },
      { email: { contains: f.q, mode: "insensitive" } },
      { location: { contains: f.q, mode: "insensitive" } },
    ];
  }
  return where;
}

export async function listAdmissions(db: PrismaClient, f: AdmissionFilters) {
  const where = buildWhere(f);
  const total = await db.admissionApplication.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / ADMISSION_PAGE_SIZE));
  const page = Math.min(f.page, pageCount);
  const items = await db.admissionApplication.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * ADMISSION_PAGE_SIZE,
    take: ADMISSION_PAGE_SIZE,
    select: {
      id: true,
      fullName: true,
      whatsapp: true,
      location: true,
      batch: true,
      status: true,
      seenAt: true,
      createdAt: true,
      _count: { select: { notes: true } },
    },
  });
  return { items, total, page, pageCount };
}

/** Applications no staff member has opened yet (shown as a notification in admin). */
export function countUnseenAdmissions(db: PrismaClient) {
  return db.admissionApplication.count({ where: { seenAt: null } });
}

/** Loads one application and marks it as seen the first time staff open it. */
export async function openAdmission(db: PrismaClient, id: string, now = new Date()) {
  const app = await db.admissionApplication.findUnique({
    where: { id },
    include: { notes: { orderBy: { createdAt: "desc" } } },
  });
  if (app && !app.seenAt) {
    await db.admissionApplication.update({ where: { id }, data: { seenAt: now } });
  }
  return app;
}

export async function updateAdmissionStatus(db: PrismaClient, actor: AdminUser, id: string, status: AdmissionStatusValue) {
  return db.$transaction(async (tx) => {
    const current = await tx.admissionApplication.findUnique({ where: { id }, select: { status: true } });
    if (!current) return false;
    if (current.status === status) return true;
    await tx.admissionApplication.update({ where: { id }, data: { status, seenAt: { set: new Date() } } });
    await writeAudit(tx, actor, AUDIT_ACTIONS.admissionStatusChanged, { type: "admission", id }, { from: current.status, to: status });
    return true;
  });
}

export async function addAdmissionNote(db: PrismaClient, actor: AdminUser, id: string, body: string) {
  return db.$transaction(async (tx) => {
    if (!(await tx.admissionApplication.findUnique({ where: { id }, select: { id: true } }))) return false;
    await tx.admissionNote.create({ data: { applicationId: id, authorEmail: actor.email, body } });
    await writeAudit(tx, actor, AUDIT_ACTIONS.admissionNoteAdded, { type: "admission", id });
    return true;
  });
}

/** Permanently deletes an application and its notes. The audit entry keeps no personal data. */
export async function deleteAdmission(db: PrismaClient, actor: AdminUser, id: string) {
  return db.$transaction(async (tx) => {
    const deleted = await tx.admissionApplication.deleteMany({ where: { id } });
    if (deleted.count) await writeAudit(tx, actor, AUDIT_ACTIONS.admissionDeleted, { type: "admission", id });
    return deleted.count > 0;
  });
}

/** WhatsApp chat link for an applicant's number (Pakistani 03… numbers become +92 3…). */
export function whatsappLink(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (raw.trim().startsWith("0") && !raw.trim().startsWith("00") && digits.length === 11) digits = `92${digits.slice(1)}`;
  if (digits.startsWith("00")) digits = digits.slice(2);
  return `https://wa.me/${digits}`;
}

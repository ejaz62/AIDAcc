import { z } from "zod";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { learnerTypes } from "@/features/interest/schema";
import { AUDIT_ACTIONS, writeAudit } from "./audit";
import type { AdminUser } from "./authorize";

export const STATUSES = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "ARCHIVED", label: "Archived" },
] as const;
export type StatusValue = (typeof STATUSES)[number]["value"];
const statusValues = STATUSES.map((s) => s.value) as [StatusValue, ...StatusValue[]];
const learnerValues = learnerTypes.map((t) => t.value) as [
  (typeof learnerTypes)[number]["value"],
  ...(typeof learnerTypes)[number]["value"][],
];

export const statusLabel = (v: string) => STATUSES.find((s) => s.value === v)?.label ?? v;
export const learnerLabel = (v: string) => learnerTypes.find((t) => t.value === v)?.label ?? v;

export const PAGE_SIZE = 20;
export const NOTE_MAX = 2000;

const first = (v: unknown) => (Array.isArray(v) ? v[0] : v);

/** Parses list filters from URL search params; invalid values fall back to defaults. */
export const filtersSchema = z.object({
  q: z.preprocess(first, z.string().trim().max(100).optional().catch(undefined)),
  status: z.preprocess(first, z.enum(statusValues).optional().catch(undefined)),
  type: z.preprocess(first, z.enum(learnerValues).optional().catch(undefined)),
  programme: z.preprocess(first, z.string().regex(/^[a-z0-9]{20,40}$/i).optional().catch(undefined)),
  page: z.preprocess(first, z.coerce.number().int().min(1).max(10_000).catch(1)).default(1),
});
export type RegistrationFilters = z.infer<typeof filtersSchema>;

export const idSchema = z.string().regex(/^[a-z0-9]{20,40}$/i, "Invalid id");

export function buildWhere(f: RegistrationFilters): Prisma.InterestRegistrationWhereInput {
  const where: Prisma.InterestRegistrationWhereInput = {};
  if (f.status) where.status = f.status;
  if (f.type) where.learnerType = f.type;
  if (f.programme) where.programmeId = f.programme;
  if (f.q) {
    where.OR = [
      { fullName: { contains: f.q, mode: "insensitive" } },
      { email: { contains: f.q, mode: "insensitive" } },
    ];
  }
  return where;
}

export async function listRegistrations(db: PrismaClient, f: RegistrationFilters) {
  const where = buildWhere(f);
  const total = await db.interestRegistration.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(f.page, pageCount);
  const items = await db.interestRegistration.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      fullName: true,
      email: true,
      learnerType: true,
      status: true,
      submissionCount: true,
      createdAt: true,
      programme: { select: { title: true } },
      _count: { select: { notes: true } },
    },
  });
  return { items, total, page, pageCount };
}

export function getRegistration(db: PrismaClient, id: string) {
  return db.interestRegistration.findUnique({
    where: { id },
    include: {
      programme: { select: { id: true, title: true, status: true } },
      emails: { orderBy: { createdAt: "desc" }, select: { id: true, kind: true, status: true, createdAt: true } },
      notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true, email: true } } } },
    },
  });
}

export async function updateStatus(db: PrismaClient, actor: AdminUser, id: string, status: StatusValue) {
  return db.$transaction(async (tx) => {
    const current = await tx.interestRegistration.findUnique({ where: { id }, select: { status: true } });
    if (!current) return false;
    if (current.status === status) return true;
    await tx.interestRegistration.update({ where: { id }, data: { status } });
    await writeAudit(tx, actor, AUDIT_ACTIONS.statusChanged, { type: "registration", id }, { from: current.status, to: status });
    return true;
  });
}

export const noteSchema = z
  .string({ error: "Please write a note." })
  .trim()
  .min(1, { error: "Please write a note." })
  .max(NOTE_MAX, { error: `Notes must be ${NOTE_MAX} characters or fewer.` });

export async function addNote(db: PrismaClient, actor: AdminUser, id: string, body: string) {
  return db.$transaction(async (tx) => {
    const exists = await tx.interestRegistration.count({ where: { id } });
    if (!exists) return false;
    await tx.registrationNote.create({ data: { registrationId: id, authorId: actor.id, body } });
    await writeAudit(tx, actor, AUDIT_ACTIONS.noteAdded, { type: "registration", id });
    return true;
  });
}

/** Permanently deletes a registration and its notes. The audit entry keeps no personal data. */
export async function deleteRegistration(db: PrismaClient, actor: AdminUser, id: string, reason: string) {
  return db.$transaction(async (tx) => {
    const deleted = await tx.interestRegistration.deleteMany({ where: { id } });
    if (deleted.count === 0) return false;
    await writeAudit(tx, actor, AUDIT_ACTIONS.deleted, { type: "registration", id }, { reason });
    return true;
  });
}

export const DELETE_REASONS = [
  { value: "data_subject_request", label: "The person asked for their data to be deleted" },
  { value: "spam_or_invalid", label: "Spam or invalid submission" },
  { value: "other", label: "Other" },
] as const;

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------

/** Escapes a CSV cell, neutralising spreadsheet formula injection (=, +, -, @, tab, CR). */
export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: Array<Record<string, unknown>>, columns: Array<{ key: string; header: string }>) {
  const lines = [columns.map((c) => csvCell(c.header)).join(",")];
  for (const row of rows) lines.push(columns.map((c) => csvCell(row[c.key])).join(","));
  return lines.join("\r\n") + "\r\n";
}

export const EXPORT_COLUMNS = [
  { key: "createdAt", header: "Registered at (UTC)" },
  { key: "fullName", header: "Full name" },
  { key: "email", header: "Email" },
  { key: "learnerType", header: "Describes themselves as" },
  { key: "programme", header: "Programme of interest" },
  { key: "status", header: "Status" },
  { key: "message", header: "Message" },
  { key: "submissionCount", header: "Submissions" },
  { key: "lastSubmittedAt", header: "Last submitted (UTC)" },
  { key: "consentAt", header: "Consent given (UTC)" },
];

export const EXPORT_MAX_ROWS = 10_000;

export async function exportRegistrationsCsv(db: PrismaClient, actor: AdminUser, f: RegistrationFilters) {
  const rows = await db.interestRegistration.findMany({
    where: buildWhere(f),
    orderBy: { createdAt: "desc" },
    take: EXPORT_MAX_ROWS,
    include: { programme: { select: { title: true } } },
  });
  const csv = toCsv(
    rows.map((r) => ({
      ...r,
      learnerType: learnerLabel(r.learnerType),
      status: statusLabel(r.status),
      programme: r.programme?.title ?? "",
    })),
    EXPORT_COLUMNS,
  );
  await writeAudit(db, actor, AUDIT_ACTIONS.exported, undefined, {
    rows: rows.length,
    filters: { q: f.q ? "(search)" : null, status: f.status ?? null, type: f.type ?? null, programme: f.programme ?? null },
  });
  // UTF-8 BOM so Excel shows accented names correctly.
  return { csv: `﻿${csv}`, count: rows.length };
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export async function getDashboardStats(db: PrismaClient, now: Date, days = 30) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1)));
  const [byStatus, byType, recent] = await Promise.all([
    db.interestRegistration.groupBy({ by: ["status"], _count: { _all: true } }),
    db.interestRegistration.groupBy({ by: ["learnerType"], _count: { _all: true } }),
    db.interestRegistration.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true } }),
  ]);

  const statusCounts = Object.fromEntries(STATUSES.map((s) => [s.value, 0])) as Record<StatusValue, number>;
  for (const row of byStatus) statusCounts[row.status as StatusValue] = row._count._all;
  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  const daily = Array.from({ length: days }, (_, i) => {
    const d = new Date(start.getTime() + i * 86_400_000);
    return { date: d.toISOString().slice(0, 10), count: 0 };
  });
  for (const r of recent) {
    const key = r.createdAt.toISOString().slice(0, 10);
    const bucket = daily.find((d) => d.date === key);
    if (bucket) bucket.count++;
  }

  const types = learnerTypes
    .map((t) => ({ value: t.value, label: t.label, count: byType.find((b) => b.learnerType === t.value)?._count._all ?? 0 }))
    .sort((a, b) => b.count - a.count);

  return { total, statusCounts, daily, last30: recent.length, types };
}

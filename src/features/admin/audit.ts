import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import type { AdminUser } from "./authorize";

type Db = PrismaClient | Prisma.TransactionClient;

export const AUDIT_ACTIONS = {
  signIn: "auth.sign_in",
  signInFailed: "auth.sign_in_failed",
  signOut: "auth.sign_out",
  userCreated: "admin.user_created",
  passwordReset: "admin.password_reset",
  statusChanged: "registration.status_changed",
  noteAdded: "registration.note_added",
  deleted: "registration.deleted",
  exported: "registrations.exported",
  programmeCreated: "programme.created",
  programmeUpdated: "programme.updated",
  programmePublished: "programme.published",
  programmeUnpublished: "programme.unpublished",
  programmeDeleted: "programme.deleted",
  siteDraftSaved: "site.draft_saved",
  sitePublished: "site.published",
  staffCreated: "staff.created",
  staffDisabled: "staff.disabled",
  staffEnabled: "staff.enabled",
  staffPasswordReset: "staff.password_reset",
  passwordChanged: "account.password_changed",
  notificationsChanged: "account.notifications_changed",
  testEmailSent: "email.test_sent",
  emailsRetried: "email.retried",
  faqCreated: "faq.created",
  faqUpdated: "faq.updated",
  faqPublished: "faq.published",
  faqUnpublished: "faq.unpublished",
  faqDeleted: "faq.deleted",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const AUDIT_LABELS: Record<AuditAction, string> = {
  "auth.sign_in": "Signed in",
  "auth.sign_in_failed": "Failed sign-in",
  "auth.sign_out": "Signed out",
  "admin.user_created": "Staff account created",
  "admin.password_reset": "Staff password reset",
  "registration.status_changed": "Status changed",
  "registration.note_added": "Note added",
  "registration.deleted": "Registration deleted",
  "registrations.exported": "Registrations exported",
  "programme.created": "Programme created",
  "programme.updated": "Programme edited",
  "programme.published": "Programme published",
  "programme.unpublished": "Programme unpublished",
  "programme.deleted": "Programme deleted",
  "site.draft_saved": "Site details draft saved",
  "site.published": "Site details published",
  "staff.created": "Staff account created",
  "staff.disabled": "Staff account disabled",
  "staff.enabled": "Staff account re-enabled",
  "staff.password_reset": "Staff password reset",
  "account.password_changed": "Own password changed",
  "account.notifications_changed": "Email preference changed",
  "email.test_sent": "Test email sent",
  "email.retried": "Email delivery retried",
  "faq.created": "FAQ created",
  "faq.updated": "FAQ edited",
  "faq.published": "FAQ published",
  "faq.unpublished": "FAQ unpublished",
  "faq.deleted": "FAQ deleted",
};

/**
 * Appends an audit entry. `details` must never contain registrants' personal data
 * (names, emails, messages) so the log survives deletion requests intact.
 */
export async function writeAudit(
  db: Db,
  actor: Pick<AdminUser, "id" | "email"> | { id: null; email: string },
  action: AuditAction,
  target?: { type: string; id: string },
  details?: Prisma.InputJsonValue,
) {
  await db.auditLog.create({
    data: {
      actorId: actor.id,
      actorEmail: actor.email,
      action,
      targetType: target?.type,
      targetId: target?.id,
      details,
    },
  });
}

export function listAuditLog(db: PrismaClient, { page, pageSize = 50 }: { page: number; pageSize?: number }) {
  return Promise.all([
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    db.auditLog.count(),
  ]).then(([items, total]) => ({ items, total, page, pageCount: Math.max(1, Math.ceil(total / pageSize)) }));
}

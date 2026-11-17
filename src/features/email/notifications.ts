import type { PrismaClient } from "@/generated/prisma/client";
import { learnerTypes } from "@/features/interest/schema";
import { getPublishedSiteContent } from "@/features/content/site-content";
import { enqueueEmail } from "./outbox";
import { registrantConfirmation, staffAlert, staffDigest } from "./templates";

const learnerLabel = (v: string) => learnerTypes.find((t) => t.value === v)?.label ?? v;

/** Active staff who chose a given notification mode. */
function recipients(db: PrismaClient, mode: "INSTANT" | "DAILY") {
  return db.user.findMany({ where: { disabled: false, notificationMode: mode }, select: { email: true } });
}

/**
 * Queues the emails for a brand-new registration: a confirmation to the
 * registrant and an alert to each staff member who wants instant alerts.
 * Returns the ids of the queued messages so the caller can deliver them.
 */
export async function queueNewRegistrationEmails(db: PrismaClient, registrationId: string, siteUrl: URL) {
  const reg = await db.interestRegistration.findUnique({
    where: { id: registrationId },
    include: { programme: { select: { title: true } } },
  });
  if (!reg) return [];

  const [site, staff] = await Promise.all([getPublishedSiteContent(db), recipients(db, "INSTANT")]);
  const ids: string[] = [];

  const confirmation = registrantConfirmation({
    fullName: reg.fullName,
    programmeTitle: reg.programme?.title,
    footer: { contactEmail: site.contactEmail || undefined },
  });
  ids.push((await enqueueEmail(db, { kind: "registrant_confirmation", to: reg.email, email: confirmation, registrationId })).id);

  const adminUrl = new URL(`/admin/registrations/${reg.id}`, siteUrl).toString();
  for (const s of staff) {
    const alert = staffAlert({
      fullName: reg.fullName,
      learnerTypeLabel: learnerLabel(reg.learnerType),
      programmeTitle: reg.programme?.title,
      adminUrl,
    });
    ids.push((await enqueueEmail(db, { kind: "staff_alert", to: s.email, email: alert, registrationId })).id);
  }
  return ids;
}

/**
 * Queues the daily summary (counts only) for staff who chose daily emails.
 * Nothing is sent when there were no new registrations.
 */
export async function queueDailyDigest(db: PrismaClient, now: Date, siteUrl: URL) {
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const [grouped, staff] = await Promise.all([
    db.interestRegistration.groupBy({ by: ["learnerType"], where: { createdAt: { gte: since, lt: now } }, _count: { _all: true } }),
    recipients(db, "DAILY"),
  ]);
  const total = grouped.reduce((sum, g) => sum + g._count._all, 0);
  if (total === 0 || staff.length === 0) return { total, queued: 0 };

  const email = staffDigest({
    total,
    byType: learnerTypes.map((t) => ({ label: t.label, count: grouped.find((g) => g.learnerType === t.value)?._count._all ?? 0 })),
    dateLabel: new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(now) + " UTC",
    adminUrl: new URL("/admin/registrations", siteUrl).toString(),
  });
  for (const s of staff) await enqueueEmail(db, { kind: "staff_digest", to: s.email, email });
  return { total, queued: staff.length };
}

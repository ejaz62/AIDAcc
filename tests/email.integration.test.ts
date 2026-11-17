import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { sslFor } from "@/lib/db-ssl";
import { PrismaClient } from "@/generated/prisma/client";
import { deliverEmail, enqueueEmail, MAX_ATTEMPTS, processOutbox } from "@/features/email/outbox";
import { queueDailyDigest, queueNewRegistrationEmails } from "@/features/email/notifications";
import { EmailSendError, previewTransport, type EmailTransport } from "@/features/email/transport";
import { pruneOldRecords } from "@/features/maintenance/cleanup";

/**
 * Outbox delivery and notification rules against the real PostgreSQL database.
 * Uses per-run addresses and removes everything it creates.
 */
const url = process.env.DATABASE_URL;
const run = randomUUID().slice(0, 8);
const domain = `@email-it-${run}.test`;
const siteUrl = new URL("https://aida.example.test");
const email = { subject: "Subject", html: "<p>x</p>", text: "x" };

const okTransport = (): EmailTransport & { sent: string[] } => {
  const sent: string[] = [];
  return { name: "resend", delivers: true, sent, send: async (m) => (sent.push(m.to), { providerId: "p_1" }) };
};
const failing = (permanent: boolean): EmailTransport => ({
  name: "resend",
  delivers: true,
  send: async () => {
    throw new EmailSendError("provider unavailable", permanent);
  },
});

describe.skipIf(!url)("email outbox and notifications (PostgreSQL)", () => {
  let db: PrismaClient;
  const startedAt = new Date();

  beforeAll(async () => {
    db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url!, max: Number(process.env.DATABASE_POOL_MAX) || undefined, ssl: sslFor(url!) }), transactionOptions: { maxWait: 10_000, timeout: 20_000 } });
    // Other staff in this database must not receive this run's test emails.
    await db.user.createMany({
      data: [
        { id: `it-instant-${run}`, name: "Instant", email: `instant${domain}`, notificationMode: "INSTANT" },
        { id: `it-daily-${run}`, name: "Daily", email: `daily${domain}`, notificationMode: "DAILY" },
        { id: `it-none-${run}`, name: "None", email: `none${domain}`, notificationMode: "NONE" },
        { id: `it-off-${run}`, name: "Disabled", email: `off${domain}`, notificationMode: "INSTANT", disabled: true },
      ],
    });
  });

  afterAll(async () => {
    await db.emailMessage.deleteMany({ where: { to: { endsWith: domain } } });
    // The digest test also queues summaries for any real daily-summary staff in this database;
    // remove them so they are never sent. (Alerts are removed with their registrations below.)
    await db.emailMessage.deleteMany({ where: { kind: "staff_digest", createdAt: { gte: startedAt } } });
    await db.interestRegistration.deleteMany({ where: { email: { endsWith: domain } } });
    await db.user.deleteMany({ where: { email: { endsWith: domain } } });
    await db.$disconnect();
  });

  const ourEmails = () => db.emailMessage.findMany({ where: { to: { endsWith: domain } } });

  it("delivers, records preview mode, and retries failures up to the limit", async () => {
    const ok = okTransport();
    const a = await enqueueEmail(db, { kind: "test", to: `a${domain}`, email });
    expect(await deliverEmail(db, ok, a.id)).toBe("SENT");
    expect(await deliverEmail(db, ok, a.id)).toBe("SENT"); // not sent twice
    expect(ok.sent).toEqual([`a${domain}`]);
    expect((await db.emailMessage.findUnique({ where: { id: a.id } }))?.providerId).toBe("p_1");

    const b = await enqueueEmail(db, { kind: "test", to: `b${domain}`, email });
    expect(await deliverEmail(db, previewTransport, b.id)).toBe("PREVIEW");

    const c = await enqueueEmail(db, { kind: "test", to: `c${domain}`, email });
    for (let i = 0; i < MAX_ATTEMPTS + 2; i++) await deliverEmail(db, failing(false), c.id);
    const failed = await db.emailMessage.findUnique({ where: { id: c.id } });
    expect(failed?.status).toBe("FAILED");
    expect(failed?.attempts).toBe(MAX_ATTEMPTS);
    expect(failed?.lastError).toContain("provider unavailable");

    const d = await enqueueEmail(db, { kind: "test", to: `d${domain}`, email });
    await deliverEmail(db, failing(true), d.id);
    expect((await db.emailMessage.findUnique({ where: { id: d.id } }))?.attempts).toBe(MAX_ATTEMPTS);
  });

  it("emails the registrant and only enabled staff who chose instant alerts", async () => {
    const reg = await db.interestRegistration.create({
      data: { fullName: "Ada Lovelace", email: `ada${domain}`, learnerType: "STUDENT", consentAt: new Date() },
    });
    const ids = await queueNewRegistrationEmails(db, reg.id, siteUrl);
    const queued = await db.emailMessage.findMany({ where: { id: { in: ids } } });
    const ours = queued.filter((m) => m.to.endsWith(domain));
    expect(ours.map((m) => [m.kind, m.to]).sort()).toEqual([
      ["registrant_confirmation", `ada${domain}`],
      ["staff_alert", `instant${domain}`],
    ]);
    const alert = ours.find((m) => m.kind === "staff_alert")!;
    expect(alert.html).toContain(`https://aida.example.test/admin/registrations/${reg.id}`);
    expect(alert.text).not.toContain(`ada${domain}`);
    expect(queued.every((m) => m.status === "PENDING" && m.registrationId === reg.id)).toBe(true);
  });

  it("deletes a registration's emails together with it", async () => {
    const reg = await db.interestRegistration.create({
      data: { fullName: "To Delete", email: `delete${domain}`, learnerType: "OTHER", consentAt: new Date() },
    });
    await queueNewRegistrationEmails(db, reg.id, siteUrl);
    expect(await db.emailMessage.count({ where: { registrationId: reg.id } })).toBeGreaterThan(0);
    await db.interestRegistration.delete({ where: { id: reg.id } });
    expect(await db.emailMessage.count({ where: { registrationId: reg.id } })).toBe(0);
  });

  it("sends the daily digest to daily subscribers only, with counts", async () => {
    const now = new Date();
    const res = await queueDailyDigest(db, now, siteUrl);
    expect(res.total).toBeGreaterThanOrEqual(1);
    const digests = (await ourEmails()).filter((m) => m.kind === "staff_digest");
    expect(digests.map((m) => m.to)).toEqual([`daily${domain}`]);
    expect(digests[0].text).toMatch(/new registration/);
    expect(digests[0].text).not.toContain("Ada");
  });

  it("processOutbox delivers what is due", async () => {
    const ok = okTransport();
    const before = (await ourEmails()).filter((m) => m.status === "PENDING").length;
    // Scoped to this run's addresses so real queued emails in a shared database are never touched.
    const result = await processOutbox(db, ok, { limit: 500, where: { to: { endsWith: domain } } });
    expect(result.sent).toBeGreaterThanOrEqual(before);
    expect((await ourEmails()).filter((m) => m.status === "PENDING")).toHaveLength(0);
  });

  it("prunes old email records", async () => {
    const old = await db.emailMessage.create({
      data: { kind: "test", to: `old${domain}`, ...email, status: "SENT", createdAt: new Date(Date.now() - 40 * 86_400_000) },
    });
    const removed = await pruneOldRecords(db);
    expect(removed.emails).toBeGreaterThanOrEqual(1);
    expect(await db.emailMessage.findUnique({ where: { id: old.id } })).toBeNull();
  });
});

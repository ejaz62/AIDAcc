import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { sslFor } from "@/lib/db-ssl";
import { PrismaClient } from "@/generated/prisma/client";
import type { AdminUser } from "@/features/admin/authorize";
import { admissionSchema } from "@/features/admission/schema";
import { ADMISSION_MESSAGES, ADMISSION_POLICY, submitAdmission } from "@/features/admission/service";
import {
  addAdmissionNote,
  countUnseenAdmissions,
  deleteAdmission,
  openAdmission,
  updateAdmissionStatus,
  whatsappLink,
} from "@/features/admission/admin";
import { queueNewAdmissionEmails } from "@/features/email/notifications";
import { admissionAlert } from "@/features/email/templates";

const VALID = {
  fullName: "Ayesha Khan",
  whatsapp: "0300 1234567",
  email: "",
  location: "Lahore, Pakistan",
  course: "AIDA AI Training Programme",
  batch: "B2",
  computerKnowledge: "BASIC",
  aiExperience: "NONE",
  message: "",
  consent: "on",
};

describe("admission form rules", () => {
  it("accepts a complete application and normalises the WhatsApp number", () => {
    const r = admissionSchema.safeParse(VALID);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.whatsapp).toBe("03001234567");
      expect(r.data.email).toBeUndefined();
    }
  });

  it("rejects missing answers, bad numbers and bad emails", () => {
    const r = admissionSchema.safeParse({ ...VALID, whatsapp: "12", email: "not-an-email", batch: "", consent: undefined });
    expect(r.success).toBe(false);
    const fields = r.success ? [] : r.error.issues.map((i) => i.path[0]);
    expect(fields).toEqual(expect.arrayContaining(["whatsapp", "email", "batch", "consent"]));
  });

  it("builds WhatsApp links for Pakistani and international numbers", () => {
    expect(whatsappLink("0300 1234567")).toBe("https://wa.me/923001234567");
    expect(whatsappLink("+966 50 123 4567")).toBe("https://wa.me/966501234567");
    expect(whatsappLink("00923001234567")).toBe("https://wa.me/923001234567");
  });

  it("escapes applicant text in the staff alert email", () => {
    const e = admissionAlert({ fullName: "<b>X</b>", location: "Lahore", course: "C", batchLabel: "B", adminUrl: "https://x.test/a" });
    expect(e.html).not.toContain("<b>X</b>");
    expect(e.subject).toBe("New admission application: <b>X</b>");
  });
});

const url = process.env.DATABASE_URL;
const run = randomUUID().slice(0, 8);
const ipHash = `admission-${run}`.padEnd(64, "0").slice(0, 64);

describe.skipIf(!url)("admission applications (PostgreSQL)", () => {
  let db: PrismaClient;
  let actor: AdminUser;
  const created: string[] = [];

  beforeAll(async () => {
    db = new PrismaClient({
      adapter: new PrismaPg({ connectionString: url!, max: Number(process.env.DATABASE_POOL_MAX) || undefined, ssl: sslFor(url!) }),
      transactionOptions: { maxWait: 10_000, timeout: 20_000 },
    });
    const user = await db.user.create({
      data: { id: `adm-${run}`, name: "Admission test", email: `staff-${run}@admission-it.test`, notificationMode: "INSTANT" },
    });
    actor = { id: user.id, name: user.name, email: user.email, role: "admin" };
  });

  afterAll(async () => {
    await db.emailMessage.deleteMany({ where: { OR: [{ to: actor.email }, { to: { endsWith: "@admission-it.test" } }] } });
    await db.admissionApplication.deleteMany({ where: { ipHash } });
    await db.submissionAttempt.deleteMany({ where: { ipHash } });
    await db.auditLog.deleteMany({ where: { actorEmail: actor.email } });
    await db.user.deleteMany({ where: { id: actor.id } });
    await db.$disconnect();
  });

  const form = (overrides: Record<string, string> = {}) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries({ ...VALID, ...overrides })) fd.set(k, v);
    fd.set("formToken", overrides.formToken ?? randomUUID());
    fd.set("startedAt", String(Date.now() - 60_000));
    return fd;
  };
  const ctx = (onCreated?: (id: string) => Promise<void>) => ({
    db,
    ipHash,
    now: new Date(),
    generateToken: randomUUID,
    onCreated: onCreated ?? (async (id: string) => void created.push(id)),
  });

  it("saves a valid application and calls the notifier once", async () => {
    const onCreated = vi.fn(async (id: string) => void created.push(id));
    const res = await submitAdmission(form({ email: `ayesha-${run}@admission-it.test` }), ctx(onCreated));
    expect(res).toEqual({ status: "success", message: ADMISSION_MESSAGES.success });
    expect(onCreated).toHaveBeenCalledTimes(1);
    const app = await db.admissionApplication.findUnique({ where: { id: created[0] } });
    expect(app).toMatchObject({ fullName: "Ayesha Khan", whatsapp: "03001234567", batch: "B2", status: "NEW", seenAt: null });
  });

  it("returns field errors and keeps the typed values", async () => {
    const res = await submitAdmission(form({ whatsapp: "abc" }), ctx());
    expect(res.status).toBe("error");
    expect(res.fieldErrors?.whatsapp).toBeTruthy();
    expect(res.values?.fullName).toBe("Ayesha Khan");
  });

  it("silently drops bots (honeypot and too-fast submissions)", async () => {
    const before = await db.admissionApplication.count({ where: { ipHash } });
    const bot = form();
    bot.set("company_website", "spam.example");
    expect((await submitAdmission(bot, ctx())).status).toBe("success");
    const fast = form();
    fast.set("startedAt", String(Date.now()));
    expect((await submitAdmission(fast, ctx())).status).toBe("success");
    expect(await db.admissionApplication.count({ where: { ipHash } })).toBe(before);
  });

  it("does not save the same form twice", async () => {
    const token = randomUUID();
    const before = await db.admissionApplication.count({ where: { ipHash } });
    await submitAdmission(form({ formToken: token }), ctx());
    await submitAdmission(form({ formToken: token }), ctx());
    expect(await db.admissionApplication.count({ where: { ipHash } })).toBe(before + 1);
  });

  it("queues a staff alert and an applicant confirmation", async () => {
    const ids = await queueNewAdmissionEmails(db, created[0], new URL("https://aida.test"));
    const emails = await db.emailMessage.findMany({ where: { id: { in: ids } } });
    const alert = emails.find((e) => e.kind === "admission_alert" && e.to === actor.email);
    expect(alert?.subject).toBe("New admission application: Ayesha Khan");
    expect(alert?.html).toContain(`https://aida.test/admin/admissions/${created[0]}`);
    expect(alert?.html).not.toContain("03001234567"); // contact details stay in the admin area
    expect(emails.some((e) => e.kind === "applicant_confirmation" && e.to === `ayesha-${run}@admission-it.test`)).toBe(true);
  });

  it("flags new applications until staff open them", async () => {
    const unseenBefore = await countUnseenAdmissions(db);
    expect(unseenBefore).toBeGreaterThanOrEqual(1);
    const app = await openAdmission(db, created[0]);
    expect(app?.fullName).toBe("Ayesha Khan");
    expect(await countUnseenAdmissions(db)).toBe(unseenBefore - 1);
  });

  it("lets staff update status, add notes and delete, with an audit trail", async () => {
    const id = created[0];
    expect(await updateAdmissionStatus(db, actor, id, "PAYMENT_PENDING")).toBe(true);
    expect(await addAdmissionNote(db, actor, id, "Called on WhatsApp")).toBe(true);
    const app = await openAdmission(db, id);
    expect(app?.status).toBe("PAYMENT_PENDING");
    expect(app?.notes.map((n) => n.body)).toEqual(["Called on WhatsApp"]);
    const actions = (await db.auditLog.findMany({ where: { actorEmail: actor.email } })).map((a) => a.action);
    expect(actions).toEqual(expect.arrayContaining(["admission.status_changed", "admission.note_added"]));

    expect(await deleteAdmission(db, actor, id)).toBe(true);
    expect(await db.admissionApplication.findUnique({ where: { id } })).toBeNull();
    expect(await db.admissionNote.count({ where: { applicationId: id } })).toBe(0);
    expect(await updateAdmissionStatus(db, actor, id, "CONFIRMED")).toBe(false);
  });

  it("rate-limits repeated submissions from one address", async () => {
    let limited = false;
    for (let i = 0; i < ADMISSION_POLICY.rateLimitMax + 1; i++) {
      const res = await submitAdmission(form(), ctx());
      if (res.status === "error" && res.message === ADMISSION_MESSAGES.rateLimited) {
        limited = true;
        break;
      }
    }
    expect(limited).toBe(true);
  });
});

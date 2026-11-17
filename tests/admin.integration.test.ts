import { randomBytes, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { sslFor } from "@/lib/db-ssl";
import { PrismaClient } from "@/generated/prisma/client";
import { createAuth, type Auth } from "@/lib/auth-config";
import { AUDIT_ACTIONS } from "@/features/admin/audit";
import { authorize, type AdminUser } from "@/features/admin/authorize";
import {
  addNote,
  deleteRegistration,
  exportRegistrationsCsv,
  getDashboardStats,
  getRegistration,
  listRegistrations,
  updateStatus,
} from "@/features/admin/registrations";
import { createAdminUser, resetAdminPassword } from "@/features/admin/users";

/**
 * End-to-end checks of authentication and registration management against the
 * real PostgreSQL database. Uses a unique domain per run and cleans up afterwards.
 */
const url = process.env.DATABASE_URL;
const run = randomUUID().slice(0, 8);
const domain = `@admin-it-${run}.test`;
const password = randomBytes(18).toString("base64url");

describe.skipIf(!url)("admin area (PostgreSQL)", () => {
  let db: PrismaClient;
  let auth: Auth;
  let actor: AdminUser;
  const auditIds: string[] = [];

  beforeAll(async () => {
    db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url!, max: Number(process.env.DATABASE_POOL_MAX) || undefined, ssl: sslFor(url!) }), transactionOptions: { maxWait: 10_000, timeout: 20_000 } });
    auth = createAuth(db, { secret: randomBytes(32).toString("hex"), baseURL: "http://localhost:3000", nextCookies: false });
    const user = await createAdminUser(auth, db, { name: "IT Admin", email: `admin${domain}`, password });
    actor = { id: user.id, name: user.name, email: user.email, role: "admin" };
  });

  afterAll(async () => {
    const users = await db.user.findMany({ where: { email: { endsWith: domain } }, select: { id: true } });
    const ids = users.map((u) => u.id);
    await db.auditLog.deleteMany({ where: { OR: [{ actorId: { in: ids } }, { targetId: { in: [...ids, ...auditIds] } }] } });
    await db.interestRegistration.deleteMany({ where: { email: { endsWith: domain } } });
    await db.user.deleteMany({ where: { id: { in: ids } } });
    await db.$disconnect();
  });

  const signIn = (email: string, pw: string) =>
    auth.api.signInEmail({ body: { email, password: pw }, returnHeaders: true });

  describe("authentication", () => {
    it("stores a hashed password, never the plain text", async () => {
      const account = await db.account.findFirst({ where: { userId: actor.id, providerId: "credential" } });
      expect(account?.password).toBeTruthy();
      expect(account?.password).not.toContain(password);
    });

    it("signs in with the correct password and yields an authorised admin session", async () => {
      const { headers } = await signIn(`admin${domain}`, password);
      const cookie = headers.get("set-cookie");
      expect(cookie).toMatch(/aida\.session_token=/);
      const session = await auth.api.getSession({ headers: new Headers({ cookie: cookie!.split(";")[0] }) });
      expect(authorize(session)?.email).toBe(`admin${domain}`);
    });

    it("rejects a wrong password", async () => {
      await expect(signIn(`admin${domain}`, "not-the-password-123")).rejects.toThrow();
    });

    it("does not allow public sign-up", async () => {
      await expect(
        auth.api.signUpEmail({ body: { name: "Intruder", email: `intruder${domain}`, password: "intruder-password-1" } }),
      ).rejects.toThrow();
      expect(await db.user.count({ where: { email: `intruder${domain}` } })).toBe(0);
    });

    it("refuses to create a duplicate staff account", async () => {
      await expect(createAdminUser(auth, db, { name: "Again", email: `admin${domain}`, password })).rejects.toThrow(
        /already exists/,
      );
    });

    it("blocks sign-in for disabled accounts", async () => {
      const pw = randomBytes(18).toString("base64url");
      const u = await createAdminUser(auth, db, { name: "Disabled", email: `disabled${domain}`, password: pw });
      await db.user.update({ where: { id: u.id }, data: { disabled: true } });
      await expect(signIn(`disabled${domain}`, pw)).rejects.toThrow();
    });

    it("resets a password and revokes existing sessions", async () => {
      const pw = randomBytes(18).toString("base64url");
      const u = await createAdminUser(auth, db, { name: "Reset", email: `reset${domain}`, password: pw });
      await signIn(`reset${domain}`, pw);
      expect(await db.session.count({ where: { userId: u.id } })).toBe(1);

      const newPw = randomBytes(18).toString("base64url");
      await resetAdminPassword(auth, db, `reset${domain}`, newPw);
      expect(await db.session.count({ where: { userId: u.id } })).toBe(0);
      await expect(signIn(`reset${domain}`, pw)).rejects.toThrow();
      await expect(signIn(`reset${domain}`, newPw)).resolves.toBeTruthy();
    });
  });

  describe("registration management", () => {
    let regId: string;

    beforeAll(async () => {
      const make = (local: string, fullName: string, learnerType: "STUDENT" | "EDUCATOR") =>
        db.interestRegistration.create({
          data: { fullName, email: `${local}${domain}`, learnerType, consentAt: new Date(), message: "=cmd|' /C calc'!A0" },
        });
      regId = (await make("grace", "Grace Hopper", "STUDENT")).id;
      await make("alan", "Alan Turing", "EDUCATOR");
      auditIds.push(regId);
    });

    it("searches by name or email, case-insensitively", async () => {
      const byName = await listRegistrations(db, { q: "GRACE", page: 1 });
      expect(byName.items.map((i) => i.email)).toContain(`grace${domain}`);
      const byDomain = await listRegistrations(db, { q: domain, page: 1 });
      expect(byDomain.total).toBe(2);
      const byType = await listRegistrations(db, { q: domain, type: "EDUCATOR", page: 1 });
      expect(byType.items.map((i) => i.fullName)).toEqual(["Alan Turing"]);
    });

    it("changes status and records it in the audit log", async () => {
      expect(await updateStatus(db, actor, regId, "CONTACTED")).toBe(true);
      expect((await getRegistration(db, regId))?.status).toBe("CONTACTED");
      const entry = await db.auditLog.findFirst({
        where: { targetId: regId, action: AUDIT_ACTIONS.statusChanged },
      });
      expect(entry?.details).toEqual({ from: "NEW", to: "CONTACTED" });
      expect(entry?.actorEmail).toBe(actor.email);
    });

    it("adds notes attributed to the staff member", async () => {
      expect(await addNote(db, actor, regId, "Called — will follow up in January.")).toBe(true);
      const reg = await getRegistration(db, regId);
      expect(reg?.notes[0].body).toMatch(/follow up/);
      expect(reg?.notes[0].author?.email).toBe(actor.email);
    });

    it("exports CSV with formula injection neutralised, and audits the export", async () => {
      const { csv, count } = await exportRegistrationsCsv(db, actor, { q: domain, page: 1 });
      expect(count).toBe(2);
      expect(csv).toContain(`grace${domain}`);
      expect(csv).toContain("'=cmd");
      expect(csv).not.toMatch(/,=cmd/);
      const audit = await db.auditLog.findFirst({
        where: { actorId: actor.id, action: AUDIT_ACTIONS.exported },
        orderBy: { createdAt: "desc" },
      });
      expect(JSON.stringify(audit?.details)).not.toContain(domain);
    });

    it("reports dashboard statistics", async () => {
      const stats = await getDashboardStats(db, new Date());
      expect(stats.daily).toHaveLength(30);
      expect(stats.total).toBeGreaterThanOrEqual(2);
      expect(stats.statusCounts.CONTACTED).toBeGreaterThanOrEqual(1);
    });

    it("permanently deletes a registration and its notes without leaving personal data in the audit log", async () => {
      expect(await deleteRegistration(db, actor, regId, "data_subject_request")).toBe(true);
      expect(await getRegistration(db, regId)).toBeNull();
      expect(await db.registrationNote.count({ where: { registrationId: regId } })).toBe(0);

      const entries = await db.auditLog.findMany({ where: { targetId: regId } });
      expect(entries.map((e) => e.action)).toContain(AUDIT_ACTIONS.deleted);
      expect(JSON.stringify(entries)).not.toMatch(/Grace|grace/);

      expect(await deleteRegistration(db, actor, regId, "other")).toBe(false);
    });
  });
});

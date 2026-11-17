import { randomBytes, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { sslFor } from "@/lib/db-ssl";
import { PrismaClient } from "@/generated/prisma/client";
import { createAuth, type Auth } from "@/lib/auth-config";
import { authorize, type AdminUser } from "@/features/admin/authorize";
import { createAdminUser, inviteStaff, resetStaffPassword, setStaffDisabled } from "@/features/admin/users";
import {
  createProgramme,
  deleteProgramme,
  getPublishedProgrammeBySlug,
  listPublishedProgrammes,
  programmeInputSchema,
  setProgrammeStatus,
  SlugTakenError,
  updateProgramme,
} from "@/features/content/programmes";
import {
  getPublishedSiteContent,
  getSiteContentAdmin,
  publishSiteContent,
  saveSiteDraft,
  siteContentSchema,
  SITE_KEY,
} from "@/features/content/site-content";
import { createPrismaInterestRepository } from "@/features/interest/prisma-repository";

/**
 * Publishing rules and staff management against the real PostgreSQL database.
 * Everything created here uses a per-run marker and is removed afterwards.
 */
const url = process.env.DATABASE_URL;
const run = randomUUID().slice(0, 8);
const domain = `@content-it-${run}.test`;

describe.skipIf(!url)("content management (PostgreSQL)", () => {
  let db: PrismaClient;
  let auth: Auth;
  let actor: AdminUser;
  let originalSite: { draft: unknown; published: unknown; publishedAt: Date | null } | null = null;

  beforeAll(async () => {
    db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url!, max: Number(process.env.DATABASE_POOL_MAX) || undefined, ssl: sslFor(url!) }), transactionOptions: { maxWait: 10_000, timeout: 20_000 } });
    auth = createAuth(db, { secret: randomBytes(32).toString("hex"), baseURL: "http://localhost:3000", nextCookies: false });
    const u = await createAdminUser(auth, db, { name: "Content IT", email: `admin${domain}`, password: randomBytes(18).toString("base64url") });
    actor = { id: u.id, name: u.name, email: u.email, role: "admin" };
    originalSite = await db.siteContent.findUnique({ where: { key: SITE_KEY } });
  });

  afterAll(async () => {
    await db.programme.deleteMany({ where: { slug: { startsWith: `it-${run}` } } });
    // Restore whatever site content existed before the test.
    if (originalSite) {
      await db.siteContent.update({
        where: { key: SITE_KEY },
        data: { draft: originalSite.draft as object, published: (originalSite.published ?? undefined) as object | undefined, publishedAt: originalSite.publishedAt },
      });
    } else {
      await db.siteContent.deleteMany({ where: { key: SITE_KEY } });
    }
    const users = await db.user.findMany({ where: { email: { endsWith: domain } }, select: { id: true } });
    await db.auditLog.deleteMany({ where: { OR: [{ actorId: { in: users.map((u) => u.id) } }, { targetId: { in: users.map((u) => u.id) } }] } });
    await db.user.deleteMany({ where: { email: { endsWith: domain } } });
    await db.$disconnect();
  });

  describe("programmes", () => {
    const input = (suffix: string, extra: Record<string, unknown> = {}) =>
      programmeInputSchema.parse({ title: `Integration ${suffix}`, slug: `it-${run}-${suffix}`, ...extra });

    it("keeps drafts off the public site until published", async () => {
      const p = await createProgramme(db, actor, input("draft", { summary: "Short summary", overview: "Full overview" }));
      expect(p.status).toBe("DRAFT");
      expect(await getPublishedProgrammeBySlug(db, p.slug)).toBeNull();
      expect((await listPublishedProgrammes(db)).map((x) => x.slug)).not.toContain(p.slug);

      expect(await setProgrammeStatus(db, actor, p.id, "PUBLISHED")).toEqual({ ok: true });
      expect((await getPublishedProgrammeBySlug(db, p.slug))?.title).toBe("Integration draft");
      expect((await listPublishedProgrammes(db)).map((x) => x.slug)).toContain(p.slug);

      expect(await setProgrammeStatus(db, actor, p.id, "DRAFT")).toEqual({ ok: true });
      expect(await getPublishedProgrammeBySlug(db, p.slug)).toBeNull();
    });

    it("refuses to publish without a summary and overview", async () => {
      const p = await createProgramme(db, actor, input("incomplete"));
      const res = await setProgrammeStatus(db, actor, p.id, "PUBLISHED");
      expect(res.ok).toBe(false);
      expect(await getPublishedProgrammeBySlug(db, p.slug)).toBeNull();
    });

    it("does not let a published programme lose its required text", async () => {
      const p = await createProgramme(db, actor, input("guard", { summary: "S", overview: "O" }));
      await setProgrammeStatus(db, actor, p.id, "PUBLISHED");
      await expect(updateProgramme(db, actor, p.id, input("guard", { summary: "S" }))).rejects.toThrow(/needs: Overview/);
    });

    it("rejects duplicate web addresses", async () => {
      await createProgramme(db, actor, input("dup"));
      await expect(createProgramme(db, actor, input("dup"))).rejects.toBeInstanceOf(SlugTakenError);
    });

    it("links registrations only to published programmes and survives deletion", async () => {
      const p = await createProgramme(db, actor, input("linked", { summary: "S", overview: "O" }));
      const repo = createPrismaInterestRepository(db);
      expect(await repo.isPublishedProgramme(p.id)).toBe(false);
      await setProgrammeStatus(db, actor, p.id, "PUBLISHED");
      expect(await repo.isPublishedProgramme(p.id)).toBe(true);

      const reg = await db.interestRegistration.create({
        data: { fullName: "Linked", email: `linked${domain}`, learnerType: "OTHER", consentAt: new Date(), programmeId: p.id },
      });
      await deleteProgramme(db, actor, p.id);
      const after = await db.interestRegistration.findUnique({ where: { id: reg.id } });
      expect(after).not.toBeNull();
      expect(after?.programmeId).toBeNull();
      await db.interestRegistration.delete({ where: { id: reg.id } });
    });
  });

  describe("site details", () => {
    it("shows saved drafts on the site only after publishing", async () => {
      const email = `contact${domain}`;
      const before = await getPublishedSiteContent(db);
      await saveSiteDraft(db, actor, siteContentSchema.parse({ contactEmail: email, mission: "Draft mission", showPreviewNotice: false }));

      const admin = await getSiteContentAdmin(db);
      expect(admin.draft.contactEmail).toBe(email);
      expect(admin.hasUnpublishedChanges).toBe(true);
      expect((await getPublishedSiteContent(db)).contactEmail).toBe(before.contactEmail);

      await publishSiteContent(db, actor);
      const live = await getPublishedSiteContent(db);
      expect(live.contactEmail).toBe(email);
      expect(live.showPreviewNotice).toBe(false);
      expect((await getSiteContentAdmin(db)).hasUnpublishedChanges).toBe(false);
    });
  });

  describe("staff management", () => {
    const signIn = (email: string, password: string) =>
      auth.api.signInEmail({ body: { email, password }, returnHeaders: true });

    it("invites staff with a working one-time password", async () => {
      const { user, temporaryPassword } = await inviteStaff(auth, db, actor, { name: "New Staff", email: `new${domain}` });
      const { headers } = await signIn(user.email, temporaryPassword);
      const session = await auth.api.getSession({ headers: new Headers({ cookie: headers.get("set-cookie")!.split(";")[0] }) });
      expect(authorize(session)?.email).toBe(`new${domain}`);
    });

    it("disabling signs the person out and blocks sign-in; re-enabling restores access", async () => {
      const { user, temporaryPassword } = await inviteStaff(auth, db, actor, { name: "To Disable", email: `disable${domain}` });
      const { headers } = await signIn(user.email, temporaryPassword);
      const cookie = headers.get("set-cookie")!.split(";")[0];

      await setStaffDisabled(db, actor, user.id, true);
      expect(await db.session.count({ where: { userId: user.id } })).toBe(0);
      expect(authorize(await auth.api.getSession({ headers: new Headers({ cookie }) }))).toBeNull();
      await expect(signIn(user.email, temporaryPassword)).rejects.toThrow();

      await setStaffDisabled(db, actor, user.id, false);
      await expect(signIn(user.email, temporaryPassword)).resolves.toBeTruthy();
    });

    it("prevents disabling yourself", async () => {
      await expect(setStaffDisabled(db, actor, actor.id, true)).rejects.toThrow(/your own account/);
    });

    it("resets a password, invalidating the old one", async () => {
      const { user, temporaryPassword } = await inviteStaff(auth, db, actor, { name: "Reset Me", email: `reset${domain}` });
      const { temporaryPassword: fresh } = await resetStaffPassword(auth, db, actor, user.id);
      await expect(signIn(user.email, temporaryPassword)).rejects.toThrow();
      await expect(signIn(user.email, fresh)).resolves.toBeTruthy();
    });
  });
});

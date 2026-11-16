import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getSiteUrl, isIndexingAllowed } from "@/lib/site-config";
import { pruneOldRecords, RETENTION } from "@/features/maintenance/cleanup";
import robots from "@/app/robots";

describe("indexing switch and site URL", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("blocks search engines unless explicitly allowed", () => {
    vi.stubEnv("ALLOW_SEARCH_INDEXING", "");
    expect(isIndexingAllowed()).toBe(false);
    expect(robots().rules).toEqual({ userAgent: "*", disallow: "/" });
    vi.stubEnv("ALLOW_SEARCH_INDEXING", "yes");
    expect(isIndexingAllowed()).toBe(false);
  });

  it("allows indexing (but never /admin or /api) when switched on", () => {
    vi.stubEnv("ALLOW_SEARCH_INDEXING", "true");
    vi.stubEnv("SITE_URL", "https://aida.example.test");
    const r = robots();
    expect(r.rules).toEqual({ userAgent: "*", allow: "/", disallow: ["/admin", "/api"] });
    expect(r.sitemap).toBe("https://aida.example.test/sitemap.xml");
  });

  it("falls back safely for missing or invalid URLs", () => {
    vi.stubEnv("SITE_URL", "not a url");
    expect(getSiteUrl().origin).toBe("http://localhost:3000");
  });
});

const url = process.env.DATABASE_URL;
const marker = `cleanup-${randomUUID().slice(0, 8)}`;

describe.skipIf(!url)("pruneOldRecords (PostgreSQL)", () => {
  let db: PrismaClient;
  const now = new Date();
  const old = (days: number) => new Date(now.getTime() - (days + 1) * 86_400_000);

  beforeAll(() => {
    db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url!, max: Number(process.env.DATABASE_POOL_MAX) || undefined }) });
  });
  afterAll(async () => {
    await db.submissionAttempt.deleteMany({ where: { formToken: { startsWith: marker } } });
    await db.loginAttempt.deleteMany({ where: { email: { startsWith: marker } } });
    await db.$disconnect();
  });

  it("removes only records older than their retention period", async () => {
    const hash = "e".repeat(64);
    await db.submissionAttempt.createMany({
      data: [
        { formToken: `${marker}-old`, ipHash: hash, outcome: "accepted", createdAt: old(RETENTION.submissionAttemptsDays) },
        { formToken: `${marker}-new`, ipHash: hash, outcome: "accepted", createdAt: now },
      ],
    });
    await db.loginAttempt.createMany({
      data: [
        { email: `${marker}-old@x.test`, ipHash: hash, success: false, createdAt: old(RETENTION.loginAttemptsDays) },
        { email: `${marker}-new@x.test`, ipHash: hash, success: false, createdAt: now },
      ],
    });

    const removed = await pruneOldRecords(db, now);
    expect(removed.submissionAttempts).toBeGreaterThanOrEqual(1);
    expect(removed.loginAttempts).toBeGreaterThanOrEqual(1);

    const left = await db.submissionAttempt.findMany({ where: { formToken: { startsWith: marker } } });
    expect(left.map((a) => a.formToken)).toEqual([`${marker}-new`]);
    const leftLogins = await db.loginAttempt.findMany({ where: { email: { startsWith: marker } } });
    expect(leftLogins.map((a) => a.email)).toEqual([`${marker}-new@x.test`]);
  });
});

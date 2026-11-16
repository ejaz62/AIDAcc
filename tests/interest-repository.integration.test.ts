import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { createPrismaInterestRepository } from "@/features/interest/prisma-repository";
import { POLICY } from "@/features/interest/service";
import { DuplicateTokenError } from "@/features/interest/types";

/**
 * Runs against the real PostgreSQL database from DATABASE_URL.
 * Uses a unique email domain and IP hash per run and cleans up afterwards.
 */
const url = process.env.DATABASE_URL;
const run = randomUUID().slice(0, 8);
const domain = `@it-${run}.test`;
const ipHash = `${run}`.padEnd(64, "0");

describe.skipIf(!url)("Prisma interest repository (PostgreSQL)", () => {
  let db: PrismaClient;

  beforeAll(() => {
    db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url!, max: Number(process.env.DATABASE_POOL_MAX) || undefined }) });
  });

  afterAll(async () => {
    await db.interestRegistration.deleteMany({ where: { email: { endsWith: domain } } });
    await db.submissionAttempt.deleteMany({ where: { ipHash } });
    await db.$disconnect();
  });

  const data = (local: string) => ({
    fullName: "Integration Test",
    email: `${local}${domain}`,
    learnerType: "OTHER" as const,
    message: undefined,
    programme: undefined,
    consent: "on" as const,
  });

  it("creates, de-duplicates and updates registrations", async () => {
    const repo = createPrismaInterestRepository(db);
    const t0 = new Date();

    expect(await repo.saveRegistration({ formToken: randomUUID(), ipHash }, data("one"), t0, POLICY.resubmitCooldownMs)).toBe(
      "created",
    );
    expect(
      await repo.saveRegistration({ formToken: randomUUID(), ipHash }, data("one"), t0, POLICY.resubmitCooldownMs),
    ).toBe("cooldown");

    const later = new Date(t0.getTime() + POLICY.resubmitCooldownMs + 1000);
    expect(
      await repo.saveRegistration({ formToken: randomUUID(), ipHash }, data("one"), later, POLICY.resubmitCooldownMs),
    ).toBe("updated");

    const rows = await db.interestRegistration.findMany({ where: { email: `one${domain}` } });
    expect(rows).toHaveLength(1);
    expect(rows[0].submissionCount).toBe(2);
    expect(rows[0].status).toBe("NEW");
  });

  it("rejects a reused form token", async () => {
    const repo = createPrismaInterestRepository(db);
    const formToken = randomUUID();
    await repo.saveRegistration({ formToken, ipHash }, data("two"), new Date(), POLICY.resubmitCooldownMs);
    await expect(
      repo.saveRegistration({ formToken, ipHash }, data("three"), new Date(), POLICY.resubmitCooldownMs),
    ).rejects.toBeInstanceOf(DuplicateTokenError);
    // The failed transaction must not have left a registration behind.
    expect(await db.interestRegistration.count({ where: { email: `three${domain}` } })).toBe(0);
    expect(await repo.findAttemptByToken(formToken)).toEqual({ outcome: "accepted" });
  });

  it("counts recent attempts per IP hash, including spam", async () => {
    const repo = createPrismaInterestRepository(db);
    const before = await repo.countRecentAttempts(ipHash, new Date(Date.now() - 60_000));
    await repo.recordSpam({ formToken: randomUUID(), ipHash });
    expect(await repo.countRecentAttempts(ipHash, new Date(Date.now() - 60_000))).toBe(before + 1);
    expect(await repo.countRecentAttempts(ipHash, new Date(Date.now() + 60_000))).toBe(0);
  });
});

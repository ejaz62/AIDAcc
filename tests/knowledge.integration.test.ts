import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { sslFor } from "@/lib/db-ssl";
import { PrismaClient } from "@/generated/prisma/client";
import type { AdminUser } from "@/features/admin/authorize";
import {
  getSectionWithHistory,
  restoreRevision,
  saveSection,
  sectionInputSchema,
  seedSectionsFromFiles,
} from "@/features/knowledge/knowledge";

/**
 * Knowledge-base editing against the real PostgreSQL database. Uses a temporary
 * section key per run (never a real section) and removes it afterwards.
 */
const url = process.env.DATABASE_URL;
const run = randomUUID().slice(0, 8);
const key = `test-${run}`;
const actor: AdminUser = { id: `kb-${run}`, name: "KB test", email: `kb-${run}@kb-it.test`, role: "admin" };
const file = { key, title: "Test section", summary: "Original short answer.", body: "Original body.", order: 999, page: "/about" };

describe.skipIf(!url)("knowledge base (PostgreSQL)", () => {
  let db: PrismaClient;
  beforeAll(() => {
    db = new PrismaClient({
      adapter: new PrismaPg({ connectionString: url!, max: Number(process.env.DATABASE_POOL_MAX) || undefined, ssl: sslFor(url!) }),
      transactionOptions: { maxWait: 10_000, timeout: 20_000 },
    });
  });
  afterAll(async () => {
    await db.knowledgeSection.deleteMany({ where: { key } });
    await db.auditLog.deleteMany({ where: { actorEmail: actor.email } });
    await db.$disconnect();
  });

  it("seeds a missing section once and never overwrites it", async () => {
    expect(await seedSectionsFromFiles(db, [file])).toEqual([key]);
    await db.knowledgeSection.update({ where: { key }, data: { summary: "Staff edit." } });
    expect(await seedSectionsFromFiles(db, [{ ...file, summary: "Changed in file." }])).toEqual([]);
    expect((await db.knowledgeSection.findUnique({ where: { key } }))?.summary).toBe("Staff edit.");
  });

  it("fills empty translations from the files but never replaces existing ones", async () => {
    await seedSectionsFromFiles(db, [{ ...file, summaryRoman: "Roman v1" }]);
    expect((await db.knowledgeSection.findUnique({ where: { key } }))?.summaryRoman).toBe("Roman v1");
    await seedSectionsFromFiles(db, [{ ...file, summaryRoman: "Roman v2", summaryUrdu: "اردو" }]);
    const s = await db.knowledgeSection.findUnique({ where: { key } });
    expect(s?.summaryRoman).toBe("Roman v1");
    expect(s?.summaryUrdu).toBe("اردو");
    expect(s?.summary).toBe("Staff edit.");
  });

  it("saves a new version, keeps history and restores an earlier version", async () => {
    const input = sectionInputSchema.parse({ title: "Test section", summary: "Updated short answer.", body: "Updated body.", note: "Fee update" });
    expect(await saveSection(db, actor, key, input)).toBe(true);
    let section = await getSectionWithHistory(db, key);
    expect(section?.summary).toBe("Updated short answer.");
    expect(section?.updatedBy).toBe(actor.email);
    expect(section?.revisions.map((r) => r.note)).toEqual(["Fee update", "Initial import from knowledge/aida"]);
    expect(await db.auditLog.count({ where: { actorEmail: actor.email, action: "knowledge.updated", targetId: key } })).toBe(1);

    const original = section!.revisions[1];
    expect(await restoreRevision(db, actor, original.id)).toBe(key);
    section = await getSectionWithHistory(db, key);
    expect(section?.summary).toBe("Original short answer.");
    expect(section?.revisions).toHaveLength(3);
    expect(section?.revisions[0].note).toMatch(/^Restored version from/);
  });

  it("rejects unknown sections and invalid input", async () => {
    const input = sectionInputSchema.parse({ title: "X title", summary: "A valid short answer.", body: "Body" });
    expect(await saveSection(db, actor, `missing-${run}`, input)).toBe(false);
    expect(sectionInputSchema.safeParse({ title: "", summary: "short", body: "" }).success).toBe(false);
    expect(await restoreRevision(db, actor, "does-not-exist")).toBeNull();
  });
});

/**
 * Turns the "Development preview" strip on or off — the same setting as the
 * checkbox in Admin → Site details. Only that one field is changed (in both the
 * draft and the published copy); every other site detail is left as it is.
 *
 *   npm run site:preview-notice -- off
 *   npm run site:preview-notice -- on
 */
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import { sslFor } from "../src/lib/db-ssl";
import { AUDIT_ACTIONS, writeAudit } from "../src/features/admin/audit";
import { SITE_KEY } from "../src/features/content/site-content";

config({ path: [".env.local", ".env"], quiet: true });

async function main() {
  const mode = process.argv[2];
  if (mode !== "on" && mode !== "off") throw new Error("Usage: npm run site:preview-notice -- on|off");
  const show = mode === "on";
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: url, ssl: sslFor(url) }),
    transactionOptions: { maxWait: 15_000, timeout: 30_000 },
  });
  try {
    const row = await db.siteContent.findUnique({ where: { key: SITE_KEY } });
    if (!row) throw new Error("Site details have not been saved yet (Admin → Site details).");
    const patch = (json: Prisma.JsonValue | null) =>
      ({ ...((json && typeof json === "object" && !Array.isArray(json) ? json : {}) as Record<string, unknown>), showPreviewNotice: show }) as Prisma.InputJsonValue;
    await db.$transaction(async (tx) => {
      await tx.siteContent.update({
        where: { key: SITE_KEY },
        data: { draft: patch(row.draft), ...(row.published ? { published: patch(row.published) } : {}) },
      });
      await writeAudit(tx, { id: null, email: "setup (owner request)" }, AUDIT_ACTIONS.sitePublished, { type: "site", id: SITE_KEY }, { showPreviewNotice: show });
    });
    console.log(`Development preview strip: ${show ? "ON" : "OFF"}${row.published ? "" : " (draft only — nothing published yet)"}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

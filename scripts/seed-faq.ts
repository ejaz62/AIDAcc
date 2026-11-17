/**
 * Adds the starter FAQ entries (published) — only when the FAQ is empty, so it
 * never overwrites or duplicates staff content.   npm run db:seed-faq
 */
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { sslFor } from "../src/lib/db-ssl";
import { STARTER_FAQ } from "../src/features/faq/starter-faq";

config({ path: [".env.local", ".env"], quiet: true });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url, ssl: sslFor(url) }) });
  try {
    const existing = await db.faqEntry.count();
    if (existing > 0) {
      console.log(`FAQ already has ${existing} entries; nothing added.`);
      return;
    }
    await db.faqEntry.createMany({
      data: STARTER_FAQ.map((f, i) => ({ ...f, status: "PUBLISHED" as const, sortOrder: (i + 1) * 10 })),
    });
    console.log(`Added ${STARTER_FAQ.length} starter FAQ entries.`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

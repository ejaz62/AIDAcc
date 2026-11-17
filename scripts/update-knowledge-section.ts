/**
 * Publishes one knowledge-base section from its file in knowledge/aida/ to the database.
 * The previous version stays in the section's history and can be restored in
 * Admin → Knowledge base.
 *
 *   npm run kb:update -- founder
 */
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { sslFor } from "../src/lib/db-ssl";
import { parseKnowledgeFile, saveSection, sectionInputSchema } from "../src/features/knowledge/knowledge";

config({ path: [".env.local", ".env"], quiet: true });

async function main() {
  const key = process.argv[2];
  if (!key) throw new Error("Usage: npm run kb:update -- <section key>");
  const dir = path.resolve("knowledge/aida");
  const file = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => parseKnowledgeFile(fs.readFileSync(path.join(dir, f), "utf8")))
    .find((f) => f.key === key);
  if (!file) throw new Error(`No knowledge file with key "${key}".`);

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: url, ssl: sslFor(url) }),
    // The production database is far away; allow time for the transaction.
    transactionOptions: { maxWait: 15_000, timeout: 30_000 },
  });
  try {
    const input = sectionInputSchema.parse({ ...file, note: "Updated from knowledge file" });
    const actor = { id: "knowledge-files", name: "Knowledge files", email: "knowledge files", role: "admin" };
    const ok = await saveSection(db, actor, key, input);
    console.log(ok ? `Section "${key}" updated (previous version kept in history).` : `Section "${key}" is not in the database yet; run kb:seed.`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

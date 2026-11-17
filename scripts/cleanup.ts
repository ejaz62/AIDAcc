/** Runs the same housekeeping as the scheduled job: `npm run db:cleanup`. */
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { sslFor } from "../src/lib/db-ssl";
import { pruneOldRecords } from "../src/features/maintenance/cleanup";

config({ path: [".env.local", ".env"], quiet: true });

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set.");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, ssl: sslFor(process.env.DATABASE_URL) }) });
  try {
    console.log("Removed:", await pruneOldRecords(db));
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

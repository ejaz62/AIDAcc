import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { sslFor } from "./db-ssl";
import { getServerEnv } from "./env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Optional cap on pooled connections per server instance (DATABASE_POOL_MAX).
 * The local Prisma Dev database needs 1; Supabase works with the default.
 */
function poolMax(): number | undefined {
  const n = Number(process.env.DATABASE_POOL_MAX);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

function createClient() {
  const connectionString = getServerEnv().DATABASE_URL;
  const adapter = new PrismaPg({ connectionString, max: poolMax(), ssl: sslFor(connectionString) });
  return new PrismaClient({ adapter, transactionOptions: TRANSACTION_OPTIONS });
}

/**
 * Prisma's defaults (2 s to start, 5 s to finish a transaction) are tight for a
 * remote database when a connection must first be opened; allow more headroom.
 */
export const TRANSACTION_OPTIONS = { maxWait: 10_000, timeout: 20_000 } as const;

/** Lazily-created Prisma client, reused across hot reloads in development. */
export function getDb(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

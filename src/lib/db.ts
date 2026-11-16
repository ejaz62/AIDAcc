import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
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
  const adapter = new PrismaPg({ connectionString: getServerEnv().DATABASE_URL, max: poolMax() });
  return new PrismaClient({ adapter });
}

/** Lazily-created Prisma client, reused across hot reloads in development. */
export function getDb(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Mirror Next.js precedence: .env.local overrides .env.
config({ path: [".env.local", ".env"], quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations need a direct (non-pooled) connection, e.g. Supabase port 5432.
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    // Only needed for `prisma migrate dev` (local development).
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL || undefined,
  },
});

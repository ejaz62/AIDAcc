import "server-only";
import { z } from "zod";
import { createAuth, type Auth } from "./auth-config";
import { getDb } from "./db";
import { ConfigurationError } from "./env";

const authEnvSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.url("BETTER_AUTH_URL must be a full URL, e.g. http://localhost:3000"),
});

const globalForAuth = globalThis as unknown as { aidaAuth?: Auth };

/** Lazily-created Better Auth instance (validated env, shared Prisma client). */
export function getAuth(): Auth {
  if (globalForAuth.aidaAuth) return globalForAuth.aidaAuth;
  const parsed = authEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new ConfigurationError(
      `Invalid auth configuration: ${parsed.error.issues.map((i) => i.message).join("; ")}. See .env.example.`,
    );
  }
  globalForAuth.aidaAuth = createAuth(getDb(), {
    secret: parsed.data.BETTER_AUTH_SECRET,
    baseURL: parsed.data.BETTER_AUTH_URL,
  });
  return globalForAuth.aidaAuth;
}

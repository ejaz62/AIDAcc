import "server-only";
import { z } from "zod";

/**
 * Server-only environment configuration. Never import this from client code;
 * the `server-only` import makes the build fail if that happens.
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is not set"),
  IP_HASH_SALT: z.string().min(16, "IP_HASH_SALT must be at least 16 characters"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

/** Validates lazily so pages that do not need the database still build and render. */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => i.message).join("; ");
    throw new ConfigurationError(`Invalid server configuration: ${issues}. See .env.example.`);
  }
  cached = parsed.data;
  return cached;
}

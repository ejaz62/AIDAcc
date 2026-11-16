import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import type { PrismaClient } from "@/generated/prisma/client";

/** Staff sessions last 8 hours and are extended at most once an hour while active. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
export const MIN_PASSWORD_LENGTH = 12;

export interface AuthSettings {
  secret: string;
  baseURL: string;
  /** Lets Server Actions set cookies. Off for scripts/tests that run outside a Next.js request. */
  nextCookies?: boolean;
}

/**
 * Builds the Better Auth instance. Kept free of `server-only` so the admin
 * bootstrap script and integration tests can construct it too.
 */
export function createAuth(db: PrismaClient, settings: AuthSettings) {
  return betterAuth({
    appName: "AIDA",
    secret: settings.secret,
    baseURL: settings.baseURL,
    database: prismaAdapter(db, { provider: "postgresql" }),
    emailAndPassword: {
      enabled: true,
      // Staff accounts are created by an administrator, never by self sign-up.
      disableSignUp: true,
      minPasswordLength: MIN_PASSWORD_LENGTH,
      maxPasswordLength: 128,
    },
    session: {
      expiresIn: SESSION_MAX_AGE_SECONDS,
      updateAge: 60 * 60,
    },
    user: {
      additionalFields: {
        role: { type: "string", defaultValue: "admin", input: false },
        disabled: { type: "boolean", defaultValue: false, input: false },
      },
    },
    databaseHooks: {
      session: {
        create: {
          // Refuse to start a session for a disabled account.
          before: async (session) => {
            const user = await db.user.findUnique({ where: { id: session.userId }, select: { disabled: true } });
            if (!user || user.disabled) return false;
          },
        },
      },
    },
    telemetry: { enabled: false },
    advanced: {
      cookiePrefix: "aida",
      useSecureCookies: settings.baseURL.startsWith("https://"),
    },
    // Must be last: lets Server Actions set the session cookie.
    plugins: settings.nextCookies === false ? [] : [nextCookies()],
  });
}

export type Auth = ReturnType<typeof createAuth>;

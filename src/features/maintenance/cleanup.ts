import type { PrismaClient } from "@/generated/prisma/client";

/** How long short-lived security records are kept. Registrations and the audit log are not touched. */
export const RETENTION = {
  submissionAttemptsDays: 30,
  loginAttemptsDays: 90,
  /** Delivered, previewed or permanently failed emails (they contain personal data). */
  emailsDays: 30,
  /** Ask AIDA conversations (may contain whatever visitors typed). */
  assistantDays: 30,
} as const;

const daysAgo = (now: Date, days: number) => new Date(now.getTime() - days * 86_400_000);

/**
 * Removes records that are only needed briefly: rate-limit and sign-in attempt
 * logs past their retention period, expired sessions and verification tokens, and old email records.
 */
export async function pruneOldRecords(db: PrismaClient, now = new Date()) {
  // Sequential on purpose: a daily job gains nothing from parallel queries, and it keeps load low.
  const submissionAttempts = await db.submissionAttempt.deleteMany({
    where: { createdAt: { lt: daysAgo(now, RETENTION.submissionAttemptsDays) } },
  });
  const loginAttempts = await db.loginAttempt.deleteMany({
    where: { createdAt: { lt: daysAgo(now, RETENTION.loginAttemptsDays) } },
  });
  const sessions = await db.session.deleteMany({ where: { expiresAt: { lt: now } } });
  const verifications = await db.verification.deleteMany({ where: { expiresAt: { lt: now } } });
  const assistantConversations = await db.assistantConversation.deleteMany({
    where: { updatedAt: { lt: daysAgo(now, RETENTION.assistantDays) } },
  });
  const emails = await db.emailMessage.deleteMany({
    where: { status: { in: ["SENT", "PREVIEW", "FAILED"] }, createdAt: { lt: daysAgo(now, RETENTION.emailsDays) } },
  });
  return {
    submissionAttempts: submissionAttempts.count,
    loginAttempts: loginAttempts.count,
    sessions: sessions.count,
    verifications: verifications.count,
    emails: emails.count,
    assistantConversations: assistantConversations.count,
  };
}

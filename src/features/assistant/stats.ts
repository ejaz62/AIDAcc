import type { PrismaClient } from "@/generated/prisma/client";

/** Headline numbers for the admin Assistant page. */
export async function getAssistantStats(db: PrismaClient, now = new Date()) {
  const since = new Date(now.getTime() - 30 * 86_400_000);
  const [total, questions30, aiAnswers30] = await Promise.all([
    db.assistantConversation.count(),
    db.assistantMessage.count({ where: { role: "user", createdAt: { gte: since } } }),
    db.assistantMessage.count({ where: { source: "ai", createdAt: { gte: since } } }),
  ]);
  return { total, questions30, aiAnswers30 };
}

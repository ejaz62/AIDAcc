import "server-only";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { DuplicateTokenError, type InterestRepository } from "./types";

const isUniqueViolation = (err: unknown, field: string) =>
  err instanceof Prisma.PrismaClientKnownRequestError &&
  err.code === "P2002" &&
  JSON.stringify(err.meta ?? {}).includes(field);

export function createPrismaInterestRepository(db: PrismaClient): InterestRepository {
  return {
    findAttemptByToken(formToken) {
      return db.submissionAttempt.findUnique({ where: { formToken }, select: { outcome: true } });
    },

    async isPublishedProgramme(id) {
      return (await db.programme.count({ where: { id, status: "PUBLISHED" } })) > 0;
    },

    countRecentAttempts(ipHash, since) {
      return db.submissionAttempt.count({ where: { ipHash, createdAt: { gte: since } } });
    },

    async recordSpam({ formToken, ipHash }) {
      await db.submissionAttempt.create({ data: { formToken, ipHash, outcome: "spam" } });
    },

    async saveRegistration({ formToken, ipHash }, data, now, cooldownMs) {
      try {
        return await db.$transaction(async (tx) => {
          const existing = await tx.interestRegistration.findUnique({
            where: { email: data.email },
            select: { id: true, lastSubmittedAt: true },
          });

          let result: "created" | "updated" | "cooldown";
          let id = existing?.id ?? "";
          if (!existing) {
            id = (await tx.interestRegistration.create({
              data: {
                fullName: data.fullName,
                email: data.email,
                learnerType: data.learnerType,
                message: data.message ?? null,
                programmeId: data.programme ?? null,
                consentAt: now,
                lastSubmittedAt: now,
              },
              select: { id: true },
            })).id;
            result = "created";
          } else if (now.getTime() - existing.lastSubmittedAt.getTime() < cooldownMs) {
            // Rapid repeat from the same address: acknowledge without changing the record.
            result = "cooldown";
          } else {
            // Later re-registration: keep one row, refresh details and count it.
            await tx.interestRegistration.update({
              where: { id: existing.id },
              data: {
                fullName: data.fullName,
                learnerType: data.learnerType,
                message: data.message ?? undefined,
                programmeId: data.programme ?? undefined,
                consentAt: now,
                lastSubmittedAt: now,
                submissionCount: { increment: 1 },
              },
            });
            result = "updated";
          }

          await tx.submissionAttempt.create({
            data: { formToken, ipHash, outcome: result === "created" ? "accepted" : "duplicate" },
          });
          return { result, id };
        });
      } catch (err) {
        if (isUniqueViolation(err, "formToken")) throw new DuplicateTokenError();
        if (isUniqueViolation(err, "email")) {
          // Two first-time submissions for one email raced; the other one won.
          const winner = await db.interestRegistration.findUnique({ where: { email: data.email }, select: { id: true } });
          return { result: "cooldown", id: winner?.id ?? "" };
        }
        throw err;
      }
    },
  };
}

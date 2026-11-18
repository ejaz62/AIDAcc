import type { InterestInput } from "@/features/interest/schema";
import { DuplicateTokenError, type InterestRepository } from "@/features/interest/types";

export function makeForm(overrides: Record<string, string | undefined> = {}): FormData {
  const base: Record<string, string | undefined> = {
    fullName: "Ada Lovelace",
    email: "Ada@Example.com ",
    learnerType: "STUDENT",
    message: "Looking forward to it.",
    consent: "on",
    aida_hidden_check: "",
    formToken: "11111111-1111-4111-8111-111111111111",
    startedAt: "0",
    ...overrides,
  };
  const fd = new FormData();
  for (const [k, v] of Object.entries(base)) if (v !== undefined) fd.set(k, v);
  return fd;
}

/** In-memory repository mirroring the Prisma implementation's contract. */
export function createMemoryRepo(publishedProgrammeIds: string[] = []) {
  const attempts: Array<{ formToken: string; ipHash: string; outcome: string; createdAt: Date }> = [];
  const registrations = new Map<
    string,
    InterestInput & { submissionCount: number; lastSubmittedAt: Date; createdAt: Date }
  >();

  const repo: InterestRepository = {
    async isPublishedProgramme(id) {
      return publishedProgrammeIds.includes(id);
    },
    async findAttemptByToken(token) {
      return attempts.find((a) => a.formToken === token) ?? null;
    },
    async countRecentAttempts(ipHash, since) {
      return attempts.filter((a) => a.ipHash === ipHash && a.createdAt >= since).length;
    },
    async recordSpam({ formToken, ipHash }) {
      attempts.push({ formToken, ipHash, outcome: "spam", createdAt: new Date() });
    },
    async saveRegistration({ formToken, ipHash }, data, now, cooldownMs) {
      if (attempts.some((a) => a.formToken === formToken)) throw new DuplicateTokenError();
      const existing = registrations.get(data.email);
      let result: "created" | "updated" | "cooldown";
      const id = `mem-${data.email}`;
      if (!existing) {
        registrations.set(data.email, { ...data, submissionCount: 1, lastSubmittedAt: now, createdAt: now });
        result = "created";
      } else if (now.getTime() - existing.lastSubmittedAt.getTime() < cooldownMs) {
        result = "cooldown";
      } else {
        Object.assign(existing, data, { lastSubmittedAt: now, submissionCount: existing.submissionCount + 1 });
        result = "updated";
      }
      attempts.push({ formToken, ipHash, outcome: result === "created" ? "accepted" : "duplicate", createdAt: now });
      return { result, id };
    },
  };
  return { repo, attempts, registrations };
}

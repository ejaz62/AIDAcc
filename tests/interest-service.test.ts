import { describe, expect, it } from "vitest";
import { MESSAGES, POLICY, submitInterest } from "@/features/interest/service";
import { DuplicateTokenError, type InterestRepository } from "@/features/interest/types";
import { createMemoryRepo, makeForm } from "./helpers";

const NOW = new Date("2026-11-16T12:00:00Z");
let tokenSeq = 0;
const ctx = (over: Partial<{ ipHash: string; now: Date }> = {}) => ({
  ipHash: "a".repeat(64),
  now: NOW,
  generateToken: () => `generated-token-${String(++tokenSeq).padStart(8, "0")}`,
  ...over,
});
const token = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

describe("submitInterest", () => {
  it("stores a valid registration with a normalised email", async () => {
    const { repo, registrations, attempts } = createMemoryRepo();
    const res = await submitInterest(makeForm(), repo, ctx());
    expect(res).toEqual({ status: "success", message: MESSAGES.success });
    expect(registrations.get("ada@example.com")?.fullName).toBe("Ada Lovelace");
    expect(attempts).toHaveLength(1);
    expect(attempts[0].outcome).toBe("accepted");
  });

  it("success message states this is not an application", async () => {
    expect(MESSAGES.success).toMatch(/not an application for admission/i);
  });

  it("ignores a replay of the same form token (double submit)", async () => {
    const { repo, registrations, attempts } = createMemoryRepo();
    await submitInterest(makeForm(), repo, ctx());
    const again = await submitInterest(makeForm(), repo, ctx());
    expect(again.status).toBe("success");
    expect(registrations.size).toBe(1);
    expect(registrations.get("ada@example.com")?.submissionCount).toBe(1);
    expect(attempts).toHaveLength(1);
  });

  it("keeps one record per email and does not re-count within the cooldown", async () => {
    const { repo, registrations } = createMemoryRepo();
    await submitInterest(makeForm({ formToken: token(1) }), repo, ctx());
    const res = await submitInterest(makeForm({ formToken: token(2), email: "ADA@example.com" }), repo, ctx());
    expect(res.status).toBe("success");
    expect(registrations.size).toBe(1);
    expect(registrations.get("ada@example.com")?.submissionCount).toBe(1);
  });

  it("counts a later re-registration on the same record", async () => {
    const { repo, registrations } = createMemoryRepo();
    await submitInterest(makeForm({ formToken: token(1) }), repo, ctx());
    const later = new Date(NOW.getTime() + POLICY.resubmitCooldownMs + 1000);
    await submitInterest(
      makeForm({ formToken: token(2), learnerType: "EDUCATOR" }),
      repo,
      ctx({ now: later, ipHash: "b".repeat(64) }),
    );
    const rec = registrations.get("ada@example.com");
    expect(rec?.submissionCount).toBe(2);
    expect(rec?.learnerType).toBe("EDUCATOR");
  });

  it("gives an identical response for new and already-registered emails", async () => {
    const { repo } = createMemoryRepo();
    const first = await submitInterest(makeForm({ formToken: token(1) }), repo, ctx());
    const second = await submitInterest(makeForm({ formToken: token(2) }), repo, ctx());
    expect(second).toEqual(first);
  });

  it("silently discards honeypot submissions", async () => {
    const { repo, registrations, attempts } = createMemoryRepo();
    const res = await submitInterest(makeForm({ company_website: "http://spam.example" }), repo, ctx());
    expect(res.status).toBe("success");
    expect(registrations.size).toBe(0);
    expect(attempts[0].outcome).toBe("spam");
  });

  it("silently discards submissions completed implausibly fast", async () => {
    const { repo, registrations } = createMemoryRepo();
    const startedAt = String(NOW.getTime() - 500);
    const res = await submitInterest(makeForm({ startedAt }), repo, ctx());
    expect(res.status).toBe("success");
    expect(registrations.size).toBe(0);
  });

  it("accepts submissions that took a normal amount of time", async () => {
    const { repo, registrations } = createMemoryRepo();
    const startedAt = String(NOW.getTime() - 20_000);
    await submitInterest(makeForm({ startedAt }), repo, ctx());
    expect(registrations.size).toBe(1);
  });

  it("rate-limits repeated submissions from one IP", async () => {
    const { repo, registrations } = createMemoryRepo();
    for (let i = 0; i < POLICY.rateLimitMax; i++) {
      const r = await submitInterest(makeForm({ formToken: token(i), email: `p${i}@example.com` }), repo, ctx());
      expect(r.status).toBe("success");
    }
    const blocked = await submitInterest(makeForm({ formToken: token(99), email: "late@example.com" }), repo, ctx());
    expect(blocked).toEqual({ status: "error", message: MESSAGES.rateLimited });
    expect(registrations.has("late@example.com")).toBe(false);

    // A different IP is unaffected.
    const other = await submitInterest(
      makeForm({ formToken: token(100), email: "other@example.com" }),
      repo,
      ctx({ ipHash: "c".repeat(64) }),
    );
    expect(other.status).toBe("success");
  });

  it("returns field errors and submitted values without storing anything", async () => {
    const { repo, registrations, attempts } = createMemoryRepo();
    const res = await submitInterest(makeForm({ email: "bad", consent: undefined }), repo, ctx());
    expect(res.status).toBe("error");
    if (res.status !== "error") return;
    expect(res.message).toBe(MESSAGES.invalid);
    expect(res.fieldErrors?.email).toBeDefined();
    expect(res.fieldErrors?.consent).toBeDefined();
    expect(res.values?.fullName).toBe("Ada Lovelace");
    expect(registrations.size).toBe(0);
    expect(attempts).toHaveLength(0);
  });

  it("generates a token when the browser did not send a valid one", async () => {
    const { repo, attempts } = createMemoryRepo();
    await submitInterest(makeForm({ formToken: "bad token!" }), repo, ctx());
    expect(attempts[0].formToken).toMatch(/^generated-token-/);
  });

  it("treats a token race in the database as an already-processed submission", async () => {
    const { repo } = createMemoryRepo();
    const racing: InterestRepository = {
      ...repo,
      saveRegistration: async () => {
        throw new DuplicateTokenError();
      },
    };
    expect((await submitInterest(makeForm(), racing, ctx())).status).toBe("success");
  });

  it("propagates unexpected database errors to the caller", async () => {
    const { repo } = createMemoryRepo();
    const broken: InterestRepository = {
      ...repo,
      saveRegistration: async () => {
        throw new Error("connection refused");
      },
    };
    await expect(submitInterest(makeForm(), broken, ctx())).rejects.toThrow("connection refused");
  });
});

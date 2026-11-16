import type { InterestField, InterestInput } from "./schema";

export type SubmissionOutcome = "accepted" | "duplicate" | "spam";

/** Persistence port — implemented with Prisma in production, in-memory in tests. */
export interface InterestRepository {
  findAttemptByToken(formToken: string): Promise<{ outcome: string } | null>;
  /** True if the id belongs to a currently published programme. */
  isPublishedProgramme(id: string): Promise<boolean>;
  countRecentAttempts(ipHash: string, since: Date): Promise<number>;
  recordSpam(attempt: { formToken: string; ipHash: string }): Promise<void>;
  /**
   * Atomically records the attempt and creates or updates the registration.
   * Must throw `DuplicateTokenError` if the form token was already used.
   */
  saveRegistration(
    attempt: { formToken: string; ipHash: string },
    data: InterestInput,
    now: Date,
    resubmitCooldownMs: number,
  ): Promise<"created" | "updated" | "cooldown">;
}

export class DuplicateTokenError extends Error {
  constructor() {
    super("Form token already used");
    this.name = "DuplicateTokenError";
  }
}

export type InterestFormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | {
      status: "error";
      message: string;
      fieldErrors?: Partial<Record<InterestField, string>>;
      values?: Partial<Record<InterestField, string>>;
    };

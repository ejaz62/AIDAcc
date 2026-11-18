import { interestSchema, readInterestForm, type InterestField } from "./schema";
import { DuplicateTokenError, type InterestFormState, type InterestRepository } from "./types";

export const POLICY = {
  /** Max accepted/spam submissions per hashed IP within the window. */
  rateLimitMax: 5,
  rateLimitWindowMs: 15 * 60 * 1000,
  /** Submissions faster than this after the form loaded are treated as bots. */
  minFillTimeMs: 2500,
  /** Repeat registrations for the same email within this period are not re-counted. */
  resubmitCooldownMs: 10 * 60 * 1000,
} as const;

export const MESSAGES = {
  success:
    "Thank you — your interest has been registered. We will contact you by email when there is news to share. Please note this is not an application for admission.",
  rateLimited: "You have made several submissions in a short time. Please wait a few minutes and try again.",
  invalid: "Please correct the highlighted fields and try again.",
  unavailable: "Registration is temporarily unavailable. Please try again later.",
} as const;

const TOKEN_RE = /^[A-Za-z0-9-]{16,64}$/;

export interface SubmissionContext {
  ipHash: string;
  now: Date;
  /** Fallback token when the browser did not supply one (e.g. JavaScript disabled). */
  generateToken: () => string;
  /** Called once when a brand-new registration is stored (not for duplicates). */
  onCreated?: (registrationId: string) => Promise<void>;
}

/**
 * Handles a Register Interest submission end to end:
 * idempotency → rate limit → spam checks → validation → persistence.
 * Responses never reveal whether an email address is already registered.
 */
export async function submitInterest(
  formData: FormData,
  repo: InterestRepository,
  ctx: SubmissionContext,
): Promise<InterestFormState> {
  const { fields, honeypot, formToken: rawToken, startedAt } = readInterestForm(formData);
  const formToken = rawToken && TOKEN_RE.test(rawToken) ? rawToken : ctx.generateToken();
  const attempt = { formToken, ipHash: ctx.ipHash };
  const success: InterestFormState = { status: "success", message: MESSAGES.success };

  // 1. Idempotency — a replay of an already-processed form is acknowledged, not reprocessed.
  if (await repo.findAttemptByToken(formToken)) return success;

  // 2. Rate limiting per hashed IP.
  const since = new Date(ctx.now.getTime() - POLICY.rateLimitWindowMs);
  if ((await repo.countRecentAttempts(ctx.ipHash, since)) >= POLICY.rateLimitMax) {
    return { status: "error", message: MESSAGES.rateLimited };
  }

  // 3. Spam heuristics — respond as if successful so bots learn nothing.
  const started = Number(startedAt);
  const tooFast = Number.isFinite(started) && started > 0 && ctx.now.getTime() - started < POLICY.minFillTimeMs;
  if (honeypot.trim() !== "" || tooFast) {
    await repo.recordSpam(attempt).catch(() => {});
    return success;
  }

  // 4. Server-side validation.
  const parsed = interestSchema.safeParse(fields);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<InterestField, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as InterestField;
      fieldErrors[key] ??= issue.message;
    }
    return {
      status: "error",
      message: MESSAGES.invalid,
      fieldErrors,
      values: Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined)),
    };
  }

  // 5. The chosen programme (if any) must be one that is currently published.
  if (parsed.data.programme && !(await repo.isPublishedProgramme(parsed.data.programme))) {
    return {
      status: "error",
      message: MESSAGES.invalid,
      fieldErrors: { programme: "Please choose a programme from the list." },
      values: Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined)),
    };
  }

  // 6. Persist (create or update, one row per email).
  try {
    const saved = await repo.saveRegistration(attempt, parsed.data, ctx.now, POLICY.resubmitCooldownMs);
    if (saved.result === "created" && ctx.onCreated) {
      // Notification problems must never make a successful registration look like a failure.
      await ctx.onCreated(saved.id).catch((err) =>
        console.error("[submitInterest] notification failed:", err instanceof Error ? err.message : err),
      );
    }
  } catch (err) {
    if (err instanceof DuplicateTokenError) return success;
    throw err;
  }
  return success;
}

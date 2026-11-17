import type { PrismaClient } from "@/generated/prisma/client";
import { admissionSchema, readAdmissionForm, type AdmissionField, type AdmissionFormState } from "./schema";

export const ADMISSION_POLICY = {
  /** Applications (and spam attempts) allowed per hashed IP within the window. */
  rateLimitMax: 5,
  rateLimitWindowMs: 15 * 60 * 1000,
  /** Submissions faster than this after the form loaded are treated as bots. */
  minFillTimeMs: 4000,
} as const;

export const ADMISSION_MESSAGES = {
  success:
    "Thank you — your application has been received. AIDA Reception will contact you on WhatsApp to confirm your batch and explain payment. Your place is confirmed only after AIDA verifies your payment.",
  rateLimited: "You have made several submissions in a short time. Please wait a few minutes and try again.",
  invalid: "Please correct the highlighted fields and try again.",
  unavailable: "Applications are temporarily unavailable. Please try again later, or contact AIDA Reception on WhatsApp.",
} as const;

const TOKEN_RE = /^[A-Za-z0-9-]{16,64}$/;

export interface AdmissionContext {
  db: PrismaClient;
  ipHash: string;
  now: Date;
  generateToken: () => string;
  /** Called once when a new application is stored (staff alerts, confirmation email). */
  onCreated?: (applicationId: string) => Promise<void>;
}

const isUniqueViolation = (err: unknown) =>
  typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "P2002";

/**
 * Handles an Admission form submission:
 * idempotency → rate limit → spam checks → validation → save → notify.
 */
export async function submitAdmission(formData: FormData, ctx: AdmissionContext): Promise<AdmissionFormState> {
  const { db } = ctx;
  const { fields, honeypot, formToken: rawToken, startedAt } = readAdmissionForm(formData);
  const formToken = rawToken && TOKEN_RE.test(rawToken) ? rawToken : ctx.generateToken();
  const success: AdmissionFormState = { status: "success", message: ADMISSION_MESSAGES.success };

  // 1. A replay of an already-processed form is acknowledged, not saved twice.
  if (await db.submissionAttempt.findUnique({ where: { formToken }, select: { id: true } })) return success;

  // 2. Rate limiting per hashed IP.
  const since = new Date(ctx.now.getTime() - ADMISSION_POLICY.rateLimitWindowMs);
  if ((await db.submissionAttempt.count({ where: { ipHash: ctx.ipHash, createdAt: { gte: since } } })) >= ADMISSION_POLICY.rateLimitMax) {
    return { status: "error", message: ADMISSION_MESSAGES.rateLimited };
  }

  // 3. Spam heuristics — respond as if successful so bots learn nothing.
  const started = Number(startedAt);
  const tooFast = Number.isFinite(started) && started > 0 && ctx.now.getTime() - started < ADMISSION_POLICY.minFillTimeMs;
  if (honeypot.trim() !== "" || tooFast) {
    await db.submissionAttempt.create({ data: { formToken, ipHash: ctx.ipHash, outcome: "admission_spam" } }).catch(() => {});
    return success;
  }

  // 4. Server-side validation.
  const parsed = admissionSchema.safeParse(fields);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<AdmissionField, string>> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as AdmissionField] ??= issue.message;
    return {
      status: "error",
      message: ADMISSION_MESSAGES.invalid,
      fieldErrors,
      values: Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined)),
    };
  }

  // 5. Save the application and the attempt together.
  const { fullName, whatsapp, email, location, course, batch, computerKnowledge, aiExperience, message } = parsed.data;
  const data = { fullName, whatsapp, email, location, course, batch, computerKnowledge, aiExperience, message };
  let id: string;
  try {
    id = await db.$transaction(async (tx) => {
      await tx.submissionAttempt.create({ data: { formToken, ipHash: ctx.ipHash, outcome: "admission" } });
      const app = await tx.admissionApplication.create({ data: { ...data, ipHash: ctx.ipHash }, select: { id: true } });
      return app.id;
    });
  } catch (err) {
    if (isUniqueViolation(err)) return success; // same form submitted twice at once
    throw err;
  }

  // 6. Notifications must never make a saved application look like a failure.
  if (ctx.onCreated) {
    await ctx.onCreated(id).catch((err) =>
      console.error("[submitAdmission] notification failed:", err instanceof Error ? err.message : err),
    );
  }
  return success;
}

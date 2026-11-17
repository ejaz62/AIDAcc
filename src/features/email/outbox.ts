import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import type { RenderedEmail } from "./templates";
import { EmailSendError, type EmailTransport } from "./transport";

export const MAX_ATTEMPTS = 5;

export type EmailKind =
  | "registrant_confirmation"
  | "staff_alert"
  | "staff_digest"
  | "test"
  | "admission_alert"
  | "applicant_confirmation";

export async function enqueueEmail(
  db: PrismaClient,
  input: { kind: EmailKind; to: string; email: RenderedEmail; registrationId?: string },
) {
  return db.emailMessage.create({
    data: {
      kind: input.kind,
      to: input.to,
      subject: input.email.subject.slice(0, 200),
      html: input.email.html,
      text: input.email.text,
      registrationId: input.registrationId,
    },
    select: { id: true },
  });
}

/**
 * Attempts delivery of one stored message. Never throws for delivery
 * failures — the outcome is recorded on the message for retry and display.
 */
export async function deliverEmail(db: PrismaClient, transport: EmailTransport, id: string) {
  const msg = await db.emailMessage.findUnique({ where: { id } });
  if (!msg || msg.status === "SENT" || msg.status === "PREVIEW") return msg?.status ?? null;
  if (msg.status === "FAILED" && msg.attempts >= MAX_ATTEMPTS) return "FAILED";

  try {
    const { providerId } = await transport.send({ to: msg.to, subject: msg.subject, html: msg.html, text: msg.text });
    await db.emailMessage.update({
      where: { id },
      data: {
        status: transport.delivers ? "SENT" : "PREVIEW",
        provider: transport.name,
        providerId: providerId?.slice(0, 100),
        attempts: { increment: 1 },
        lastError: null,
        sentAt: transport.delivers ? new Date() : null,
      },
    });
    return transport.delivers ? "SENT" : "PREVIEW";
  } catch (err) {
    const permanent = err instanceof EmailSendError && err.permanent;
    const message = err instanceof Error ? err.message : "Unknown error";
    await db.emailMessage.update({
      where: { id },
      data: {
        status: "FAILED",
        provider: transport.name,
        attempts: permanent ? MAX_ATTEMPTS : { increment: 1 },
        lastError: message.slice(0, 500),
      },
    });
    return "FAILED";
  }
}

/** Delivers pending messages and retries failed ones that still have attempts left. */
export async function processOutbox(
  db: PrismaClient,
  transport: EmailTransport,
  opts: { limit?: number; where?: Prisma.EmailMessageWhereInput } = {},
) {
  const limit = opts.limit ?? 50;
  const due = await db.emailMessage.findMany({
    where: {
      AND: [opts.where ?? {}, { OR: [{ status: "PENDING" }, { status: "FAILED", attempts: { lt: MAX_ATTEMPTS } }] }],
    },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true },
  });
  const results = { sent: 0, preview: 0, failed: 0 };
  for (const { id } of due) {
    const status = await deliverEmail(db, transport, id);
    if (status === "SENT") results.sent++;
    else if (status === "PREVIEW") results.preview++;
    else if (status === "FAILED") results.failed++;
  }
  return results;
}

/** Gives failed messages a fresh set of attempts (e.g. after fixing the provider settings). */
export async function requeueFailed(db: PrismaClient) {
  const { count } = await db.emailMessage.updateMany({
    where: { status: "FAILED" },
    data: { status: "PENDING", attempts: 0, lastError: null },
  });
  return count;
}

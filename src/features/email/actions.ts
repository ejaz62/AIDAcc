"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { AUDIT_ACTIONS, writeAudit } from "@/features/admin/audit";
import { requireAdmin } from "@/features/admin/session";
import { deliverEmail, enqueueEmail, processOutbox, requeueFailed } from "./outbox";
import { getEmailTransport } from "./server";
import { testEmail } from "./templates";
import { resolveTransport } from "./transport";

export type EmailActionState = { ok?: boolean; error?: string; message?: string };

export async function sendTestEmail(): Promise<EmailActionState> {
  const me = await requireAdmin();
  const { transport, status } = resolveTransport();
  const db = getDb();
  const { id } = await enqueueEmail(db, { kind: "test", to: me.email, email: testEmail({ recipientName: me.name, provider: status.provider }) });
  const result = await deliverEmail(db, transport, id);
  await writeAudit(db, me, AUDIT_ACTIONS.testEmailSent, { type: "email", id }, { result: String(result) });
  refresh();
  if (result === "SENT") return { ok: true, message: `Test email sent to ${me.email}.` };
  if (result === "PREVIEW") return { ok: true, message: "Recorded in preview mode (not sent). Open it below to see how it looks." };
  return { error: "The test email could not be sent. See the error shown in the list below." };
}

export async function retryEmails(): Promise<EmailActionState> {
  const me = await requireAdmin();
  const db = getDb();
  const requeued = await requeueFailed(db);
  const result = await processOutbox(db, getEmailTransport());
  await writeAudit(db, me, AUDIT_ACTIONS.emailsRetried, undefined, { requeued, ...result });
  refresh();
  return { ok: true, message: `Processed: ${result.sent} sent, ${result.preview} recorded in preview, ${result.failed} failed.` };
}

const modeSchema = z.enum(["NONE", "INSTANT", "DAILY"]);

export async function setNotificationMode(_prev: EmailActionState, formData: FormData): Promise<EmailActionState> {
  const me = await requireAdmin();
  const mode = modeSchema.safeParse(formData.get("notificationMode"));
  if (!mode.success) return { error: "Choose one of the options." };
  await getDb().user.update({ where: { id: me.id }, data: { notificationMode: mode.data } });
  await writeAudit(getDb(), me, AUDIT_ACTIONS.notificationsChanged, { type: "user", id: me.id }, { mode: mode.data });
  refresh();
  return { ok: true, message: "Email preference saved." };
}

import "server-only";
import { after } from "next/server";
import { getDb } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-config";
import { deliverEmail } from "./outbox";
import { queueNewAdmissionEmails, queueNewRegistrationEmails } from "./notifications";
import { resolveTransport } from "./transport";

export const getEmailTransport = () => resolveTransport().transport;

/**
 * Queues the emails for a new registration, then delivers them after the
 * response has been sent, so the visitor never waits for the email provider.
 * Anything that fails is retried by the daily job.
 */
export async function notifyNewRegistration(registrationId: string) {
  const db = getDb();
  const ids = await queueNewRegistrationEmails(db, registrationId, getSiteUrl());
  if (ids.length === 0) return;
  after(async () => {
    const transport = getEmailTransport();
    for (const id of ids) await deliverEmail(db, transport, id);
  });
}

/** Queues and (after the response) delivers the emails for a new admission application. */
export async function notifyNewAdmission(applicationId: string) {
  const db = getDb();
  const ids = await queueNewAdmissionEmails(db, applicationId, getSiteUrl());
  if (ids.length === 0) return;
  after(async () => {
    const transport = getEmailTransport();
    for (const id of ids) await deliverEmail(db, transport, id);
  });
}

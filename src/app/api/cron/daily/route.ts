import { timingSafeEqual } from "node:crypto";
import { connection } from "next/server";
import { getDb } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-config";
import { getEmailTransport } from "@/features/email/server";
import { processOutbox } from "@/features/email/outbox";
import { queueDailyDigest } from "@/features/email/notifications";
import { pruneOldRecords } from "@/features/maintenance/cleanup";

function authorised(header: string | null, secret: string) {
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header ?? "");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Daily job, called by the hosting scheduler (Vercel Cron sends
 * `Authorization: Bearer $CRON_SECRET`). Disabled unless CRON_SECRET is set.
 *  1. queues the daily registrations summary for staff who chose it
 *  2. delivers queued emails and retries failed ones
 *  3. removes expired and old records
 */
export async function GET(request: Request) {
  await connection();
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return new Response("Not configured", { status: 503 });
  if (!authorised(request.headers.get("authorization"), secret)) return new Response("Unauthorised", { status: 401 });

  const db = getDb();
  const digest = await queueDailyDigest(db, new Date(), getSiteUrl());
  const emails = await processOutbox(db, getEmailTransport());
  const removed = await pruneOldRecords(db);
  const summary = { digest, emails, removed };
  console.info("[cron/daily]", JSON.stringify(summary));
  return Response.json({ ok: true, ...summary });
}

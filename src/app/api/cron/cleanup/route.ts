import { timingSafeEqual } from "node:crypto";
import { connection } from "next/server";
import { getDb } from "@/lib/db";
import { pruneOldRecords } from "@/features/maintenance/cleanup";

function authorised(header: string | null, secret: string) {
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header ?? "");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Daily housekeeping, called by the hosting scheduler (Vercel Cron sends
 * `Authorization: Bearer $CRON_SECRET`). Disabled unless CRON_SECRET is set.
 */
export async function GET(request: Request) {
  await connection();
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return new Response("Not configured", { status: 503 });
  if (!authorised(request.headers.get("authorization"), secret)) return new Response("Unauthorised", { status: 401 });

  const removed = await pruneOldRecords(getDb());
  console.info("[cron/cleanup] removed", removed);
  return Response.json({ ok: true, removed });
}

import { connection } from "next/server";
import { getDb } from "@/lib/db";

/**
 * Health check for uptime monitors and deploy checks.
 * Reports only "ok"/"error" — never configuration or error details.
 */
export async function GET() {
  await connection();
  const started = Date.now();
  try {
    await getDb().$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", database: "ok", latencyMs: Date.now() - started });
  } catch (err) {
    console.error("[health] database check failed:", err instanceof Error ? err.message : err);
    return Response.json({ status: "error", database: "unreachable" }, { status: 503 });
  }
}

import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { getServerEnv } from "./env";

/** Salted SHA-256 of the client IP — used for rate limiting without storing raw IPs. */
export async function getClientIpHash(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || "unknown";
  return createHash("sha256").update(`${getServerEnv().IP_HASH_SALT}:${ip}`).digest("hex");
}

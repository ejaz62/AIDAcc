"use server";

import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { getClientIpHash } from "@/lib/request";
import { notifyNewRegistration } from "@/features/email/server";
import { createPrismaInterestRepository } from "./prisma-repository";
import { MESSAGES, submitInterest } from "./service";
import type { InterestFormState } from "./types";

/** Server Action for the Register Interest form. Public — no authentication by design. */
export async function registerInterest(
  _prev: InterestFormState,
  formData: FormData,
): Promise<InterestFormState> {
  try {
    const repo = createPrismaInterestRepository(getDb());
    return await submitInterest(formData, repo, {
      ipHash: await getClientIpHash(),
      now: new Date(),
      generateToken: randomUUID,
      onCreated: notifyNewRegistration,
    });
  } catch (err) {
    // Log server-side only; never leak internals (e.g. connection strings) to the browser.
    console.error("[registerInterest] submission failed:", err instanceof Error ? err.message : err);
    return { status: "error", message: MESSAGES.unavailable };
  }
}

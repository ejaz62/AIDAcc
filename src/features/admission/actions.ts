"use server";

import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { getClientIpHash } from "@/lib/request";
import { notifyNewAdmission } from "@/features/email/server";
import type { AdmissionFormState } from "./schema";
import { ADMISSION_MESSAGES, submitAdmission } from "./service";

/** Server Action for the public Admission form. Public — no authentication by design. */
export async function applyForAdmission(_prev: AdmissionFormState, formData: FormData): Promise<AdmissionFormState> {
  try {
    return await submitAdmission(formData, {
      db: getDb(),
      ipHash: await getClientIpHash(),
      now: new Date(),
      generateToken: randomUUID,
      onCreated: notifyNewAdmission,
    });
  } catch (err) {
    console.error("[applyForAdmission] submission failed:", err instanceof Error ? err.message : err);
    return { status: "error", message: ADMISSION_MESSAGES.unavailable };
  }
}

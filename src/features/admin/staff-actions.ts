"use server";

import { headers } from "next/headers";
import { refresh } from "next/cache";
import { z } from "zod";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { AUDIT_ACTIONS, writeAudit } from "./audit";
import { requireAdmin } from "./session";
import { inviteStaff, passwordSchema, resetStaffPassword, setStaffDisabled } from "./users";

export type StaffState = {
  ok?: boolean;
  error?: string;
  message?: string;
  /** Shown once to the admin, never stored in plain text. */
  temporaryPassword?: string;
  forEmail?: string;
  values?: Record<string, string>;
};

const userIdSchema = z.string().min(10).max(64).regex(/^[A-Za-z0-9_-]+$/);

export async function addStaff(_prev: StaffState, formData: FormData): Promise<StaffState> {
  const actor = await requireAdmin();
  const values = { name: String(formData.get("name") ?? ""), email: String(formData.get("email") ?? "") };
  try {
    const { user, temporaryPassword } = await inviteStaff(getAuth(), getDb(), actor, values);
    refresh();
    return { ok: true, temporaryPassword, forEmail: user.email };
  } catch (err) {
    const message =
      err instanceof z.ZodError ? err.issues.map((i) => i.message).join(" ") : err instanceof Error ? err.message : "Could not add staff member.";
    return { error: message, values };
  }
}

export async function resetPasswordFor(userId: string): Promise<StaffState> {
  const actor = await requireAdmin();
  if (!userIdSchema.safeParse(userId).success) return { error: "Invalid request." };
  try {
    const { user, temporaryPassword } = await resetStaffPassword(getAuth(), getDb(), actor, userId);
    refresh();
    return { ok: true, temporaryPassword, forEmail: user.email };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not reset password." };
  }
}

export async function setDisabled(userId: string, disabled: boolean): Promise<StaffState> {
  const actor = await requireAdmin();
  if (!userIdSchema.safeParse(userId).success) return { error: "Invalid request." };
  try {
    await setStaffDisabled(getDb(), actor, userId, disabled);
    refresh();
    return { ok: true, message: disabled ? "Account disabled and signed out." : "Account re-enabled." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update account." };
  }
}

// --- Own account -----------------------------------------------------------------

export async function changeOwnPassword(_prev: StaffState, formData: FormData): Promise<StaffState> {
  const actor = await requireAdmin();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  if (newPassword !== formData.get("confirmPassword")) return { error: "The new passwords do not match." };
  const strength = passwordSchema.safeParse(newPassword);
  if (!strength.success) return { error: strength.error.issues[0]?.message };
  if (newPassword === currentPassword) return { error: "Choose a password different from your current one." };
  try {
    await getAuth().api.changePassword({
      body: { currentPassword, newPassword, revokeOtherSessions: true },
      headers: await headers(),
    });
  } catch {
    return { error: "Your current password is incorrect." };
  }
  await writeAudit(getDb(), actor, AUDIT_ACTIONS.passwordChanged, { type: "user", id: actor.id });
  return { ok: true, message: "Password changed. Other devices have been signed out." };
}

"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/db";
import {
  addNote,
  DELETE_REASONS,
  deleteRegistration,
  idSchema,
  noteSchema,
  STATUSES,
  updateStatus,
} from "./registrations";
import { requireAdmin } from "./session";

export type ActionState = { ok?: boolean; error?: string; reason?: string };

const statusSchema = z.enum(STATUSES.map((s) => s.value) as ["NEW", "CONTACTED", "ARCHIVED"]);
const reasonSchema = z.enum(DELETE_REASONS.map((r) => r.value) as [string, ...string[]]);

export async function changeStatus(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireAdmin();
  const parsedId = idSchema.safeParse(id);
  const status = statusSchema.safeParse(formData.get("status"));
  if (!parsedId.success || !status.success) return { error: "Invalid request." };
  const found = await updateStatus(getDb(), actor, parsedId.data, status.data);
  if (!found) return { error: "This registration no longer exists." };
  refresh();
  return { ok: true };
}

export async function createNote(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireAdmin();
  const parsedId = idSchema.safeParse(id);
  const body = noteSchema.safeParse(formData.get("body"));
  if (!parsedId.success) return { error: "Invalid request." };
  if (!body.success) return { error: body.error.issues[0]?.message ?? "Invalid note." };
  const found = await addNote(getDb(), actor, parsedId.data, body.data);
  if (!found) return { error: "This registration no longer exists." };
  refresh();
  return { ok: true };
}

export async function removeRegistration(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireAdmin();
  const parsedId = idSchema.safeParse(id);
  const reason = reasonSchema.safeParse(formData.get("reason"));
  if (!parsedId.success) return { error: "Invalid request." };
  if (!reason.success) return { error: "Please choose a reason for deleting." };
  if (formData.get("confirm") !== "DELETE") return { error: "Type DELETE in capitals to confirm.", reason: reason.data };
  await deleteRegistration(getDb(), actor, parsedId.data, reason.data);
  redirect("/admin/registrations?deleted=1");
}

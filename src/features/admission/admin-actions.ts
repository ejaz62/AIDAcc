"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/features/admin/session";
import {
  addAdmissionNote,
  admissionIdSchema,
  admissionNoteSchema,
  admissionStatusSchema,
  deleteAdmission,
  updateAdmissionStatus,
} from "./admin";

export type AdmissionActionState = { ok?: boolean; error?: string };

export async function changeAdmissionStatus(id: string, _prev: AdmissionActionState, formData: FormData): Promise<AdmissionActionState> {
  const actor = await requireAdmin();
  const parsedId = admissionIdSchema.safeParse(id);
  const status = admissionStatusSchema.safeParse(formData.get("status"));
  if (!parsedId.success || !status.success) return { error: "Invalid request." };
  if (!(await updateAdmissionStatus(getDb(), actor, parsedId.data, status.data))) return { error: "This application no longer exists." };
  refresh();
  return { ok: true };
}

export async function createAdmissionNote(id: string, _prev: AdmissionActionState, formData: FormData): Promise<AdmissionActionState> {
  const actor = await requireAdmin();
  const parsedId = admissionIdSchema.safeParse(id);
  const body = admissionNoteSchema.safeParse(formData.get("body"));
  if (!parsedId.success) return { error: "Invalid request." };
  if (!body.success) return { error: body.error.issues[0]?.message ?? "Invalid note." };
  if (!(await addAdmissionNote(getDb(), actor, parsedId.data, body.data))) return { error: "This application no longer exists." };
  refresh();
  return { ok: true };
}

export async function removeAdmission(id: string, _prev: AdmissionActionState, formData: FormData): Promise<AdmissionActionState> {
  const actor = await requireAdmin();
  const parsedId = admissionIdSchema.safeParse(id);
  if (!parsedId.success) return { error: "Invalid request." };
  if (formData.get("confirm") !== "DELETE") return { error: "Type DELETE in capitals to confirm." };
  await deleteAdmission(getDb(), actor, parsedId.data);
  redirect("/admin/admissions?deleted=1");
}

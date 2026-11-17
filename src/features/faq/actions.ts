"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { idSchema } from "@/features/admin/registrations";
import { requireAdmin } from "@/features/admin/session";
import { CONTENT_TAGS } from "@/features/content/tags";
import { createFaq, deleteFaq, faqInputSchema, setFaqStatus, updateFaq } from "./faq";

export type FaqFormState = { ok?: boolean; message?: string; error?: string; values?: Record<string, string> };

export async function saveFaq(id: string | null, _prev: FaqFormState, formData: FormData): Promise<FaqFormState> {
  const actor = await requireAdmin();
  const values = {
    question: String(formData.get("question") ?? ""),
    answer: String(formData.get("answer") ?? ""),
    sortOrder: String(formData.get("sortOrder") ?? "0"),
  };
  const parsed = faqInputSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form.", values };
  if (id) {
    if (!idSchema.safeParse(id).success) return { error: "Invalid request." };
    if (!(await updateFaq(getDb(), actor, id, parsed.data))) return { error: "This question no longer exists." };
    updateTag(CONTENT_TAGS.faq);
    refresh();
    return { ok: true, message: "Saved." };
  }
  await createFaq(getDb(), actor, parsed.data);
  updateTag(CONTENT_TAGS.faq);
  redirect("/admin/faq?created=1");
}

export async function changeFaqStatus(id: string, status: "DRAFT" | "PUBLISHED"): Promise<FaqFormState> {
  const actor = await requireAdmin();
  if (!idSchema.safeParse(id).success || (status !== "DRAFT" && status !== "PUBLISHED")) return { error: "Invalid request." };
  if (!(await setFaqStatus(getDb(), actor, id, status))) return { error: "This question no longer exists." };
  updateTag(CONTENT_TAGS.faq);
  refresh();
  return { ok: true, message: status === "PUBLISHED" ? "Published." : "Unpublished." };
}

export async function removeFaq(id: string): Promise<FaqFormState> {
  const actor = await requireAdmin();
  if (!idSchema.safeParse(id).success) return { error: "Invalid request." };
  await deleteFaq(getDb(), actor, id);
  updateTag(CONTENT_TAGS.faq);
  refresh();
  return { ok: true, message: "Deleted." };
}

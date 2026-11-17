"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/features/admin/session";
import { CONTENT_TAGS } from "@/features/content/tags";
import { restoreRevision, saveSection, sectionInputSchema } from "./knowledge";

export type KnowledgeFormState = { ok?: boolean; message?: string; error?: string; values?: Record<string, string> };

const keySchema = z.string().regex(/^[a-z0-9-]{2,40}$/);

export async function saveKnowledge(key: string, _prev: KnowledgeFormState, formData: FormData): Promise<KnowledgeFormState> {
  const actor = await requireAdmin();
  if (!keySchema.safeParse(key).success) return { error: "Invalid request." };
  const values = {
    title: String(formData.get("title") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    summaryRoman: String(formData.get("summaryRoman") ?? ""),
    summaryUrdu: String(formData.get("summaryUrdu") ?? ""),
    body: String(formData.get("body") ?? ""),
    note: String(formData.get("note") ?? ""),
  };
  const parsed = sectionInputSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form.", values };
  if (!(await saveSection(getDb(), actor, key, parsed.data))) return { error: "This section no longer exists." };
  updateTag(CONTENT_TAGS.knowledge);
  refresh();
  return { ok: true, message: "Saved. The website and Ask AIDA now use this version." };
}

export async function restoreKnowledge(revisionId: string): Promise<KnowledgeFormState> {
  const actor = await requireAdmin();
  if (!/^[a-z0-9]{20,40}$/i.test(revisionId)) return { error: "Invalid request." };
  const key = await restoreRevision(getDb(), actor, revisionId);
  if (!key) return { error: "That version no longer exists." };
  updateTag(CONTENT_TAGS.knowledge);
  refresh();
  return { ok: true, message: "Earlier version restored." };
}

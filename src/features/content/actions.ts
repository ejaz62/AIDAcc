"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { idSchema } from "@/features/admin/registrations";
import { requireAdmin } from "@/features/admin/session";
import {
  createProgramme,
  deleteProgramme,
  programmeInputSchema,
  setProgrammeStatus,
  SlugTakenError,
  updateProgramme,
} from "./programmes";
import { publishSiteContent, saveSiteDraft, siteContentSchema } from "./site-content";
import { CONTENT_TAGS } from "./tags";

export type FormState = {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
};

function fieldErrorsFrom(issues: Array<{ path: PropertyKey[]; message: string }>) {
  const out: Record<string, string> = {};
  for (const i of issues) out[String(i.path[0])] ??= i.message;
  return out;
}

const formValues = (fd: FormData) =>
  Object.fromEntries([...fd.entries()].filter(([k, v]) => !k.startsWith("$") && typeof v === "string")) as Record<
    string,
    string
  >;

// --- Programmes --------------------------------------------------------------

export async function saveProgramme(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireAdmin();
  const values = formValues(formData);
  const parsed = programmeInputSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Please correct the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error.issues), values };
  }
  let savedId: string;
  try {
    if (id) {
      if (!idSchema.safeParse(id).success) return { error: "Invalid request." };
      const p = await updateProgramme(getDb(), actor, id, parsed.data);
      if (!p) return { error: "This programme no longer exists." };
      savedId = p.id;
    } else {
      savedId = (await createProgramme(getDb(), actor, parsed.data)).id;
    }
  } catch (err) {
    if (err instanceof SlugTakenError) return { error: err.message, fieldErrors: { slug: err.message }, values };
    if (err instanceof Error && err.message.startsWith("A published programme")) return { error: err.message, values };
    throw err;
  }
  updateTag(CONTENT_TAGS.programmes);
  if (!id) redirect(`/admin/programmes/${savedId}?created=1`);
  refresh();
  return { ok: true, message: "Changes saved." };
}

export async function changeProgrammeStatus(id: string, status: "DRAFT" | "PUBLISHED"): Promise<FormState> {
  const actor = await requireAdmin();
  if (!idSchema.safeParse(id).success || (status !== "DRAFT" && status !== "PUBLISHED")) return { error: "Invalid request." };
  const result = await setProgrammeStatus(getDb(), actor, id, status);
  if (!result.ok) return { error: result.error };
  updateTag(CONTENT_TAGS.programmes);
  refresh();
  return { ok: true, message: status === "PUBLISHED" ? "Published — now visible on the website." : "Unpublished — hidden from the website." };
}

export async function removeProgramme(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireAdmin();
  if (!idSchema.safeParse(id).success) return { error: "Invalid request." };
  if (formData.get("confirm") !== "DELETE") return { error: "Type DELETE in capitals to confirm." };
  await deleteProgramme(getDb(), actor, id);
  updateTag(CONTENT_TAGS.programmes);
  redirect("/admin/programmes?deleted=1");
}

// --- Site details --------------------------------------------------------------

export async function saveSiteDetails(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireAdmin();
  const values = formValues(formData);
  const parsed = siteContentSchema.safeParse({ ...values, showPreviewNotice: formData.get("showPreviewNotice") === "on", assistantEnabled: formData.get("assistantEnabled") === "on" });
  if (!parsed.success) {
    return { error: "Please correct the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error.issues), values };
  }
  await saveSiteDraft(getDb(), actor, parsed.data);
  if (formData.get("intent") === "publish") {
    await publishSiteContent(getDb(), actor);
    updateTag(CONTENT_TAGS.site);
    refresh();
    return { ok: true, message: "Published — the website now shows these details." };
  }
  refresh();
  return { ok: true, message: "Draft saved. Not yet visible on the website." };
}

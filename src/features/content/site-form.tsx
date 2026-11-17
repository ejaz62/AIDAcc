"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { describedBy, Field, inputClasses } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import { saveSiteDetails, type FormState } from "./actions";
import type { SiteContent } from "./site-content";

const contactFields = [
  { name: "contactEmail", label: "Official email address", type: "email", max: 254 },
  { name: "contactPhone", label: "Telephone number", type: "tel", max: 40 },
] as const;

const longFields = [
  { name: "contactAddress", label: "Postal address", rows: 3, max: 500 },
  { name: "mission", label: "Mission and vision", rows: 5, max: 3000 },
  { name: "leadership", label: "Leadership and team", rows: 5, max: 3000 },
  { name: "history", label: "History", rows: 5, max: 3000 },
  { name: "accreditation", label: "Accreditation and recognition", rows: 5, max: 3000 },
  { name: "location", label: "Location", rows: 2, max: 500 },
] as const;

export function SiteDetailsForm({ draft }: { draft: SiteContent }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveSiteDetails, {});
  const err = state.fieldErrors ?? {};
  const val = (k: keyof SiteContent) => state.values?.[k] ?? String(draft[k] ?? "");
  const k = state.values ? "v" : "i";

  return (
    <form action={action} className="space-y-8" noValidate>
      <div aria-live="polite">
        {state.error && (
          <div className="flex gap-3 rounded-(--radius-control) border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">
            <AlertCircle className="mt-0.5 size-4.5 shrink-0" aria-hidden />
            <p>{state.error}</p>
          </div>
        )}
        {state.ok && (
          <div className="flex gap-3 rounded-(--radius-control) border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 size-4.5 shrink-0" aria-hidden />
            <p>{state.message}</p>
          </div>
        )}
      </div>

      <fieldset className="space-y-5">
        <legend className="mb-4 text-base font-bold text-ink-950">Contact details</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          {contactFields.map((f) => (
            <Field key={f.name} id={f.name} label={f.label} error={err[f.name]} optional>
              <input
                id={f.name}
                name={f.name}
                type={f.type}
                maxLength={f.max}
                defaultValue={val(f.name)}
                key={`${f.name}-${k}`}
                aria-invalid={!!err[f.name]}
                aria-describedby={describedBy(f.name, { error: !!err[f.name] })}
                className={inputClasses(!!err[f.name])}
              />
            </Field>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="mb-4 text-base font-bold text-ink-950">Address and About page</legend>
        {longFields.map((f) => (
          <Field key={f.name} id={f.name} label={f.label} error={err[f.name]} optional>
            <textarea
              id={f.name}
              name={f.name}
              rows={f.rows}
              maxLength={f.max}
              defaultValue={val(f.name)}
              key={`${f.name}-${k}`}
              aria-invalid={!!err[f.name]}
              aria-describedby={describedBy(f.name, { error: !!err[f.name] })}
              className={cn(inputClasses(!!err[f.name]), "resize-y")}
            />
          </Field>
        ))}
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-base font-bold text-ink-950">Development preview notice</legend>
        <label className="flex gap-3 text-sm text-ink-700">
          <input
            type="checkbox"
            name="showPreviewNotice"
            defaultChecked={state.values ? state.values.showPreviewNotice === "on" : draft.showPreviewNotice}
            key={`notice-${k}`}
            className="mt-0.5 size-5 shrink-0 accent-brand-600"
          />
          <span>
            Show the &ldquo;development preview — wording is provisional&rdquo; strip across the website. Untick once the
            official information has been published.
          </span>
        </label>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-base font-bold text-ink-950">Ask AIDA assistant</legend>
        <label className="flex gap-3 text-sm text-ink-700">
          <input
            type="checkbox"
            name="assistantEnabled"
            defaultChecked={state.values ? state.values.assistantEnabled === "on" : draft.assistantEnabled}
            key={`assistant-${k}`}
            className="mt-0.5 size-5 shrink-0 accent-brand-600"
          />
          <span>Show the &ldquo;Ask AIDA&rdquo; assistant on the website.</span>
        </label>
      </fieldset>

      <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row">
        <Button type="submit" name="intent" value="draft" variant="secondary" size="lg" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Save draft
        </Button>
        <Button type="submit" name="intent" value="publish" size="lg" disabled={pending}>
          Save and publish
        </Button>
      </div>
    </form>
  );
}

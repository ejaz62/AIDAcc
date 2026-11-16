"use client";

import { useActionState, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { describedBy, Field, inputClasses } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import { changeProgrammeStatus, removeProgramme, saveProgramme, type FormState } from "./actions";
import { slugify } from "./slug";

export interface ProgrammeFormValues {
  title: string;
  slug: string;
  summary: string;
  overview: string;
  audience: string;
  duration: string;
  studyFormat: string;
  entryRequirements: string;
  fees: string;
  sortOrder: number;
}

function Notice({ state }: { state: FormState }) {
  if (state.error)
    return (
      <div className="flex gap-3 rounded-(--radius-control) border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">
        <AlertCircle className="mt-0.5 size-4.5 shrink-0" aria-hidden />
        <p>{state.error}</p>
      </div>
    );
  if (state.ok && state.message)
    return (
      <div className="flex gap-3 rounded-(--radius-control) border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-800">
        <CheckCircle2 className="mt-0.5 size-4.5 shrink-0" aria-hidden />
        <p>{state.message}</p>
      </div>
    );
  return null;
}

const textFields: Array<{
  name: keyof ProgrammeFormValues;
  label: string;
  hint?: string;
  rows?: number;
  max: number;
}> = [
  { name: "summary", label: "Summary", hint: "One or two sentences shown on the programme card. Required to publish.", rows: 2, max: 300 },
  { name: "overview", label: "Overview", hint: "Required to publish.", rows: 6, max: 5000 },
  { name: "audience", label: "Who it is for", rows: 3, max: 3000 },
  { name: "duration", label: "Duration", hint: "For example: 12 weeks, part-time.", max: 200 },
  { name: "studyFormat", label: "Study format", hint: "For example: online, live sessions.", max: 200 },
  { name: "entryRequirements", label: "Entry requirements", rows: 3, max: 3000 },
  { name: "fees", label: "Fees", hint: "Enter only officially approved fee information.", rows: 3, max: 3000 },
];

export function ProgrammeForm({ id, initial, published }: { id: string | null; initial: ProgrammeFormValues; published?: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProgramme.bind(null, id), {});
  const v = (k: keyof ProgrammeFormValues) => state.values?.[k] ?? String(initial[k] ?? "");
  const err = state.fieldErrors ?? {};
  const [title, setTitle] = useState(v("title"));
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug));
  const [slug, setSlug] = useState(v("slug"));
  const shownSlug = slugTouched ? slug : slugify(title);

  return (
    <form action={action} className="space-y-6" noValidate>
      <div aria-live="polite">
        <Notice state={state} />
      </div>
      {published && (
        <p className="rounded-(--radius-control) border border-brand-200 bg-brand-50 p-3.5 text-sm text-brand-900">
          This programme is <strong>published</strong>. Saved changes appear on the website immediately.
        </p>
      )}

      <Field id="title" label="Title" error={err.title}>
        <input
          id="title"
          name="title"
          required
          maxLength={150}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={!!err.title}
          aria-describedby={describedBy("title", { error: !!err.title })}
          className={inputClasses(!!err.title)}
        />
      </Field>

      <Field id="slug" label="Web address" hint="Lower-case letters, numbers and hyphens." error={err.slug}>
        <div className="flex items-stretch overflow-hidden rounded-(--radius-control)">
          <span className="hidden items-center rounded-l-(--radius-control) border border-r-0 border-ink-300 bg-ink-50 px-3 text-sm text-ink-500 sm:flex">
            /programmes/
          </span>
          <input
            id="slug"
            name="slug"
            maxLength={80}
            value={shownSlug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            aria-invalid={!!err.slug}
            aria-describedby={describedBy("slug", { hint: true, error: !!err.slug })}
            className={cn(inputClasses(!!err.slug), "sm:rounded-l-none")}
          />
        </div>
      </Field>

      {textFields.map((f) => (
        <Field key={f.name} id={f.name} label={f.label} hint={f.hint} error={err[f.name]} optional={f.name !== "summary" && f.name !== "overview"}>
          {f.rows ? (
            <textarea
              id={f.name}
              name={f.name}
              rows={f.rows}
              maxLength={f.max}
              defaultValue={v(f.name)}
              key={`${f.name}-${state.values ? "v" : "i"}`}
              aria-invalid={!!err[f.name]}
              aria-describedby={describedBy(f.name, { hint: !!f.hint, error: !!err[f.name] })}
              className={cn(inputClasses(!!err[f.name]), "resize-y")}
            />
          ) : (
            <input
              id={f.name}
              name={f.name}
              maxLength={f.max}
              defaultValue={v(f.name)}
              key={`${f.name}-${state.values ? "v" : "i"}`}
              aria-invalid={!!err[f.name]}
              aria-describedby={describedBy(f.name, { hint: !!f.hint, error: !!err[f.name] })}
              className={inputClasses(!!err[f.name])}
            />
          )}
        </Field>
      ))}

      <Field id="sortOrder" label="Display order" hint="Lower numbers appear first." optional>
        <input
          id="sortOrder"
          name="sortOrder"
          type="number"
          min={0}
          max={9999}
          defaultValue={v("sortOrder") || "0"}
          aria-describedby="sortOrder-hint"
          className={cn(inputClasses(), "max-w-32")}
        />
      </Field>

      <div className="flex flex-wrap gap-3 border-t border-border pt-6">
        <Button type="submit" size="lg" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {id ? "Save changes" : "Create draft"}
        </Button>
      </div>
    </form>
  );
}

export function PublishControls({ id, status, blockers }: { id: string; status: "DRAFT" | "PUBLISHED"; blockers: string[] }) {
  const [state, setState] = useState<FormState>({});
  const [pending, start] = useTransition();
  const next = status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        {status === "PUBLISHED"
          ? "Visible on the public website."
          : blockers.length
            ? `Not visible on the website. Add ${blockers.join(" and ")} to publish.`
            : "Not visible on the website. Publish when the details are verified."}
      </p>
      <Button
        type="button"
        variant={status === "PUBLISHED" ? "secondary" : "primary"}
        disabled={pending || (status === "DRAFT" && blockers.length > 0)}
        onClick={() => start(async () => setState(await changeProgrammeStatus(id, next)))}
        className="w-full"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : status === "PUBLISHED" ? (
          <EyeOff className="size-4" aria-hidden />
        ) : (
          <Eye className="size-4" aria-hidden />
        )}
        {status === "PUBLISHED" ? "Unpublish" : "Publish"}
      </Button>
      <div aria-live="polite">
        {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
        {state.ok && <p className="text-sm font-medium text-emerald-700">{state.message}</p>}
      </div>
    </div>
  );
}

export function DeleteProgramme({ id, registrations }: { id: string; registrations: number }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(removeProgramme.bind(null, id), {});
  if (!open)
    return (
      <Button
        type="button"
        variant="secondary"
        onClick={() => setOpen(true)}
        className="w-full text-red-700 ring-red-200 hover:bg-red-50 hover:ring-red-300"
      >
        <Trash2 className="size-4" aria-hidden /> Delete programme…
      </Button>
    );
  return (
    <form action={action} className="space-y-3 rounded-(--radius-control) border border-red-200 bg-red-50 p-4">
      <p className="text-sm text-red-900">
        This permanently deletes the programme.
        {registrations > 0 &&
          ` ${registrations === 1 ? "1 registration mentions" : `${registrations} registrations mention`} it; they will be kept but no longer linked.`}
      </p>
      <label htmlFor="confirm-delete" className="block text-sm font-semibold text-ink-800">
        Type <span className="font-mono">DELETE</span> to confirm
      </label>
      <input id="confirm-delete" name="confirm" autoComplete="off" className={cn(inputClasses(), "py-2.5")} />
      {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="bg-red-600 hover:bg-red-700 hover:shadow-none">
          Delete
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

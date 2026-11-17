"use client";

import { useActionState, useState, useTransition } from "react";
import { History, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, inputClasses } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import { restoreKnowledge, saveKnowledge, type KnowledgeFormState } from "./actions";

export function KnowledgeEditor({
  sectionKey,
  initial,
}: {
  sectionKey: string;
  initial: { title: string; summary: string; body: string };
}) {
  const [state, action, pending] = useActionState<KnowledgeFormState, FormData>(saveKnowledge.bind(null, sectionKey), {});
  const v = state.values ?? { ...initial, note: "" };
  const k = state.values ? "v" : "i";
  return (
    <form action={action} className="space-y-5" noValidate>
      <div aria-live="polite">
        {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{state.error}</p>}
        {state.ok && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">{state.message}</p>}
      </div>
      <Field id="kb-title" label="Section title">
        <input id="kb-title" name="title" maxLength={120} defaultValue={v.title} key={`t-${k}`} className={inputClasses()} />
      </Field>
      <Field
        id="kb-summary"
        label="Short answer"
        hint="What Ask AIDA replies when someone asks about this topic. Keep it to 1–3 sentences."
      >
        <textarea
          id="kb-summary"
          name="summary"
          rows={4}
          maxLength={1500}
          defaultValue={v.summary}
          key={`s-${k}`}
          aria-describedby="kb-summary-hint"
          className={cn(inputClasses(), "resize-y")}
        />
      </Field>
      <Field
        id="kb-body"
        label="Full content"
        hint="Shown on the website. Formatting: **bold**, - bullet list, 1. numbered list, ## heading, | tables |."
      >
        <textarea
          id="kb-body"
          name="body"
          rows={16}
          maxLength={20000}
          defaultValue={v.body}
          key={`b-${k}`}
          aria-describedby="kb-body-hint"
          className={cn(inputClasses(), "resize-y font-mono text-sm")}
        />
      </Field>
      <Field id="kb-note" label="What changed?" optional hint="A short note for the version history.">
        <input id="kb-note" name="note" maxLength={200} defaultValue={v.note} key={`n-${k}`} aria-describedby="kb-note-hint" className={inputClasses()} />
      </Field>
      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        Save new version
      </Button>
    </form>
  );
}

export function RestoreButton({ revisionId, label }: { revisionId: string; label: string }) {
  const [state, setState] = useState<KnowledgeFormState>({});
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {confirming ? (
        <>
          <Button size="sm" disabled={pending} onClick={() => start(async () => setState(await restoreKnowledge(revisionId)))}>
            Restore this version
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </>
      ) : (
        <Button size="sm" variant="secondary" onClick={() => setConfirming(true)} aria-label={`Restore ${label}`}>
          <History className="size-4" aria-hidden /> Restore
        </Button>
      )}
      {state.error && <span className="text-xs font-medium text-red-600">{state.error}</span>}
      {state.ok && <span className="text-xs font-medium text-emerald-700">{state.message}</span>}
    </span>
  );
}
